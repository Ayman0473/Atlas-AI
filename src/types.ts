export interface LatLng {
  lat: number;
  lng: number;
}

export type PlaceCategoryType =
  | 'restaurant'
  | 'landmark'
  | 'park'
  | 'cafe'
  | 'nightlife'
  | 'shopping'
  | 'activity'
  | 'general';

export interface PlaceRecommendation {
  id: string;
  title: string;
  uri?: string;
  address?: string;
  rating?: number;
  category?: PlaceCategoryType | string;
  lat?: number;
  lng?: number;
  snippet?: string;
  reviewSnippets?: Array<{
    text?: string;
    authorAttribution?: {
      displayName?: string;
      uri?: string;
      photoUri?: string;
    };
  }>;
}

export interface GroundingSource {
  title: string;
  uri: string;
  type: 'maps' | 'web';
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  places?: PlaceRecommendation[];
  groundingSources?: GroundingSource[];
  locationContext?: {
    lat: number;
    lng: number;
    name?: string;
  };
}

export interface LocationPreset {
  name: string;
  lat: number;
  lng: number;
  country: string;
  description: string;
}
