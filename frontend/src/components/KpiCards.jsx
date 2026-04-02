// src/components/KpiCards.jsx
// Time-period filter: All / This Year / Last 6 months / Last 3 months / This Month
// Each card also has an expand button to show a breakdown panel.

import { useState, useMemo } from "react";
import { TrendingUp, Eye, BarChart2, Clock, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { fmtNumber } from "../utils/format";
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../utils/i18n";

const PERIODS = [
  { key: "all",    label: "All time" },
  { key: "year",   label: "This year" },
  { key: "6mo",    label: "Last 6 months" },
  { key: "3mo",    label: "Last 3 months" },
  { key: "month",  label: "This month" },
];

function filterByPeriod(videos, period) {
  if (period === "all" || !videos?.length) return videos;
  const now   = new Date();
  const cutoff = new Date();
  if (period === "year")  cutoff.setMonth(0, 1);
  if (period === "6mo")   cutoff.setMonth(now.getMonth() - 6);
  if (period === "3mo")   cutoff.setMonth(now.getMonth() - 3);
  if (period === "month") cutoff.setDate(1);
  cutoff.setHours(0, 0, 0, 0);
  return videos.filter((v) => v.published_date && new Date(v.published_date) >= cutoff);
}

function computeSummary(videos) {
  if (!videos.length) return { total_videos_fetched:0, total_views:0, avg_views:0, max_views:0,
    avg_likes:0, avg_duration_sec:0, shorts_count:0, medium_count:0, longform_count:0 };
  const vcs = videos.map((v) => v.view_count);
  return {
    total_videos_fetched: videos.length,
    total_views:          vcs.reduce((a,b)=>a+b,0),
    avg_views:            Math.round(vcs.reduce((a,b)=>a+b,0)/vcs.length),
    max_views:            Math.max(...vcs),
    avg_likes:            Math.round(videos.reduce((a,v)=>a+v.like_count,0)/videos.length),
    avg_duration_sec:     Math.round(videos.reduce((a,v)=>a+v.duration_sec,0)/videos.length),
    shorts_count:         videos.filter((v)=>v.video_type==="Short").length,
    medium_count:         videos.filter((v)=>v.video_type==="Medium").length,
    longform_count:       videos.filter((v)=>v.video_type==="Long-form").length,
  };
}

// Individual expandable KPI card
function KpiCard({ icon, label, value, sub, color, bg, details }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`card-sm border ${bg} flex flex-col transition-all`}>
      <div className="p-6">
        <div className={`${color} mb-3`}>{icon}</div>
        <div className="stat-label mb-1">{label}</div>
        <div className="stat-value text-2xl mb-1">{value}</div>
        <div className="flex items-center justify-between mt-1">
          <div className="text-xs text-slate-500">{sub}</div>
          {details && (
            <button onClick={() => setOpen((o) => !o)}
              className="text-slate-600 hover:text-slate-400 transition-colors ml-2 flex-shrink-0">
              {open ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </button>
          )}
        </div>
      </div>
      {/* Expandable detail panel */}
      {open && details && (
        <div className="border-t border-navy-700 px-6 py-4 space-y-2">
          {details.map(([k, v]) => (
            <div key={k} className="flex justify-between text-xs">
              <span className="text-slate-500">{k}</span>
              <span className="text-slate-200 font-medium">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function KpiCards({ videos: allVideos }) {
  const { lang }      = useLanguage();
  const [period, setPeriod] = useState("all");

  const videos  = useMemo(() => filterByPeriod(allVideos, period), [allVideos, period]);
  const summary = useMemo(() => computeSummary(videos), [videos]);
  const avgDurMin = Math.round(summary.avg_duration_sec / 60);

  const cards = [
    {
      icon:  <Eye size={20}/>,
      label: t(lang, "kpiVideos"),
      value: fmtNumber(summary.total_videos_fetched),
      sub:   `${t(lang,"kpiMax")}: ${fmtNumber(summary.max_views)}`,
      color: "text-accent-blue",
      bg:    "bg-blue-500/10 border-blue-500/20",
      details: [
        ["Total views",      fmtNumber(summary.total_views)],
        ["Most views (1 vid)",fmtNumber(summary.max_views)],
        ["Shorts",           summary.shorts_count],
        ["Medium",           summary.medium_count],
        ["Long-form",        summary.longform_count],
      ],
    },
    {
      icon:  <TrendingUp size={20}/>,
      label: t(lang, "kpiAvgViews"),
      value: fmtNumber(summary.avg_views),
      sub:   `${t(lang,"kpiAcross")} ${summary.total_videos_fetched} ${t(lang,"kpiVideosLabel")}`,
      color: "text-violet-400",
      bg:    "bg-violet-500/10 border-violet-500/20",
      details: [
        ["Total views",  fmtNumber(summary.total_views)],
        ["Avg views",    fmtNumber(summary.avg_views)],
        ["Peak views",   fmtNumber(summary.max_views)],
      ],
    },
    {
      icon:  <BarChart2 size={20}/>,
      label: t(lang, "kpiAvgLikes"),
      value: fmtNumber(summary.avg_likes),
      sub:   t(lang, "kpiBased"),
      color: "text-cyan-400",
      bg:    "bg-cyan-500/10 border-cyan-500/20",
      details: [
        ["Avg likes / video", fmtNumber(summary.avg_likes)],
        ["Videos in period",  summary.total_videos_fetched],
      ],
    },
    {
      icon:  <Clock size={20}/>,
      label: t(lang, "kpiAvgDuration"),
      value: `${avgDurMin}m`,
      sub:   `${summary.shorts_count}S · ${summary.medium_count}M · ${summary.longform_count}L`,
      color: "text-amber-400",
      bg:    "bg-amber-500/10 border-amber-500/20",
      details: [
        ["Avg duration",  `${avgDurMin} min`],
        ["Shorts (≤1m)",  summary.shorts_count],
        ["Medium (1-10m)",summary.medium_count],
        ["Long-form",     summary.longform_count],
      ],
    },
  ];

  return (
    <div className="space-y-3">
      {/* Period selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar size={14} className="text-slate-500"/>
        <span className="text-xs text-slate-500">Period:</span>
        {PERIODS.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-3 py-1 rounded-md border text-xs font-medium transition-colors
              ${period === p.key
                ? "bg-accent-blue border-accent-blue text-white"
                : "border-navy-600 text-slate-400 hover:border-slate-500 hover:text-white"}`}>
            {p.label}
          </button>
        ))}
        {period !== "all" && (
          <span className="text-xs text-slate-500 ml-1">
            ({summary.total_videos_fetched} videos in period)
          </span>
        )}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => <KpiCard key={c.label} {...c}/>)}
      </div>
    </div>
  );
}
