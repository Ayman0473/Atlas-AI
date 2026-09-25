import React, { useState, useEffect } from 'react';
import { InteractiveMap } from './components/InteractiveMap';
import { Navbar } from './components/Navbar';
import { ChatPanel } from './components/ChatPanel';
import { PlaceDetailModal } from './components/PlaceDetailModal';
import { CITY_PRESETS } from './data/presets';
import { ChatMessage, LatLng, LocationPreset, PlaceRecommendation } from './types';
import { generateMapShareUrl, parseMapShareUrl, copyToClipboard } from './utils/share';
import { saveRecentLocation } from './utils/recentLocations';
import { Map, MessageSquare, AlertCircle, Share2, Check, ExternalLink } from 'lucide-react';

export default function App() {
  // Check for shared map view in URL parameters
  const initialShared = parseMapShareUrl();

  // Map center coordinates
  const [center, setCenter] = useState<LatLng>(() => {
    if (initialShared) {
      return { lat: initialShared.lat, lng: initialShared.lng };
    }
    return {
      lat: CITY_PRESETS[0].lat,
      lng: CITY_PRESETS[0].lng,
    };
  });

  const [locationName, setLocationName] = useState<string>(() => {
    if (initialShared?.name) {
      return initialShared.name;
    }
    if (initialShared) {
      return `Shared Location (${initialShared.lat.toFixed(3)}, ${initialShared.lng.toFixed(3)})`;
    }
    return CITY_PRESETS[0].name;
  });

  // Track live viewport coordinates and zoom
  const [currentViewport, setCurrentViewport] = useState<{ lat: number; lng: number; zoom: number }>(() => ({
    lat: initialShared?.lat ?? CITY_PRESETS[0].lat,
    lng: initialShared?.lng ?? CITY_PRESETS[0].lng,
    zoom: initialShared?.zoom ?? 13,
  }));

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [places, setPlaces] = useState<PlaceRecommendation[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceRecommendation | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Share state
  const [isShareCopied, setIsShareCopied] = useState(false);
  const [sharedBannerInfo, setSharedBannerInfo] = useState<string | null>(() => {
    if (initialShared) {
      return `Loaded shared map view: ${initialShared.name || 'Custom Location'} (${initialShared.lat.toFixed(3)}°, ${initialShared.lng.toFixed(3)}°) at Zoom ${initialShared.zoom}`;
    }
    return null;
  });

  // Copy share link handler
  const handleCopyShareLink = async () => {
    const url = generateMapShareUrl({
      lat: currentViewport.lat,
      lng: currentViewport.lng,
      zoom: currentViewport.zoom,
      name: locationName,
    });

    try {
      window.history.replaceState(null, '', url);
    } catch {}

    const ok = await copyToClipboard(url);
    if (ok) {
      setIsShareCopied(true);
      setTimeout(() => setIsShareCopied(false), 2500);
    }
  };

  // Mobile layout tab toggle ('map' | 'chat')
  const [mobileTab, setMobileTab] = useState<'map' | 'chat'>('chat');

  // Handle User Geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCenter({ lat, lng });

        let detectedCity = 'My GPS Location';
        // Try reverse geocoding for a friendly name
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            {
              headers: {
                'User-Agent': 'AtlasMapChatbot/1.0',
                'Accept-Language': 'en',
              },
            }
          );
          if (res.ok) {
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.suburb || 'My Location';
            detectedCity = city;
            setLocationName(city);
          } else {
            setLocationName('My GPS Location');
          }
        } catch {
          setLocationName('My GPS Location');
        }

        saveRecentLocation({
          name: detectedCity,
          subtitle: 'Current Location',
          lat,
          lng,
          source: 'geolocation',
        });

        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setErrorMessage('Could not access device location. Please enable location permissions or select a city.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // City preset selection
  const handleSelectCity = (city: LocationPreset) => {
    setCenter({ lat: city.lat, lng: city.lng });
    setLocationName(city.name);
    setErrorMessage(null);
    saveRecentLocation({
      name: city.name,
      subtitle: city.country,
      lat: city.lat,
      lng: city.lng,
      source: 'preset',
    });
  };

  // Custom search selection
  const handleSelectCustomLocation = (loc: { lat: number; lng: number; name: string; subtitle?: string }) => {
    setCenter({ lat: loc.lat, lng: loc.lng });
    setLocationName(loc.name);
    setErrorMessage(null);
    saveRecentLocation({
      name: loc.name,
      subtitle: loc.subtitle,
      lat: loc.lat,
      lng: loc.lng,
      source: 'search',
    });
  };

  // Map click selection
  const handleMapClickLocation = (loc: { lat: number; lng: number; name?: string }) => {
    setCenter({ lat: loc.lat, lng: loc.lng });
    setLocationName(loc.name || 'Pinned Location');
  };

  // Select place to highlight on map and view details
  const handleSelectPlace = (place: PlaceRecommendation) => {
    setSelectedPlace(place);
    if (typeof place.lat === 'number' && typeof place.lng === 'number') {
      setCenter({ lat: place.lat, lng: place.lng });
    }
  };

  // Ask chatbot specifically about a place
  const handleAskAboutPlace = (placeTitle: string) => {
    handleSendMessage(`Tell me all about "${placeTitle}": what makes it special, popular items or highlights, and helpful visitor tips.`);
    // On mobile, switch to chat view
    setMobileTab('chat');
  };

  // Clear conversation
  const handleClearChat = () => {
    setMessages([]);
    setPlaces([]);
    setSelectedPlace(null);
    setErrorMessage(null);
  };

  // Send message to Gemini server endpoint
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      locationContext: {
        lat: center.lat,
        lng: center.lng,
        name: locationName,
      },
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: newHistory,
          location: {
            lat: center.lat,
            lng: center.lng,
            name: locationName,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.content,
        timestamp: Date.now(),
        places: data.places || [],
        groundingSources: data.groundingSources || [],
        locationContext: data.locationContext,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Merge new places into global places list for map markers
      if (data.places && data.places.length > 0) {
        setPlaces((prev) => {
          const existingIds = new Set(prev.map((p) => p.title.toLowerCase()));
          const novel = data.places.filter((p: PlaceRecommendation) => !existingIds.has(p.title.toLowerCase()));
          return [...prev, ...novel];
        });
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(err.message || 'Failed to get response from Atlas.');

      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `I ran into an issue fetching data for this location: ${err.message || 'Please try again'}.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-stone-100 text-stone-900">
      {/* Top Navbar */}
      <Navbar
        currentLocationName={locationName}
        onSelectCity={handleSelectCity}
        onSelectCustomLocation={handleSelectCustomLocation}
        onClearChat={handleClearChat}
        onLocateMe={handleLocateMe}
        isLocating={isLocating}
        onCopyShareLink={handleCopyShareLink}
        isShareCopied={isShareCopied}
      />

      {/* Shared Map View Welcome Banner */}
      {sharedBannerInfo && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between text-xs text-blue-800 shrink-0">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-medium">{sharedBannerInfo}</span>
          </div>
          <button
            onClick={() => setSharedBannerInfo(null)}
            className="text-blue-500 hover:text-blue-800 font-bold ml-4 text-sm"
          >
            &times;
          </button>
        </div>
      )}

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between text-xs text-rose-700 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 font-bold ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        {/* Map Panel: Full-height on desktop, toggleable on mobile */}
        <div
          className={`flex-1 h-full relative transition-all duration-300 ${
            mobileTab === 'map' ? 'block' : 'hidden md:block'
          }`}
        >
          <InteractiveMap
            center={center}
            initialZoom={initialShared?.zoom ?? 13}
            initialLayer={(initialShared?.layer as any) || 'street'}
            locationName={locationName}
            places={places}
            selectedPlaceId={selectedPlace?.id}
            onSelectPlace={handleSelectPlace}
            onMapClickLocation={handleMapClickLocation}
            onAskAboutPlace={handleAskAboutPlace}
            onLocateMe={handleLocateMe}
            isLocating={isLocating}
            onViewportChange={(vp) => setCurrentViewport(vp)}
          />

          {/* Place Details Modal / Popup on map */}
          <PlaceDetailModal
            place={selectedPlace}
            onClose={() => setSelectedPlace(null)}
            onAskAboutPlace={handleAskAboutPlace}
          />
        </div>

        {/* Chat Panel: 420px to 480px on desktop, full-width on mobile */}
        <div
          className={`w-full md:w-[450px] lg:w-[480px] h-full flex flex-col shrink-0 transition-all duration-300 ${
            mobileTab === 'chat' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            activeLocationName={locationName}
            activeLat={center.lat}
            activeLng={center.lng}
            onSendMessage={handleSendMessage}
            onSelectPlace={(place) => {
              handleSelectPlace(place);
              // On mobile, if clicking a place, flip to map so user sees the pin!
              if (window.innerWidth < 768) {
                setMobileTab('map');
              }
            }}
            selectedPlaceId={selectedPlace?.id}
          />
        </div>
      </div>

      {/* Mobile Bottom Navigation Toggle Bar */}
      <div className="md:hidden h-14 bg-white border-t border-stone-200 flex items-center justify-around px-4 z-40 shrink-0">
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2 flex flex-col items-center gap-1 text-xs font-semibold rounded-lg transition-colors ${
            mobileTab === 'chat' ? 'text-blue-600 bg-blue-50/70' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chatbot</span>
        </button>

        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-2 flex flex-col items-center gap-1 text-xs font-semibold rounded-lg transition-colors relative ${
            mobileTab === 'map' ? 'text-blue-600 bg-blue-50/70' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Map className="w-4 h-4" />
          <span>Interactive Map</span>
          {places.length > 0 && (
            <span className="absolute top-1.5 right-8 w-2 h-2 rounded-full bg-rose-500"></span>
          )}
        </button>
      </div>
    </div>
  );
}
