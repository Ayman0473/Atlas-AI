import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { classifyPlaceCategory } from './src/utils/categoryClassification';

dotenv.config();

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set. API calls will fail until configured.');
  }
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// In-memory geocoding cache to avoid duplicate calls
const geocodeCache = new Map<string, { lat: number; lng: number }>();

async function geocodePlace(query: string, nearLat?: number, nearLng?: number): Promise<{ lat: number; lng: number } | null> {
  const cacheKey = `${query}_${nearLat?.toFixed(2) || ''}_${nearLng?.toFixed(2) || ''}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    if (nearLat !== undefined && nearLng !== undefined) {
      // 0.5 degree bounding box around search location
      const viewbox = `${nearLng - 0.3},${nearLat + 0.3},${nearLng + 0.3},${nearLat - 0.3}`;
      url += `&viewbox=${viewbox}&bounded=0`;
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'AtlasMapChatbot/1.0 (LocationAssistant)',
        'Accept-Language': 'en',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const result = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        geocodeCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.error('Geocoding error for:', query, err);
  }

  return null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Geocode endpoint for user search bar
  app.get('/api/geocode', async (req, res) => {
    const q = req.query.q as string;
    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter q' });
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`,
        {
          headers: {
            'User-Agent': 'AtlasMapChatbot/1.0 (LocationAssistant)',
            'Accept-Language': 'en',
          },
        }
      );

      if (!response.ok) {
        return res.status(500).json({ error: 'Geocoding service unavailable' });
      }

      const results = await response.json();
      const formatted = results.map((item: any) => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type,
      }));

      res.json({ results: formatted });
    } catch (error) {
      console.error('Geocode search error:', error);
      res.status(500).json({ error: 'Failed to search location' });
    }
  });

  // Chat endpoint powered by Gemini 3.8 Flash and real-time Google Maps Grounding
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history, location } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      const ai = getGeminiClient();

      // Format current location description
      const hasLocation = location && typeof location.lat === 'number' && typeof location.lng === 'number';
      const userLat = hasLocation ? location.lat : 37.7749; // default San Francisco
      const userLng = hasLocation ? location.lng : -122.4194;
      const locationName = location?.name || 'the selected map area';

      const systemInstruction = `You are Atlas, an intelligent, friendly, and deeply knowledgeable map chatbot powered by real-time Google Maps data.
You answer location-specific questions, help users explore cities, discover restaurants, attractions, hidden gems, and get practical travel advice.

Key instructions:
1. Always use the Google Maps tool to ground your responses in real-time, verified places and data.
2. The user's active map focus is at latitude ${userLat.toFixed(5)}, longitude ${userLng.toFixed(5)} (${locationName}). Answer questions relative to this location unless the user explicitly mentions another city.
3. For recommended places, provide their exact business name, what makes them unique, atmosphere/vibe, and key practical details (e.g. price range, specialty dishes, opening highlights).
4. Organize your response clearly with Markdown headings, bullet points, and highlight place names in bold.
5. Keep answers engaging, vivid, concise, and helpful.`;

      // Build contents array with context
      const contents: any[] = [];

      // Include short past turns for context if present
      if (Array.isArray(history) && history.length > 0) {
        // Take up to 6 recent messages
        const recent = history.slice(-6);
        for (const turn of recent) {
          contents.push({
            role: turn.role === 'user' ? 'user' : 'model',
            parts: [{ text: turn.content }],
          });
        }
      }

      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      // Configure tools with Google Maps Grounding
      const config: any = {
        systemInstruction,
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: userLat,
              longitude: userLng,
            },
          },
        },
      };

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config,
        });
      } catch (geminiError: any) {
        console.warn('Google Maps grounding failed, retrying with search grounding or basic text:', geminiError.message);
        // Fallback without googleMaps tool if grounding encounters a transient error or region limitation
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
            tools: [{ googleSearch: {} }],
          },
        });
      }

      const responseText = response.text || 'I could not find specific location details for this query.';

      // Extract Google Maps and Web grounding metadata
      const candidate = response.candidates?.[0];
      const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];

      const rawPlaces: Array<{
        title: string;
        uri?: string;
        snippet?: string;
        reviewSnippets?: any[];
      }> = [];

      const groundingSources: Array<{
        title: string;
        uri: string;
        type: 'maps' | 'web';
        snippet?: string;
      }> = [];

      for (const chunk of groundingChunks as any[]) {
        if (chunk.maps) {
          const mapPlace = chunk.maps;
          const title = mapPlace.title || 'Google Maps Place';
          const uri = mapPlace.uri || (mapPlace.placeId ? `https://www.google.com/maps/place/?q=place_id:${mapPlace.placeId}` : undefined);
          const reviewSnippets = mapPlace.placeAnswerSources?.reviewSnippets || [];
          const snippet = reviewSnippets[0]?.text || mapPlace.snippet || '';

          rawPlaces.push({
            title,
            uri,
            snippet,
            reviewSnippets,
          });

          if (uri) {
            groundingSources.push({
              title,
              uri,
              type: 'maps',
              snippet,
            });
          }
        } else if (chunk.web) {
          groundingSources.push({
            title: chunk.web.title || 'Web Reference',
            uri: chunk.web.uri || '',
            type: 'web',
          });
        }
      }

      // Geocode discovered places to plot them onto the Leaflet map
      const placesWithCoords = await Promise.all(
        rawPlaces.slice(0, 10).map(async (p, idx) => {
          // Attempt geocoding near userLat, userLng
          const coords = await geocodePlace(p.title, userLat, userLng);
          
          let lat = coords?.lat;
          let lng = coords?.lng;

          // If geocoding didn't match, distribute gently around the target center for display
          if (lat === undefined || lng === undefined) {
            const angle = (idx * (2 * Math.PI)) / Math.max(1, rawPlaces.length);
            const radius = 0.008 + (idx * 0.003); // ~800m - 2km
            lat = userLat + radius * Math.cos(angle);
            lng = userLng + (radius * Math.sin(angle)) / Math.cos((userLat * Math.PI) / 180);
          }

          return {
            id: `place-${idx}-${Date.now()}`,
            title: p.title,
            uri: p.uri,
            category: classifyPlaceCategory(p.title, p.snippet),
            lat,
            lng,
            snippet: p.snippet,
            reviewSnippets: p.reviewSnippets,
          };
        })
      );

      return res.json({
        content: responseText,
        places: placesWithCoords,
        groundingSources,
        locationContext: {
          lat: userLat,
          lng: userLng,
          name: locationName,
        },
      });
    } catch (err: any) {
      console.error('Chat endpoint error:', err);
      return res.status(500).json({
        error: err?.message || 'An error occurred while communicating with Gemini.',
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
