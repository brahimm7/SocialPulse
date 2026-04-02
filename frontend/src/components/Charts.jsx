// src/components/Charts.jsx
// Each chart card has an individual "Export PNG" button.
// The chart wrapper div gets a unique id so exportChartAsPNG can find its SVG.

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
  ScatterChart, Scatter, Cell,
  PieChart, Pie,
} from "recharts";
import { useState } from "react";
import { fmtNumber, fmtDateShort, TYPE_COLORS } from "../utils/format";
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../utils/i18n";
import { exportChartAsPNG } from "../utils/exportCharts";
import { ImageDown, Maximize2, Minimize2 } from "lucide-react";

const GRID_COLOR = "#1e2d55";
const TICK_COLOR = "#64748b";
const TT_STYLE   = {
  backgroundColor: "#0f1830",
  border: "1px solid #1e2d55",
  borderRadius: "8px",
  color: "#f1f5f9",
  fontSize: 12,
};

// ── Shared card wrapper with expand + PNG export ──────────────────────────────
function ChartCard({ id, title, filename, children, defaultHeight, expandedHeight }) {
  const [expanded, setExpanded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const height = expanded ? (expandedHeight || defaultHeight * 1.6) : defaultHeight;

  async function handleExport() {
    setExporting(true);
    await exportChartAsPNG(id, filename);
    setTimeout(() => setExporting(false), 600);
  }

  return (
    <div className="card p-6">
      {/* Card header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-slate-200 tracking-wide">{title}</h3>
        <div className="flex items-center gap-1.5">
          {/* PNG export */}
          <button onClick={handleExport} title="Export chart as PNG"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-slate-400 border border-navy-600 hover:bg-navy-700 hover:text-white transition-colors">
            <ImageDown size={13} className={exporting ? "animate-bounce" : ""}/>
            {exporting ? "…" : "PNG"}
          </button>
          {/* Expand toggle */}
          <button onClick={() => setExpanded((e) => !e)} title={expanded ? "Collapse" : "Expand"}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-slate-500 border border-navy-600 hover:bg-navy-700 hover:text-white transition-colors">
            {expanded ? <Minimize2 size={13}/> : <Maximize2 size={13}/>}
          </button>
        </div>
      </div>

      {/* Chart area — given unique id for SVG targeting */}
      <div id={id} style={{ transition: "height 0.3s ease" }}>
        {children(height)}
      </div>
    </div>
  );
}

// ── 1. Top 10 Most Viewed ─────────────────────────────────────────────────────
export function Top10Chart({ videos }) {
  const { lang } = useLanguage();
  const data = [...videos]
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 10)
    .map((v) => ({
      title: v.title.length > 44 ? v.title.slice(0, 44) + "…" : v.title,
      views: v.view_count,
    })).reverse();

  return (
    <ChartCard id="chart-top10" title={t(lang, "chartTop10")}
      filename="top10_most_viewed" defaultHeight={380} expandedHeight={560}>
      {(h) => (
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 52, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false}/>
            <XAxis type="number" tickFormatter={fmtNumber} tick={{ fill: TICK_COLOR, fontSize: 11 }} axisLine={false} tickLine={false}/>
            <YAxis type="category" dataKey="title" width={220} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={TT_STYLE} formatter={(v) => [fmtNumber(v), "Views"]} cursor={{ fill: "rgba(79,142,247,0.06)" }}/>
            <Bar dataKey="views" fill="#4f8ef7" radius={[0, 5, 5, 0]} maxBarSize={26}/>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

// ── 2. Views Over Time ────────────────────────────────────────────────────────
export function ViewsTimelineChart({ videos }) {
  const { lang } = useLanguage();
  const sorted = [...videos].filter((v) => v.published_date)
    .sort((a, b) => new Date(a.published_date) - new Date(b.published_date));
  const data = sorted.map((v, i) => {
    const w = sorted.slice(Math.max(0, i - 4), i + 1);
    return { date: fmtDateShort(v.published_date), views: v.view_count,
      avg: Math.round(w.reduce((s, x) => s + x.view_count, 0) / w.length), title: v.title };
  });

  return (
    <ChartCard id="chart-timeline" title={t(lang, "chartViewsTime")}
      filename="views_over_time" defaultHeight={320} expandedHeight={480}>
      {(h) => (
        <ResponsiveContainer width="100%" height={h}>
          <LineChart data={data} margin={{ left: 0, right: 20, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR}/>
            <XAxis dataKey="date" tick={{ fill: TICK_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
            <YAxis tickFormatter={fmtNumber} tick={{ fill: TICK_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} width={56}/>
            <Tooltip contentStyle={TT_STYLE} formatter={(v, n) => [fmtNumber(v), n === "views" ? "Views" : "5-vid avg"]} labelFormatter={(l) => `Uploaded: ${l}`}/>
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: TICK_COLOR }}/>
            <Line type="monotone" dataKey="views" stroke="#4f8ef7" dot={false} strokeWidth={2} name="views"/>
            <Line type="monotone" dataKey="avg" stroke="#a78bfa" dot={false} strokeWidth={2} strokeDasharray="5 3" name="avg"/>
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

// ── 3. Duration Histogram ─────────────────────────────────────────────────────
export function DurationHistogram({ videos }) {
  const { lang } = useLanguage();
  const buckets  = {};
  videos.forEach((v) => {
    const min = Math.floor(v.duration_sec / 60);
    const key = min <= 1 ? "0–1m" : min <= 5 ? "1–5m" : min <= 10 ? "5–10m"
              : min <= 20 ? "10–20m" : min <= 30 ? "20–30m" : min <= 60 ? "30–60m" : ">60m";
    buckets[key] = (buckets[key] || 0) + 1;
  });
  const order = ["0–1m","1–5m","5–10m","10–20m","20–30m","30–60m",">60m"];
  const data  = order.filter((k) => buckets[k]).map((k) => ({ range: k, count: buckets[k] }));

  return (
    <ChartCard id="chart-duration" title={t(lang, "chartDuration")}
      filename="duration_distribution" defaultHeight={280} expandedHeight={420}>
      {(h) => (
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false}/>
            <XAxis dataKey="range" tick={{ fill: TICK_COLOR, fontSize: 11 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill: TICK_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} width={30}/>
            <Tooltip contentStyle={TT_STYLE} formatter={(v) => [v, "Videos"]}/>
            <Bar dataKey="count" radius={[5,5,0,0]} maxBarSize={48}>
              {data.map((e) => (
                <Cell key={e.range}
                  fill={e.range==="0–1m" ? TYPE_COLORS["Short"]
                      : (e.range.startsWith("1")||e.range.startsWith("5")) ? TYPE_COLORS["Medium"]
                      : TYPE_COLORS["Long-form"]}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

// ── 4. Content Mix Pie ────────────────────────────────────────────────────────
export function ContentMixPie({ summary }) {
  const { lang } = useLanguage();
  const data = [
    { name: "Short (≤1m)",    value: summary.shorts_count,   fill: TYPE_COLORS["Short"]     },
    { name: "Medium (1–10m)", value: summary.medium_count,   fill: TYPE_COLORS["Medium"]    },
    { name: "Long-form",      value: summary.longform_count, fill: TYPE_COLORS["Long-form"] },
  ].filter((d) => d.value > 0);

  return (
    <ChartCard id="chart-mix" title={t(lang, "chartMix")}
      filename="content_mix" defaultHeight={280} expandedHeight={400}>
      {(h) => (
        <ResponsiveContainer width="100%" height={h}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={72} outerRadius={108}
              dataKey="value" paddingAngle={3}
              label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
              labelLine={false}>
              {data.map((e) => <Cell key={e.name} fill={e.fill}/>)}
            </Pie>
            <Tooltip contentStyle={TT_STYLE} formatter={(v, n) => [v, n]}/>
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

// ── 5. Engagement Scatter ─────────────────────────────────────────────────────
export function EngagementScatter({ videos }) {
  const { lang } = useLanguage();
  const data = videos.filter((v) => v.published_date).map((v) => ({
    date: new Date(v.published_date).getTime(),
    vpd:  v.views_per_day,
    views:v.view_count,
    title:v.title,
    type: v.video_type,
  }));

  return (
    <ChartCard id="chart-scatter" title={t(lang, "chartEngagement")}
      filename="engagement_velocity" defaultHeight={280} expandedHeight={420}>
      {(h) => (
        <>
          <ResponsiveContainer width="100%" height={h}>
            <ScatterChart margin={{ left: 0, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR}/>
              <XAxis dataKey="date" name="Date" type="number" domain={["auto","auto"]}
                tickFormatter={(ts) => new Date(ts).toLocaleDateString("en-US",{month:"short",year:"2-digit"})}
                tick={{ fill: TICK_COLOR, fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis dataKey="vpd" name="Views/Day" tickFormatter={fmtNumber}
                tick={{ fill: TICK_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} width={56}/>
              <Tooltip contentStyle={TT_STYLE} cursor={{ strokeDasharray:"3 3" }}
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={TT_STYLE} className="p-2 max-w-xs">
                      <div className="font-medium text-white text-xs mb-1 line-clamp-2">{d.title}</div>
                      <div className="text-slate-400 text-xs">{fmtNumber(d.vpd)} views/day</div>
                      <div className="text-slate-400 text-xs">{fmtNumber(d.views)} total</div>
                    </div>
                  );
                }}/>
              <Scatter data={data} fillOpacity={0.8}>
                {data.map((e, i) => <Cell key={i} fill={TYPE_COLORS[e.type]||"#4f8ef7"}/>)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3 justify-center">
            {Object.entries(TYPE_COLORS).map(([label, color]) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span style={{ background: color }} className="inline-block w-2.5 h-2.5 rounded-full"/>
                {label}
              </span>
            ))}
          </div>
        </>
      )}
    </ChartCard>
  );
}
