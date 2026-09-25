import { RecentLocation } from '../types';

const STORAGE_KEY = 'atlas_recent_locations';
const MAX_RECENTS = 15;

/**
 * Safely retrieves stored recent locations from localStorage
 */
export function getStoredRecents(): RecentLocation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item) =>
          item &&
          typeof item.name === 'string' &&
          typeof item.lat === 'number' &&
          typeof item.lng === 'number'
      );
    }
  } catch (err) {
    console.warn('Failed to read recent locations from localStorage:', err);
  }
  return [];
}

/**
 * Saves a location to recents, placing it at the front and deduplicating
 */
export function saveRecentLocation(item: {
  name: string;
  subtitle?: string;
  lat: number;
  lng: number;
  source?: 'search' | 'preset' | 'geolocation' | 'custom';
}): RecentLocation[] {
  if (typeof window === 'undefined') return [];

  try {
    const current = getStoredRecents();
    const cleanName = item.name.trim();

    // Check for existing duplicate by name or very close coordinates (~200m)
    const filtered = current.filter((r) => {
      const isSameName = r.name.toLowerCase() === cleanName.toLowerCase();
      const isSameCoord = Math.hypot(r.lat - item.lat, r.lng - item.lng) < 0.002;
      return !isSameName && !isSameCoord;
    });

    const newRecord: RecentLocation = {
      id: `recent-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      subtitle: item.subtitle?.trim(),
      lat: item.lat,
      lng: item.lng,
      source: item.source || 'search',
      timestamp: Date.now(),
    };

    const updated = [newRecord, ...filtered].slice(0, MAX_RECENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dispatch event for any other listeners
    window.dispatchEvent(new CustomEvent('atlas-recents-updated', { detail: updated }));

    return updated;
  } catch (err) {
    console.warn('Failed to write recent location to localStorage:', err);
    return [];
  }
}

/**
 * Removes a specific recent location by id
 */
export function deleteRecentLocation(id: string): RecentLocation[] {
  if (typeof window === 'undefined') return [];

  try {
    const current = getStoredRecents();
    const updated = current.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('atlas-recents-updated', { detail: updated }));
    return updated;
  } catch (err) {
    console.warn('Failed to remove recent location:', err);
    return [];
  }
}

/**
 * Clears all recent locations from storage
 */
export function clearAllRecents(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('atlas-recents-updated', { detail: [] }));
  } catch (err) {
    console.warn('Failed to clear recents from localStorage:', err);
  }
}

/**
 * Formats timestamp into human-readable relative time string
 */
export function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);

  if (diffSec < 45) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  return `${Math.floor(diffSec / 86400)}d ago`;
}
