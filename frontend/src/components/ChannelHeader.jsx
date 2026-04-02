// src/components/ChannelHeader.jsx
import { useState } from "react";
import { Users, Eye, Video, Calendar } from "lucide-react";
import { fmtNumber, fmtDate } from "../utils/format";
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../utils/i18n";
import { proxyImage } from "../utils/imageProxy";

export default function ChannelHeader({ channel }) {
  const { lang } = useLanguage();
  const [imgError, setImgError] = useState(false);

  const thumbSrc = proxyImage(channel.thumbnail);

  return (
    <div className="card p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
      {/* Avatar — proxied through backend to avoid CORS, with fallback */}
      {thumbSrc && !imgError ? (
        <img
          src={thumbSrc}
          alt={channel.title}
          onError={() => setImgError(true)}
          className="w-20 h-20 rounded-full ring-2 ring-accent-blue/40 flex-shrink-0 object-cover bg-navy-700"
        />
      ) : (
        <div className="w-20 h-20 rounded-full bg-navy-700 border border-navy-600 flex items-center justify-center flex-shrink-0">
          <span className="text-3xl select-none">📺</span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h2 className="text-xl font-bold text-white truncate">{channel.title}</h2>
          {channel.custom_url && (
            <a
              href={`https://www.youtube.com/${channel.custom_url}`}
              target="_blank" rel="noreferrer"
              className="text-xs text-accent-blue hover:underline"
            >
              {channel.custom_url}
            </a>
          )}
        </div>
        <p className="text-sm text-slate-400 line-clamp-2 mb-4">
          {channel.description || t(lang, "chanNoDesc")}
        </p>
        <div className="flex flex-wrap gap-5">
          <Stat icon={<Users size={14}/>}    label={t(lang, "chanSubscribers")}
            value={channel.hidden_subscribers ? "Hidden" : fmtNumber(channel.subscriber_count)} />
          <Stat icon={<Eye size={14}/>}      label={t(lang, "chanTotalViews")}   value={fmtNumber(channel.view_count)} />
          <Stat icon={<Video size={14}/>}    label={t(lang, "chanTotalVideos")}  value={fmtNumber(channel.video_count)} />
          <Stat icon={<Calendar size={14}/>} label={t(lang, "chanCreated")}      value={fmtDate(channel.published_at)} />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-slate-500">{icon}</span>
      <span className="text-slate-400 text-xs">{label}:</span>
      <span className="text-white text-sm font-semibold">{value}</span>
    </div>
  );
}
