import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { LatLng, PlaceRecommendation } from '../types';
import { generateMapShareUrl, copyToClipboard } from '../utils/share';
import {
  Layers,
  Locate,
  Navigation,
  ExternalLink,
  MessageSquarePlus,
  ZoomIn,
  ZoomOut,
  Compass,
  Mountain,
  Satellite as SatelliteIcon,
  Map as MapIcon,
  Globe,
  Check,
  Share2,
  Copy,
  Link2,
} from 'lucide-react';

interface InteractiveMapProps {
  center: LatLng;
  initialZoom?: number;
  initialLayer?: MapLayerType;
  locationName: string;
  places: PlaceRecommendation[];
  selectedPlaceId?: string | null;
  onSelectPlace: (place: PlaceRecommendation) => void;
  onMapClickLocation: (location: { lat: number; lng: number; name?: string }) => void;
  onAskAboutPlace: (placeTitle: string) => void;
  onLocateMe: () => void;
  isLocating?: boolean;
  onViewportChange?: (viewport: { lat: number; lng: number; zoom: number }) => void;
}

export type MapLayerType = 'street' | 'satellite' | 'terrain' | 'osm' | 'light';

interface TileLayerMeta {
  name: string;
  shortLabel: string;
  description: string;
  url: string;
  attribution: string;
  maxZoom?: number;
  icon: React.ComponentType<{ className?: string }>;
}

