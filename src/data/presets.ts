import { LocationPreset } from '../types';

export const CITY_PRESETS: LocationPreset[] = [
  {
    name: 'San Francisco',
    country: 'USA',
    lat: 37.7749,
    lng: -122.4194,
    description: 'Golden Gate, specialty coffee, sourdough, & tech hubs',
  },
  {
    name: 'Tokyo',
    country: 'Japan',
    lat: 35.6762,
    lng: 139.6503,
    description: 'Shibuya, ramen alleys, historic temples, & neon nights',
  },
  {
    name: 'Paris',
    country: 'France',
    lat: 48.8566,
    lng: 2.3522,
    description: 'Bistros, Louvre, Montmartre, & Seine riverside strolls',
  },
  {
    name: 'New York',
    country: 'USA',
    lat: 40.7128,
    lng: -74.0060,
    description: 'Manhattan, Broadway, rooftop bars, & diverse dining',
  },
  {
    name: 'Rome',
    country: 'Italy',
    lat: 41.9028,
    lng: 12.4964,
    description: 'Colosseum, artisan gelato, Trastevere, & ancient ruins',
  },
  {
    name: 'London',
    country: 'UK',
    lat: 51.5074,
    lng: -0.1278,
    description: 'Historic pubs, West End, Thames walk, & world museums',
  },
  {
    name: 'Barcelona',
    country: 'Spain',
    lat: 41.3851,
    lng: 2.1734,
    description: 'Gaudí architecture, tapas bars, beach & Gothic Quarter',
  },
  {
    name: 'Sydney',
    country: 'Australia',
    lat: -33.8688,
    lng: 151.2093,
    description: 'Harbour Bridge, Opera House, coastal walks & brunch spots',
  },
];

export interface CategoryPrompt {
  id: string;
  label: string;
  prompt: string;
  iconName: string;
}

export const CATEGORY_PROMPTS: CategoryPrompt[] = [
  {
    id: 'coffee',
    label: 'Best Coffee',
    prompt: 'Where are the top rated artisan and specialty coffee shops around here?',
    iconName: 'Coffee',
  },
  {
    id: 'food',
    label: 'Must-Eat Food',
    prompt: 'What are the most famous local restaurants and must-try dishes in this area?',
    iconName: 'Utensils',
  },
  {
    id: 'sights',
    label: 'Historic Landmarks',
    prompt: 'What iconic landmarks and historical sites should I visit near here?',
    iconName: 'Landmark',
  },
  {
    id: 'parks',
    label: 'Parks & Views',
    prompt: 'Where can I find peaceful green parks, gardens, or scenic panoramic viewpoints?',
    iconName: 'Trees',
  },
  {
    id: 'nightlife',
    label: 'Bars & Nightlife',
    prompt: 'What are great craft cocktail bars, pubs, or lively evening spots nearby?',
    iconName: 'Wine',
  },
  {
    id: 'hidden_gems',
    label: 'Hidden Gems',
    prompt: 'What are some under-the-radar local hidden gems that tourists usually miss?',
    iconName: 'Compass',
  },
];
