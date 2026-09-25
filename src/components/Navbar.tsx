import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Sparkles,
  Navigation,
  Globe,
  Trash2,
  X,
  Check,
  Share2,
  History,
  Clock,
} from 'lucide-react';
import { CITY_PRESETS } from '../data/presets';
import { LocationPreset, RecentLocation } from '../types';
import {
  getStoredRecents,
  saveRecentLocation,
  deleteRecentLocation,
  clearAllRecents,
  formatRelativeTime,
} from '../utils/recentLocations';

interface NavbarProps {
  currentLocationName: string;
  onSelectCity: (preset: LocationPreset) => void;
  onSelectCustomLocation: (location: { lat: number; lng: number; name: string; subtitle?: string }) => void;
  onClearChat: () => void;
  onLocateMe: () => void;
  isLocating: boolean;
  onCopyShareLink?: () => void;
  isShareCopied?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLocationName,
  onSelectCity,
  onSelectCustomLocation,
  onClearChat,
  onLocateMe,
  isLocating,
  onCopyShareLink,
  isShareCopied = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showRecents, setShowRecents] = useState(false);
  const [recents, setRecents] = useState<RecentLocation[]>(getStoredRecents);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const cityPickerRef = useRef<HTMLDivElement>(null);
  const recentsRef = useRef<HTMLDivElement>(null);

  // Sync recents from localStorage when changed
  useEffect(() => {
    const handleUpdate = () => {
      setRecents(getStoredRecents());
    };
    window.addEventListener('atlas-recents-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('atlas-recents-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
          setIsDropdownOpen(true);
        }
      } catch (err) {
        console.error('Failed to search locations:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (cityPickerRef.current && !cityPickerRef.current.contains(event.target as Node)) {
        setShowCityPicker(false);
      }
      if (recentsRef.current && !recentsRef.current.contains(event.target as Node)) {
        setShowRecents(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-stone-200 px-4 md:px-6 flex items-center justify-between gap-3 shrink-0 z-30 select-none">
      {/* Brand Title */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
          <Navigation className="w-5 h-5 fill-white/20 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-base tracking-tight text-stone-900 leading-none">Atlas AI</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Google Maps Live
            </span>
          </div>
          <p className="text-[11px] text-stone-500 font-medium">Real-time Location Assistant</p>
        </div>
      </div>

      {/* Center Search & City Presets */}
      <div className="flex-1 max-w-xl mx-auto flex items-center gap-2">
        {/* Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
            <input
              id="location-search-input"
              type="text"
              placeholder="Search any city, neighborhood, or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setIsDropdownOpen(true);
              }}
              className="w-full pl-9 pr-8 py-2 bg-stone-100 hover:bg-stone-50 focus:bg-white text-stone-800 placeholder-stone-400 text-xs md:text-sm rounded-xl border border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setIsDropdownOpen(false);
                }}
                className="absolute right-2.5 text-stone-400 hover:text-stone-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && searchResults.length > 0 && (
            <div className="absolute top-11 left-0 right-0 bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden z-50 max-h-72 overflow-y-auto">
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const primaryName = item.name.split(',')[0].trim();
                    onSelectCustomLocation({
                      lat: item.lat,
                      lng: item.lng,
                      name: primaryName,
                      subtitle: item.name,
                    });
                    setSearchQuery('');
                    setIsDropdownOpen(false);
                    setShowRecents(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/70 border-b border-stone-100 last:border-b-0 flex items-start gap-2.5 transition-colors group"
                >
                  <MapPin className="w-4 h-4 text-stone-400 group-hover:text-blue-600 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-stone-800 truncate group-hover:text-blue-700">
                      {item.name.split(',')[0]}
                    </p>
                    <p className="text-[11px] text-stone-500 truncate">{item.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recents Dropdown */}
        <div ref={recentsRef} className="relative">
          <button
            id="navbar-recents-toggle"
            onClick={() => {
              setShowRecents(!showRecents);
              setShowCityPicker(false);
              setIsDropdownOpen(false);
            }}
            title="Recent location searches & selections"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
              showRecents
                ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold shadow-2xs'
                : 'bg-stone-100 hover:bg-stone-200/80 text-stone-700 border-stone-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden sm:inline">Recents</span>
            {recents.length > 0 && (
              <span className="min-w-[17px] h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                {recents.length}
              </span>
            )}
          </button>

          {showRecents && (
            <div className="absolute right-0 sm:left-0 sm:right-auto top-11 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Recents Header */}
              <div className="px-3.5 py-2.5 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
                    <History className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-bold text-stone-900">Recent Locations</span>
                  {recents.length > 0 && (
                    <span className="text-[10px] bg-stone-200/80 text-stone-700 px-1.5 py-0.2 rounded-full font-semibold">
                      {recents.length}
                    </span>
                  )}
                </div>

                {recents.length > 0 && (
                  <button
                    onClick={() => {
                      clearAllRecents();
                    }}
                    className="text-[11px] text-stone-400 hover:text-rose-600 flex items-center gap-1 font-medium transition-colors hover:bg-rose-50 px-1.5 py-0.5 rounded"
                    title="Clear all recent locations"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear all</span>
                  </button>
                )}
              </div>

              {/* Recents Items List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-stone-100">
                {recents.length === 0 ? (
                  <div className="p-5 text-center">
                    <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-2">
                      <Clock className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-stone-700">No recent locations yet</p>
                    <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                      Locations you search or pick from city presets will be saved here for instant return.
                    </p>
                  </div>
                ) : (
                  recents.map((item) => {
                    const isActive = currentLocationName.toLowerCase() === item.name.toLowerCase();

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSelectCustomLocation({
                            lat: item.lat,
                            lng: item.lng,
                            name: item.name,
                            subtitle: item.subtitle,
                          });
                          saveRecentLocation({
                            name: item.name,
                            subtitle: item.subtitle,
                            lat: item.lat,
                            lng: item.lng,
                            source: item.source,
                          });
                          setShowRecents(false);
                        }}
                        className={`px-3.5 py-2.5 flex items-center justify-between gap-2.5 cursor-pointer transition-colors group ${
                          isActive
                            ? 'bg-blue-50/70 hover:bg-blue-50'
                            : 'hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              item.source === 'preset'
                                ? 'bg-blue-100 text-blue-700'
                                : item.source === 'geolocation'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {item.source === 'preset' ? (
                              <Globe className="w-3.5 h-3.5" />
                            ) : item.source === 'geolocation' ? (
                              <Navigation className="w-3.5 h-3.5" />
                            ) : (
                              <Search className="w-3.5 h-3.5" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p
                                className={`text-xs truncate ${
                                  isActive ? 'font-bold text-blue-900' : 'font-semibold text-stone-800'
                                }`}
                              >
                                {item.name}
                              </p>
                              {isActive && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-600 text-white">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-stone-400 mt-0.5">
                              {item.subtitle ? (
                                <span className="truncate max-w-[130px]">{item.subtitle}</span>
                              ) : (
                                <span className="font-mono">{item.lat.toFixed(3)}°, {item.lng.toFixed(3)}°</span>
                              )}
                              <span>•</span>
                              <span>{formatRelativeTime(item.timestamp)}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRecentLocation(item.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-600 rounded-md hover:bg-stone-200/50 transition-all shrink-0"
                          title="Remove from recents"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* City Picker Quick Selector */}
        <div ref={cityPickerRef} className="relative hidden sm:block">
          <button
            id="city-picker-toggle"
            onClick={() => {
              setShowCityPicker(!showCityPicker);
              setShowRecents(false);
              setIsDropdownOpen(false);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-stone-100 hover:bg-stone-200/80 text-stone-700 border border-stone-200 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-stone-500" />
            <span className="max-w-[100px] truncate">{currentLocationName}</span>
          </button>

          {showCityPicker && (
            <div className="absolute right-0 top-11 w-64 bg-white rounded-xl shadow-xl border border-stone-200 p-2 z-50">
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-2 py-1">Popular Destinations</p>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {CITY_PRESETS.map((city) => (
                  <button
                    key={city.name}
                    onClick={() => {
                      onSelectCity(city);
                      setShowCityPicker(false);
                    }}
                    className={`text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                      currentLocationName === city.name
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <p className="truncate">{city.name}</p>
                    <p className="text-[10px] text-stone-400">{city.country}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {onCopyShareLink && (
          <button
            id="navbar-share-link"
            onClick={onCopyShareLink}
            title="Copy share link for current map view"
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
              isShareCopied
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold shadow-xs'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200 hover:border-stone-300'
            }`}
          >
            {isShareCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Share View</span>
              </>
            )}
          </button>
        )}

        <button
          id="navbar-locate-me"
          onClick={onLocateMe}
          disabled={isLocating}
          title="Use current GPS location"
          className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl border border-stone-200 transition-colors disabled:opacity-50"
        >
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          <span>{isLocating ? 'Locating...' : 'My Location'}</span>
        </button>

        <button
          id="clear-chat-button"
          onClick={onClearChat}
          title="Start fresh conversation"
          className="p-2 rounded-xl text-stone-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