const TILE_LAYERS: Record<MapLayerType, TileLayerMeta> = {
  street: {
    name: 'Standard Street',
    shortLabel: 'Street',
    description: 'Clear street grid, neighborhoods, points of interest, and roads',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
    icon: MapIcon,
  },
  satellite: {
    name: 'Satellite View',
    shortLabel: 'Satellite',
    description: 'High-resolution orbital aerial photography and true landscape imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
    maxZoom: 18,
    icon: SatelliteIcon,
  },
  terrain: {
    name: 'Topographic Terrain',
    shortLabel: 'Terrain',
    description: 'Hillshading, contour elevations, mountain passes, and natural geography',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, USGS, FAO, NPS, NRCAN',
    maxZoom: 18,
    icon: Mountain,
  },
  osm: {
    name: 'OpenStreetMap',
    shortLabel: 'OSM',
    description: 'Classic open collaborative worldwide mapping with local footways',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    icon: Globe,
  },
  light: {
    name: 'Clean Light',
    shortLabel: 'Light',
    description: 'Minimalist low-distraction layout ideal for dense place markers',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
    icon: Layers,
  },
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  center,
  initialZoom = 13,
  initialLayer = 'street',
  locationName,
  places,
  selectedPlaceId,
  onSelectPlace,
  onMapClickLocation,
  onAskAboutPlace,
  onLocateMe,
  isLocating = false,
  onViewportChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const layerMenuRef = useRef<HTMLDivElement>(null);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>(initialLayer);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [currentZoom, setCurrentZoom] = useState<number>(initialZoom);
  const [currentMapCenter, setCurrentMapCenter] = useState<LatLng>(center);

  // Share state
  const [isShareCopied, setIsShareCopied] = useState(false);
  const [shareToastMessage, setShareToastMessage] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Close layer menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (layerMenuRef.current && !layerMenuRef.current.contains(e.target as Node)) {
        setShowLayerMenu(false);
      }
    };
    if (showLayerMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showLayerMenu]);

  // Handle Copy Share Link
  const handleCopyShareLink = async () => {
    const c = mapRef.current ? mapRef.current.getCenter() : center;
    const z = mapRef.current ? mapRef.current.getZoom() : currentZoom;

    const shareUrl = generateMapShareUrl({
      lat: c.lat,
      lng: c.lng,
      zoom: z,
      name: locationName,
      layer: activeLayer,
    });

    // Update browser URL without refresh
    try {
      window.history.replaceState(null, '', shareUrl);
    } catch {
      // ignore
    }

    const copied = await copyToClipboard(shareUrl);
    if (copied) {
      setIsShareCopied(true);
      setShareToastMessage(`Map link copied! Lat: ${c.lat.toFixed(4)}°, Lng: ${c.lng.toFixed(4)}°, Zoom: ${z}`);
      setTimeout(() => setIsShareCopied(false), 2500);
      setTimeout(() => setShareToastMessage(null), 3800);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [center.lat, center.lng],
      zoom: initialZoom,
      zoomControl: false,
    });

    // Add base tile layer
    const layerConfig = TILE_LAYERS[activeLayer];
    const tileLayer = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: 19,
    }).addTo(map);

    currentTileLayerRef.current = tileLayer;

    // Create markers layer group
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    // Track viewport changes (pan and zoom)
    const handleViewportUpdate = () => {
      const c = map.getCenter();
      const z = map.getZoom();
      setCurrentMapCenter({ lat: c.lat, lng: c.lng });
      setCurrentZoom(z);
      onViewportChange?.({ lat: c.lat, lng: c.lng, zoom: z });
    };

    map.on('moveend', handleViewportUpdate);
    map.on('zoomend', handleViewportUpdate);

    // Click on map to drop pin and select area
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClickLocation({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        name: `Custom Pin (${e.latlng.lat.toFixed(3)}, ${e.latlng.lng.toFixed(3)})`,
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update tile layer when activeLayer changes
  useEffect(() => {
    if (!mapRef.current) return;
    if (currentTileLayerRef.current) {
      mapRef.current.removeLayer(currentTileLayerRef.current);
    }
    const layerConfig = TILE_LAYERS[activeLayer];
    const newTileLayer = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: 19,
    }).addTo(mapRef.current);
    currentTileLayerRef.current = newTileLayer;
  }, [activeLayer]);

  // Fly to new center when center coordinates change
  useEffect(() => {
    if (!mapRef.current) return;
    const currentCenter = mapRef.current.getCenter();
    const distance = Math.hypot(currentCenter.lat - center.lat, currentCenter.lng - center.lng);
    
    // Only animate if position changed significantly
    if (distance > 0.0001) {
      mapRef.current.flyTo([center.lat, center.lng], mapRef.current.getZoom() || 13, {
        duration: 1.2,
      });
    }

    // Update center focus pin
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([center.lat, center.lng]);
    } else {
      const centerHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-blue-500/20 animate-ping"></div>
          <div class="relative w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
        </div>
      `;
      const centerIcon = L.divIcon({
        className: 'custom-user-pin',
        html: centerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([center.lat, center.lng], {
        icon: centerIcon,
        zIndexOffset: 100,
      }).addTo(mapRef.current);

      marker.bindPopup(`
        <div class="p-3 text-stone-800 font-sans text-xs">
          <p class="font-bold text-sm text-blue-600 mb-0.5">Active Center</p>
          <p class="text-stone-600 font-medium">${locationName}</p>
          <p class="text-stone-400 text-[10px] mt-1">${center.lat.toFixed(4)}°, ${center.lng.toFixed(4)}°</p>
        </div>
      `);

      userMarkerRef.current = marker;
    }
  }, [center.lat, center.lng, locationName]);

  // Render Place Markers
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    if (places.length === 0) return;

    const bounds = L.latLngBounds([[center.lat, center.lng]]);

    places.forEach((place, index) => {
      if (typeof place.lat !== 'number' || typeof place.lng !== 'number') return;

      bounds.extend([place.lat, place.lng]);

      const isSelected = selectedPlaceId === place.id;
      const indexNumber = index + 1;

      // Custom marker pin HTML
      const pinHtml = `
        <div class="custom-map-pin cursor-pointer flex flex-col items-center">
          <div class="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shadow-lg transition-all border-2 ${
            isSelected
              ? 'bg-amber-500 text-white border-white scale-125 ring-4 ring-amber-300/60'
              : 'bg-rose-600 text-white border-white hover:bg-rose-700'
          }">
            ${indexNumber}
          </div>
          <div class="w-2 h-1.5 -mt-0.5 bg-stone-700/50 clip-triangle"></div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'place-marker-icon',
        html: pinHtml,
        iconSize: [28, 36],
        iconAnchor: [14, 34],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([place.lat, place.lng], { icon });

      // Build popup content
      const googleMapsLink = place.uri
        ? `<a href="${place.uri}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium mt-2 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors">
            <span>Open in Google Maps</span>
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          </a>`
        : '';

      const snippetHtml = place.snippet
        ? `<p class="text-stone-600 text-xs mt-1 leading-snug line-clamp-3">${place.snippet}</p>`
        : '';

      const popupHtml = `
        <div class="p-3.5 max-w-[240px] font-sans">
          <div class="flex items-start gap-1.5">
            <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold shrink-0 mt-0.5">
              ${indexNumber}
            </span>
            <div class="flex-1 min-w-0">
              <h4 class="font-bold text-stone-900 text-sm leading-tight truncate">${place.title}</h4>
              ${snippetHtml}
            </div>
          </div>
          <div class="mt-2.5 pt-2 border-t border-stone-100 flex flex-col gap-1.5">
            ${googleMapsLink}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 280,
      });

      marker.on('click', () => {
        onSelectPlace(place);
      });

      markersLayerRef.current?.addLayer(marker);

      // Open popup if it's the selected place
      if (isSelected) {
        marker.openPopup();
      }
    });

    // If there are places, gently adjust bounds so user sees both center and markers
    if (places.length > 0 && !selectedPlaceId) {
      mapRef.current.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 15,
        animate: true,
      });
    }
  }, [places, selectedPlaceId]);

  // When selectedPlaceId changes, fly to it and open its popup
  useEffect(() => {
    if (!mapRef.current || !selectedPlaceId) return;
    const targetPlace = places.find((p) => p.id === selectedPlaceId);
    if (targetPlace && typeof targetPlace.lat === 'number' && typeof targetPlace.lng === 'number') {
      mapRef.current.flyTo([targetPlace.lat, targetPlace.lng], 16, {
        duration: 1.0,
      });
    }
  }, [selectedPlaceId, places]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-stone-100">
      {/* Map DOM Element */}
      <div id="atlas-leaflet-map" ref={mapContainerRef} className="w-full h-full" />

      {/* Top Floating Info Tag */}
      <div className="absolute top-4 left-4 z-[400] flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-md border border-stone-200/80 text-xs">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
        <span className="font-semibold text-stone-800">{locationName}</span>
        <span className="text-stone-400">|</span>
        <span className="text-stone-500 font-mono text-[11px]">
          {currentMapCenter.lat.toFixed(3)}°, {currentMapCenter.lng.toFixed(3)}°
        </span>
        <span className="text-stone-400">|</span>
        <span className="text-stone-500 text-[11px] font-mono">z{currentZoom}</span>
        <button
          id="quick-share-view-button"
          onClick={handleCopyShareLink}
          title="Copy share link for this map view"
          className={`ml-1 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
            isShareCopied
              ? 'bg-emerald-600 text-white font-semibold'
              : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
          }`}
        >
          {isShareCopied ? (
            <>
              <Check className="w-3 h-3 text-white" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3 h-3 text-blue-600" />
              <span>Share View</span>
            </>
          )}
        </button>
      </div>

      {/* Share Toast Banner */}
      {shareToastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-2.5 bg-stone-900/95 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-stone-700 text-xs animate-in fade-in slide-in-from-top-3 duration-200 max-w-[90vw] text-center">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium truncate">{shareToastMessage}</span>
        </div>
      )}

      {/* Top Layer Control Segmented Bar */}
      <div className="absolute top-4 right-16 z-[400] hidden sm:flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-stone-200/80">
        {(['street', 'satellite', 'terrain', 'light'] as MapLayerType[]).map((key) => {
          const item = TILE_LAYERS[key];
          const Icon = item.icon;
          const isActive = activeLayer === key;
          return (
            <button
              key={key}
              id={`quick-layer-${key}`}
              onClick={() => setActiveLayer(key)}
              title={item.description}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Floating Map Controls (Right Side) */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        {/* Layer Switcher Button & Dropdown */}
        <div ref={layerMenuRef} className="relative">
          <button
            id="map-layer-button"
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            title="Map Layer Styles"
            className={`w-10 h-10 rounded-xl backdrop-blur-md shadow-md border flex items-center justify-center transition-colors ${
              showLayerMenu
                ? 'bg-blue-600 text-white border-blue-700'
                : 'bg-white/95 text-stone-700 border-stone-200/80 hover:bg-stone-50 hover:text-stone-900'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 top-12 w-72 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-stone-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-2.5 py-2 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-stone-900">Map Style & Layers</p>
                  <p className="text-[10px] text-stone-500">Select base map cartography</p>
                </div>
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full capitalize">
                  {TILE_LAYERS[activeLayer].shortLabel}
                </span>
              </div>

              <div className="mt-1.5 space-y-1">
                {(Object.keys(TILE_LAYERS) as MapLayerType[]).map((key) => {
                  const item = TILE_LAYERS[key];
                  const Icon = item.icon;
                  const isActive = activeLayer === key;
                  return (
                    <button
                      key={key}
                      id={`layer-option-${key}`}
                      onClick={() => {
                        setActiveLayer(key);
                        setShowLayerMenu(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start gap-2.5 ${
                        isActive
                          ? 'bg-blue-50/80 text-blue-900 border border-blue-200/80 font-medium'
                          : 'text-stone-700 hover:bg-stone-50 border border-transparent'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs ${isActive ? 'font-bold text-blue-900' : 'font-semibold text-stone-800'}`}>
                            {item.name}
                          </p>
                          {isActive && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-snug">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Locate Me Button */}
        <button
          id="locate-me-button"
          onClick={onLocateMe}
          disabled={isLocating}
          title="Detect Current Location"
          className="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-md shadow-md border border-stone-200/80 flex items-center justify-center text-stone-700 hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-50"
        >
          <Locate className={`w-4 h-4 ${isLocating ? 'animate-spin text-blue-600' : ''}`} />
        </button>

        {/* Copy Share Link Button */}
        <button
          id="copy-map-share-link-button"
          onClick={handleCopyShareLink}
          title="Copy share link (encodes coordinates & zoom)"
          className={`w-10 h-10 rounded-xl backdrop-blur-md shadow-md border flex items-center justify-center transition-all ${
            isShareCopied
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-200 scale-105'
              : 'bg-white/95 text-stone-700 border-stone-200/80 hover:bg-blue-50 hover:text-blue-600'
          }`}
        >
          {isShareCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        </button>

        {/* Zoom In */}
        <button
          id="map-zoom-in"
          onClick={() => mapRef.current?.zoomIn()}
          title="Zoom In"
          className="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-md shadow-md border border-stone-200/80 flex items-center justify-center text-stone-700 hover:bg-stone-50 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          id="map-zoom-out"
          onClick={() => mapRef.current?.zoomOut()}
          title="Zoom Out"
          className="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-md shadow-md border border-stone-200/80 flex items-center justify-center text-stone-700 hover:bg-stone-50 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Map Helper Banner */}
      <div className="absolute bottom-4 left-4 z-[400] hidden sm:flex items-center gap-2 bg-stone-900/85 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-md">
        <Compass className="w-3.5 h-3.5 text-amber-400" />
        <span>Click anywhere on the map to drop a pin & ask Atlas about that area</span>
      </div>
    </div>
  );
};
