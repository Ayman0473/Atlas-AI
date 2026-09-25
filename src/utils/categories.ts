import React from 'react';
import { PlaceCategoryType, PlaceRecommendation } from '../types';
import {
  Utensils,
  Landmark,
  Trees,
  Coffee,
  Wine,
  ShoppingBag,
  Compass,
  MapPin,
} from 'lucide-react';

export interface CategoryDefinition {
  id: PlaceCategoryType;
  label: string;
  shortLabel: string;
  description: string;
  colorHex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeBgClass: string;
  ringClass: string;
  icon: React.ComponentType<{ className?: string }>;
  svgIconHtml: string;
}

export const CATEGORY_DEFINITIONS: Record<PlaceCategoryType, CategoryDefinition> = {
  restaurant: {
    id: 'restaurant',
    label: 'Restaurants & Dining',
    shortLabel: 'Restaurants',
    description: 'Bistros, eateries, culinary hot spots, and local cuisine',
    colorHex: '#ea580c', // orange-600
    bgClass: 'bg-orange-600',
    textClass: 'text-orange-600',
    borderClass: 'border-orange-500',
    badgeBgClass: 'bg-orange-50 text-orange-700 border-orange-200',
    ringClass: 'ring-orange-300',
    icon: Utensils,
    svgIconHtml: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="M15 2v10a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2V2"/><path d="M21 15v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-5"/><path d="M7 2v20"/><path d="M3 2v6a4 4 0 0 0 4 4"/></svg>`,
  },
  landmark: {
    id: 'landmark',
    label: 'Landmarks & Culture',
    shortLabel: 'Landmarks',
    description: 'Monuments, historical sites, museums, and architecture',
    colorHex: '#2563eb', // blue-600
    bgClass: 'bg-blue-600',
    textClass: 'text-blue-600',
    borderClass: 'border-blue-500',
    badgeBgClass: 'bg-blue-50 text-blue-700 border-blue-200',
    ringClass: 'ring-blue-300',
    icon: Landmark,
    svgIconHtml: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>`,
  },
  park: {
    id: 'park',
    label: 'Parks & Nature',
    shortLabel: 'Parks',
    description: 'Gardens, nature reserves, scenic viewpoints, and waterfronts',
    colorHex: '#059669', // emerald-600
    bgClass: 'bg-emerald-600',
    textClass: 'text-emerald-600',
    borderClass: 'border-emerald-500',
    badgeBgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ringClass: 'ring-emerald-300',
    icon: Trees,
    svgIconHtml: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"/></svg>`,
  },
  cafe: {
    id: 'cafe',
    label: 'Coffee & Bakeries',
    shortLabel: 'Coffee & Cafes',
    description: 'Artisan espresso bars, roasters, cafes, and bakeries',
    colorHex: '#d97706', // amber-600
    bgClass: 'bg-amber-600',
    textClass: 'text-amber-600',
    borderClass: 'border-amber-500',
    badgeBgClass: 'bg-amber-50 text-amber-800 border-amber-200',
    ringClass: 'ring-amber-300',
    icon: Coffee,
    svgIconHtml: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>`,
  },
  nightlife: {
    id: 'nightlife',
    label: 'Bars & Nightlife',
    shortLabel: 'Bars & Nightlife',
    description: 'Cocktail lounges, craft breweries, pubs, and night spots',
    colorHex: '#7c3aed', // purple-600
    bgClass: 'bg-purple-600',
    textClass: 'text-purple-600',
    borderClass: 'border-purple-500',
    badgeBgClass: 'bg-purple-50 text-purple-700 border-purple-200',
    ringClass: 'ring-purple-300',
    icon: Wine,
    svgIconHtml: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"/></svg>`,
  },
  shopping: {
    id: 'shopping',
    label: 'Shopping & Markets',
    shortLabel: 'Shopping',
    description: 'Boutiques, local bazaars, food markets, and retail centers',
    colorHex: '#4f46e5', // indigo-600
    bgClass: 'bg-indigo-600',
    textClass: 'text-indigo-600',
    borderClass: 'border-indigo-500',
    badgeBgClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    ringClass: 'ring-indigo-300',
    icon: ShoppingBag,
    svgIconHtml: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  },
  activity: {
    id: 'activity',
    label: 'Attractions & Entertainment',
    shortLabel: 'Attractions',
    description: 'Theaters, tours, theme parks, stadiums, and experiences',
    colorHex: '#e11d48', // rose-600
    bgClass: 'bg-rose-600',
    textClass: 'text-rose-600',
    borderClass: 'border-rose-500',
    badgeBgClass: 'bg-rose-50 text-rose-700 border-rose-200',
    ringClass: 'ring-rose-300',
    icon: Compass,
    svgIconHtml: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
  },
  general: {
    id: 'general',
    label: 'Places of Interest',
    shortLabel: 'General Place',
    description: 'Neighborhood destinations and points of interest',
    colorHex: '#475569', // slate-600
    bgClass: 'bg-slate-600',
    textClass: 'text-slate-600',
    borderClass: 'border-slate-500',
    badgeBgClass: 'bg-slate-50 text-slate-700 border-slate-200',
    ringClass: 'ring-slate-300',
    icon: MapPin,
    svgIconHtml: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  },
};

import { classifyPlaceCategory } from './categoryClassification';
export { classifyPlaceCategory };

/**
 * Returns CategoryDefinition for a place
 */
export function getPlaceCategoryMeta(place: PlaceRecommendation): CategoryDefinition {
  const categoryId = classifyPlaceCategory(place.title, place.snippet, place.category);
  return CATEGORY_DEFINITIONS[categoryId];
}
