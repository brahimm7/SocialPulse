// src/components/SearchBar.jsx
import { useState, useRef } from "react";
import { Search, AlertTriangle, X } from "lucide-react";
import ChannelSuggestions from "./ChannelSuggestions";
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../utils/i18n";

const OPTIONS = [
  { label: "20",  value: 20,  warn: false },
  { label: "50",  value: 50,  warn: false },
  { label: "100", value: 100, warn: false },
  { label: "200", value: 200, warn: false },
  { label: null,  value: 0,   warn: true  },
];

export default function SearchBar({ onSearch, loading }) {
  const [url, setUrl]               = useState("");
  const [displayName, setDisplayName] = useState("");
  const [maxVideos, setMaxVideos]   = useState(50);
  const [showSug, setShowSug]       = useState(false);
  const { lang }                    = useLanguage();

  const selectedOpt = OPTIONS.find((o) => o.value === maxVideos) || OPTIONS[1];
  const shownValue  = displayName || url;

  function handleSubmit(e) {
    e.preventDefault();
    const query = (url || displayName).trim();
    if (query) {
      setShowSug(false);
      onSearch(query, maxVideos);
    }
  }

  function handleSelect(title, handle, channelId, obj) {
    const searchUrl = obj.custom_url || handle || channelId;
    setDisplayName(title);
    setUrl(searchUrl);
    setShowSug(false);
    onSearch(searchUrl, maxVideos);
  }

  function handleClear() {
    setUrl("");
    setDisplayName("");
    setShowSug(false);
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"/>
            <input
              type="text"
              value={shownValue}
              onChange={(e) => {
                setDisplayName("");
                setUrl(e.target.value);
                setShowSug(true);
              }}
              onFocus={() => setShowSug(true)}
              onBlur={() => setTimeout(() => setShowSug(false), 150)}
              placeholder={t(lang, "searchPlaceholder")}
              className="w-full h-12 pl-11 pr-10 bg-navy-800 border border-navy-600 rounded-xl text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-colors"
            />
            {shownValue && (
              <button type="button" onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors z-10">
                <X size={15}/>
              </button>
            )}
            <ChannelSuggestions query={url} onSelect={handleSelect} visible={showSug && !loading}/>
          </div>
          <button
            type="submit"
            disabled={loading || !shownValue.trim()}
            className="btn-primary h-12 px-7 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? <span className="flex items-center gap-2"><Spinner/>{t(lang, "fetching")}</span>
              : t(lang, "goBtn")}
          </button>
        </div>

        <div className="flex items-center gap-3 justify-center text-sm text-slate-400 flex-wrap">
          <span>{t(lang, "videosToFetch")}</span>
          {OPTIONS.map((opt) => (
            <button key={opt.value} type="button" onClick={() => setMaxVideos(opt.value)}
              className={[
                "px-3 py-1 rounded-md border text-xs font-medium transition-colors flex items-center gap-1",
                maxVideos === opt.value
                  ? opt.warn ? "bg-amber-500 border-amber-500 text-white" : "bg-accent-blue border-accent-blue text-white"
                  : opt.warn ? "border-amber-700/50 text-amber-500/70 hover:border-amber-500" : "border-navy-600 text-slate-400 hover:border-slate-500"
              ].join(" ")}>
              {opt.warn && <AlertTriangle size={10}/>}
              {opt.warn ? t(lang, "allVideos") : opt.label}
            </button>
          ))}
        </div>

        {selectedOpt.warn && (
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2.5 text-xs text-amber-300">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5"/>
            <span>{t(lang, "warnAll")}</span>
          </div>
        )}
      </form>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  );
}
