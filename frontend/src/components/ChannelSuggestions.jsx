// src/components/ChannelSuggestions.jsx
// Fix: use onMouseDown instead of onClick so it fires BEFORE input's onBlur,
// preventing the dropdown from closing before the selection registers.

import { useState, useEffect, useRef } from "react";
import { Tv } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../utils/i18n";

const DEBOUNCE_MS = 600;

export default function ChannelSuggestions({ query, onSelect, visible }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef              = useRef(null);
  const { lang }              = useLanguage();

  useEffect(() => {
    if (!query || query.trim().length < 2 || query.startsWith("http")) {
      setResults([]);
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const BASE = import.meta.env.VITE_API_URL || "";
        const res  = await fetch(`/api/search-channels/?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  if (!visible || (!loading && results.length === 0)) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-navy-800 border border-navy-600 rounded-xl shadow-xl shadow-black/50 overflow-hidden">
      {loading ? (
        <div className="px-4 py-3 flex items-center gap-2 text-slate-500 text-sm">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          {t(lang, "suggestionsTitle")}…
        </div>
      ) : (
        <>
          <div className="px-4 py-2 border-b border-navy-700">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">
              {t(lang, "suggestionsTitle")}
            </span>
          </div>
          {results.map((ch) => (
            <button
              key={ch.channel_id}
              // ✅ FIX: onMouseDown fires before onBlur, so the input value
              // is set before the dropdown closes. onClick fires after onBlur
              // which caused the dropdown to close first and discard the pick.
              onMouseDown={(e) => {
                e.preventDefault(); // prevent input losing focus prematurely
                onSelect(ch.title, `@${ch.title}`.replace(/\s+/g, ""), ch.channel_id, ch);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-navy-700 transition-colors text-left"
            >
              {ch.thumbnail ? (
                <img src={ch.thumbnail} alt={ch.title} className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-1 ring-navy-600"/>
              ) : (
                <div className="w-9 h-9 rounded-full bg-navy-600 flex items-center justify-center flex-shrink-0">
                  <Tv size={14} className="text-slate-400"/>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm text-white font-medium truncate">{ch.title}</div>
                <div className="text-xs text-slate-500 truncate">{ch.custom_url || ch.channel_id}</div>
              </div>
              <span className="text-xs text-slate-600 flex-shrink-0">↵</span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}
