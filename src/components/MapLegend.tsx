import React, { useState } from 'react';
import { PlaceCategoryType, PlaceRecommendation } from '../types';
import {
  CATEGORY_DEFINITIONS,
  classifyPlaceCategory,
  CategoryDefinition,
} from '../utils/categories';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';

interface MapLegendProps {
  places: PlaceRecommendation[];
  activeCategoryFilter: PlaceCategoryType | null;
  onSelectCategoryFilter: (category: PlaceCategoryType | null) => void;
  className?: string;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  places,
  activeCategoryFilter,
  onSelectCategoryFilter,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showAllGuide, setShowAllGuide] = useState<boolean>(false);

  // Group places by detected category
  const categoryCounts = React.useMemo(() => {
    const counts: Partial<Record<PlaceCategoryType, number>> = {};
    for (const place of places) {
      const cat = classifyPlaceCategory(place.title, place.snippet, place.category);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [places]);

  const activeCategories = React.useMemo(() => {
    const cats = Object.keys(categoryCounts) as PlaceCategoryType[];
    return cats.filter((cat) => (categoryCounts[cat] || 0) > 0);
  }, [categoryCounts]);

  const totalPlaces = places.length;
  const hasPlaces = totalPlaces > 0;

  // Categories to display: active ones if places exist, or standard guide if none or showAllGuide toggled
  const categoriesToDisplay = React.useMemo(() => {
    if (showAllGuide || !hasPlaces) {
      return Object.values(CATEGORY_DEFINITIONS);
    }
    return activeCategories.map((id) => CATEGORY_DEFINITIONS[id]);
  }, [showAllGuide, hasPlaces, activeCategories]);

  return (
    <div
      className={`z-[400] transition-all duration-200 select-none ${className}`}
      id="map-legend-container"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200/90 overflow-hidden max-w-[280px] sm:max-w-[310px] w-full text-stone-800">
        {/* Header Bar */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsExpanded(!isExpanded);
            }
          }}
          className="px-3.5 py-2.5 flex items-center justify-between cursor-pointer hover:bg-stone-50/80 transition-colors border-b border-stone-100"
          title={isExpanded ? 'Collapse Map Legend' : 'Expand Map Legend'}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-stone-900 tracking-tight">Map Legend</span>
                {hasPlaces && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                    {activeCategories.length} {activeCategories.length === 1 ? 'type' : 'types'}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-stone-500 truncate">
                {hasPlaces
                  ? activeCategoryFilter
                    ? `Filtering by ${CATEGORY_DEFINITIONS[activeCategoryFilter].shortLabel}`
                    : `${totalPlaces} AI place ${totalPlaces === 1 ? 'marker' : 'markers'}`
                  : 'AI marker classification'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {activeCategoryFilter && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCategoryFilter(null);
                }}
                className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold px-1.5 py-0.5 rounded hover:bg-rose-50 transition-colors"
                title="Clear category filter"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              className="text-stone-400 hover:text-stone-700 p-0.5 rounded"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="p-2.5 pt-2 max-h-[340px] overflow-y-auto space-y-1.5">
            {/* Filter Active Notice Banner */}
            {activeCategoryFilter && (
              <div className="flex items-center justify-between bg-blue-50/90 border border-blue-200/90 px-2.5 py-1.5 rounded-xl text-[11px] text-blue-800">
                <div className="flex items-center gap-1.5 truncate">
                  <Filter className="w-3 h-3 text-blue-600 shrink-0" />
                  <span className="truncate">
                    Showing: <strong>{CATEGORY_DEFINITIONS[activeCategoryFilter].label}</strong>
                  </span>
                </div>
                <button
                  onClick={() => onSelectCategoryFilter(null)}
                  className="text-blue-600 hover:text-blue-900 font-bold ml-1 hover:bg-blue-100 rounded p-0.5"
                  title="Clear filter and show all markers"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Empty State / Prompt to Ask Atlas */}
            {!hasPlaces && (
              <div className="p-2 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200">
                <Sparkles className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="text-[11px] font-semibold text-stone-700">No active markers yet</p>
                <p className="text-[10px] text-stone-500 mt-0.5 leading-snug">
                  Ask Atlas about restaurants, landmarks, or parks to plot color-coded pins here.
                </p>
              </div>
            )}

            {/* Categories List */}
            <div className="space-y-1">
              {categoriesToDisplay.map((cat: CategoryDefinition) => {
                const count = categoryCounts[cat.id] || 0;
                const isFilterSelected = activeCategoryFilter === cat.id;
                const isFilteredOut = activeCategoryFilter !== null && !isFilterSelected;
                const IconComponent = cat.icon;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      if (hasPlaces && count > 0) {
                        onSelectCategoryFilter(isFilterSelected ? null : cat.id);
                      }
                    }}
                    disabled={hasPlaces && count === 0}
                    title={
                      hasPlaces && count > 0
                        ? isFilterSelected
                          ? `Click to clear ${cat.label} filter`
                          : `Filter map to ${cat.label} (${count})`
                        : cat.description
                    }
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all group ${
                      isFilterSelected
                        ? 'bg-blue-50/90 border border-blue-300 shadow-xs'
                        : isFilteredOut
                        ? 'opacity-40 hover:opacity-80 bg-stone-50/50 hover:bg-stone-100 border border-transparent'
                        : 'hover:bg-stone-100/80 border border-transparent'
                    } ${hasPlaces && count === 0 ? 'cursor-default opacity-35' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Pin Swatch matching the exact map pin styling */}
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-xs shrink-0 transition-transform group-hover:scale-105"
                        style={{ backgroundColor: cat.colorHex }}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`text-xs truncate leading-tight ${
                            isFilterSelected ? 'font-bold text-blue-900' : 'font-medium text-stone-800'
                          }`}
                        >
                          {cat.label}
                        </p>
                        <p className="text-[10px] text-stone-400 truncate leading-none mt-0.5">
                          {cat.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {hasPlaces ? (
                        count > 0 ? (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              isFilterSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-stone-100 text-stone-600 group-hover:bg-stone-200'
                            }`}
                          >
                            {count}
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-300">0</span>
                        )
                      ) : (
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cat.colorHex }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Toggle Full Guide / Active Only footer */}
            {hasPlaces && (
              <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-500 px-1">
                <button
                  type="button"
                  onClick={() => setShowAllGuide(!showAllGuide)}
                  className="hover:text-stone-900 underline transition-colors"
                >
                  {showAllGuide ? 'Show active only' : 'View all place types'}
                </button>
                <span className="text-[10px] text-stone-400">Click type to filter</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
