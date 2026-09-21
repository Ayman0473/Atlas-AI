import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Send,
  Sparkles,
  MapPin,
  ExternalLink,
  Coffee,
  Utensils,
  Landmark,
  Trees,
  Wine,
  Compass,
  Loader2,
  ChevronRight,
  Star,
  CornerDownLeft,
  Navigation,
} from 'lucide-react';
import { ChatMessage, PlaceRecommendation } from '../types';
import { CATEGORY_PROMPTS, CategoryPrompt } from '../data/presets';

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  activeLocationName: string;
  activeLat: number;
  activeLng: number;
  onSendMessage: (text: string) => void;
  onSelectPlace: (place: PlaceRecommendation) => void;
  selectedPlaceId?: string | null;
}

const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case 'Coffee':
      return <Coffee className="w-4 h-4 text-amber-600" />;
    case 'Utensils':
      return <Utensils className="w-4 h-4 text-orange-600" />;
    case 'Landmark':
      return <Landmark className="w-4 h-4 text-blue-600" />;
    case 'Trees':
      return <Trees className="w-4 h-4 text-emerald-600" />;
    case 'Wine':
      return <Wine className="w-4 h-4 text-purple-600" />;
    case 'Compass':
    default:
      return <Compass className="w-4 h-4 text-rose-600" />;
  }
};

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isLoading,
  activeLocationName,
  activeLat,
  activeLng,
  onSendMessage,
  onSelectPlace,
  selectedPlaceId,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-stone-200 shadow-lg relative select-text">
      {/* Active Location Sub-header */}
      <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-200/80 flex items-center justify-between text-xs text-stone-600 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="font-medium truncate">Map Focus:</span>
          <span className="font-semibold text-stone-900 truncate">{activeLocationName}</span>
        </div>
        <span className="text-[11px] font-mono text-stone-400 shrink-0 hidden sm:inline">
          {activeLat.toFixed(3)}, {activeLng.toFixed(3)}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          /* Empty / Welcome State */
          <div className="h-full flex flex-col justify-center py-6">
            <div className="text-center max-w-sm mx-auto mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white mx-auto flex items-center justify-center shadow-md shadow-blue-500/20 mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-stone-900">Explore {activeLocationName}</h2>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Powered by real-time Google Maps data. Ask for restaurant recommendations, historic landmarks, secret viewpoints, or itineraries.
              </p>
            </div>

            {/* Quick Category Prompts */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-1">
                Suggested questions for this area
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CATEGORY_PROMPTS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSendMessage(item.prompt)}
                    className="flex items-start gap-2.5 p-3 rounded-xl border border-stone-200/90 bg-stone-50/60 hover:bg-blue-50/60 hover:border-blue-200 text-left transition-all group"
                  >
                    <div className="p-1.5 rounded-lg bg-white shadow-xs border border-stone-200/60 group-hover:border-blue-200 shrink-0">
                      {getCategoryIcon(item.iconName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-stone-800 group-hover:text-blue-700">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                        {item.prompt}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Conversation Flow */
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-[92%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-xs shadow-sm shadow-blue-600/10'
                    : 'bg-stone-50 text-stone-800 rounded-bl-xs border border-stone-200/80 shadow-xs'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-stone prose-xs max-w-none prose-headings:font-bold prose-headings:text-stone-900 prose-headings:mb-2 prose-headings:mt-3 prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>

              {/* Recommended Places Cards Carousel/Grid for Assistant Messages */}
              {msg.places && msg.places.length > 0 && (
                <div className="w-full mt-3 space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-rose-500" />
                      Discovered Places ({msg.places.length})
                    </span>
                    <span className="text-[10px] text-stone-400">Click to locate on map</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {msg.places.map((place, pIdx) => {
                      const isSelected = selectedPlaceId === place.id;
                      return (
                        <div
                          key={place.id || pIdx}
                          onClick={() => onSelectPlace(place)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                            isSelected
                              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-300/60 shadow-md'
                              : 'bg-white hover:bg-stone-50 border-stone-200/90 shadow-xs hover:border-stone-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {pIdx + 1}
                                </span>
                                <h4 className="font-bold text-stone-900 text-xs truncate">
                                  {place.title}
                                </h4>
                              </div>
                            </div>

                            {place.snippet && (
                              <p className="text-[11px] text-stone-600 line-clamp-2 mt-1.5 leading-snug">
                                {place.snippet}
                              </p>
                            )}
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectPlace(place);
                              }}
                              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5"
                            >
                              <span>View Pin</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>

                            {place.uri && (
                              <a
                                href={place.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded text-[10px] font-medium transition-colors"
                              >
                                <span>Google Maps</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Grounding Source Attribution Chips */}
              {msg.groundingSources && msg.groundingSources.length > 0 && (
                <div className="w-full mt-2 px-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                    Verified Sources:
                  </span>
                  {msg.groundingSources.slice(0, 4).map((source, sIdx) => (
                    <a
                      key={sIdx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-stone-600 bg-stone-100 hover:bg-stone-200/80 px-2 py-0.5 rounded-full border border-stone-200/60 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="max-w-[130px] truncate">{source.title}</span>
                      <ExternalLink className="w-2.5 h-2.5 text-stone-400" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-stone-50 border border-stone-200/80 max-w-[85%] animate-pulse">
            <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-800">
                Gathering real-time Google Maps data...
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Verifying local businesses, reviews, and coordinates for {activeLocationName}.
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-stone-200 shrink-0">
        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-[11px]">
          <span className="text-stone-400 font-medium shrink-0">Quick ask:</span>
          {[
            'Best rated coffee near here',
            'Hidden gems to explore',
            'Authentic dinner spots',
            'Scenic walk or park',
          ].map((pill, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(pill)}
              disabled={isLoading}
              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200/80 text-stone-600 rounded-full shrink-0 border border-stone-200/60 hover:border-stone-300 transition-colors disabled:opacity-50"
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Textarea Form */}
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
          <textarea
            ref={inputRef}
            id="chat-user-input"
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about places, food, sights, or transit in ${activeLocationName}...`}
            className="w-full resize-none px-3.5 py-2.5 bg-stone-100 hover:bg-stone-50 focus:bg-white text-stone-800 placeholder-stone-400 text-xs md:text-sm rounded-xl border border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
          />

          <button
            id="chat-send-button"
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center shadow-sm shadow-blue-600/20 disabled:opacity-40 disabled:pointer-events-none transition-colors shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
