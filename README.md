# Atlas AI — Interactive Map Chatbot

Atlas AI is an interactive map-based chatbot that leverages real-time Google Maps data and Google Gemini (`gemini-3.8-flash`) to answer location-specific questions, recommend local businesses, and explore neighborhoods worldwide with a synchronized interactive map.

---

## ✨ Features

- **Real-Time Google Maps Grounding**: Powered by `@google/genai` with server-side Google Maps tool integration. Recommendations are grounded in live place data, ratings, business hours, and review snippets.
- **Interactive Multi-Layer Map**: Built with Leaflet, offering one-click switching between:
  - **Standard Street**: Clear roads, transit routes, and POIs.
  - **Satellite View**: High-resolution orbital photography.
  - **Topographic Terrain**: Shaded relief, mountain passes, and contour elevations.
  - **OpenStreetMap**: Collaborative global mapping with pedestrian trails.
  - **Clean Light**: High-contrast minimal layout for marker focus.
- **Interactive Map Legend & Category Classification**: Color-coded, icon-distinguished map pins classified into canonical types (Restaurants & Dining, Landmarks & Culture, Parks & Nature, Coffee & Cafes, Bars & Nightlife, Shopping, and Attractions). Features an interactive, collapsible Map Legend on the map with active category counts and one-click category filtering.
- **Synchronized Pin Navigation**: Clicking places mentioned in chat automatically highlights and centers their pin on the map with popup cards and direct links to Google Maps.
- **Copy Share Link**: One-click sharing that encodes the active latitude, longitude, and zoom level into URL query parameters (`?lat=...&lng=...&z=...`) for instant deep-linking.
- **Location Discovery & Geocoding**: Search bar with real-time geocoding autocomplete, world city presets (Tokyo, Paris, New York, Rome, etc.), and GPS auto-detection.
- **Interactive Prompts**: Quick category suggestions for specialty coffee, local dining, historical landmarks, scenic parks, and hidden gems.
- **Responsive Split Design**: Side-by-side desktop layout and touch-friendly tab switching on mobile devices.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Leaflet, React Markdown, Motion
- **Backend / API**: Express 4, Node.js, `@google/genai` TypeScript SDK
- **Build Tool**: Vite 8, tsx, esbuild
- **Cartography**: Leaflet, CartoDB Voyager/Light, Esri World Imagery & Topo, OpenStreetMap, Nominatim Geocoding

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- A Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/atlas-map-chatbot.git
cd atlas-map-chatbot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

Set your Gemini API key in `.env`:

```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
```

> **Note**: In Google AI Studio Build, the `GEMINI_API_KEY` is automatically injected from your Secrets panel at runtime.

### 4. Run the Development Server

```bash
npm run dev
```

The application will start on `http://localhost:3000`.

---

## 📦 Production Build

To build the client SPA and bundle the Express server into `dist/`:

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
├── server.ts                 # Express server with /api/chat (Gemini Maps Grounding) and /api/geocode
├── index.html                # HTML entry point with Leaflet styling
├── metadata.json             # Applet capabilities and permission declarations
├── package.json              # Scripts and package dependencies
├── src/
│   ├── App.tsx               # Main application container, URL share parsing & state
│   ├── main.tsx              # React DOM entry point
│   ├── index.css             # Tailwind CSS & custom Leaflet styling
│   ├── types.ts              # TypeScript interfaces (LatLng, ChatMessage, PlaceRecommendation)
│   ├── components/
│   │   ├── InteractiveMap.tsx     # Leaflet map with layer controls and pin syncing
│   │   ├── ChatPanel.tsx          # Conversational UI with markdown & place cards
│   │   ├── Navbar.tsx             # Location search bar, city picker & share link button
│   │   └── PlaceDetailModal.tsx   # Detailed place review popup modal
│   ├── data/
│   │   └── presets.ts             # World city presets & category prompt templates
│   └── utils/
│       └── share.ts               # Share URL serializer, parser & clipboard copy helper
```

---

## 📄 License

This project is licensed under the Apache-2.0 License.
