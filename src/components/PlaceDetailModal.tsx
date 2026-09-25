import React from 'react';
import { PlaceRecommendation } from '../types';
import { getPlaceCategoryMeta } from '../utils/categories';
import { X, ExternalLink, MessageSquarePlus } from 'lucide-react';

interface PlaceDetailModalProps {
  place: PlaceRecommendation | null;
  onClose: () => void;
  onAskAboutPlace: (placeTitle: string) => void;
}

export const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({
  place,
  onClose,
  onAskAboutPlace,
}) => {
  if (!place) return null;

  const catMeta = getPlaceCategoryMeta(place);
  const CategoryIcon = catMeta.icon;

  return (
    <div className="absolute bottom-5 right-5 z-[500] max-w-sm w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-stone-200/90 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-stone-50 to-blue-50/40 border-b border-stone-200/70 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-xl text-white flex items-center justify-center shrink-0 shadow-sm"
            style={{ backgroundColor: catMeta.colorHex }}
          >
            <CategoryIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${catMeta.badgeBgClass}`}>
                <CategoryIcon className="w-2.5 h-2.5" />
                <span>{catMeta.label}</span>
              </span>
            </div>
            <h3 className="font-bold text-stone-900 text-sm md:text-base leading-tight truncate">
              {place.title}
            </h3>
            {place.lat && place.lng && (
              <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                {place.lat.toFixed(4)}°, {place.lng.toFixed(4)}°
              </p>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-200/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {place.snippet ? (
          <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-2.5 rounded-xl border border-stone-100">
            {place.snippet}
          </p>
        ) : (
          <p className="text-xs text-stone-500 italic">
            Recommended location verified via real-time Google Maps grounding.
          </p>
        )}

        {/* Review Snippets */}
        {place.reviewSnippets && place.reviewSnippets.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Google Maps Review Highlight
            </p>
            {place.reviewSnippets.slice(0, 2).map((rev, idx) => (
              <div key={idx} className="text-xs text-stone-600 italic bg-amber-50/50 border border-amber-200/60 p-2 rounded-lg">
                "{rev.text}"
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-2">
          {place.uri && (
            <a
              href={place.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
            >
              <span>View on Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={() => {
              onAskAboutPlace(place.title);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-xl border border-stone-200 transition-colors"
          >
            <MessageSquarePlus className="w-3.5 h-3.5 text-blue-600" />
            <span>Ask chatbot about this place</span>
          </button>
        </div>
      </div>
    </div>
  );
};
