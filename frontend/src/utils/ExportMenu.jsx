// src/components/ExportMenu.jsx
// Export options:
//   - All Charts (PNG) — exports each chart SVG as separate PNG files
//   - CSV             — video data spreadsheet
//   - JSON            — full API response
// Removed the print/PDF option (replaced by per-chart PNG export)

import { useState, useRef, useEffect } from "react";
import { Download, FileText, FileJson, ImageDown, ChevronDown } from "lucide-react";
import { exportCSV, exportJSON } from "../utils/exportData";
import { exportAllCharts } from "../utils/exportCharts";
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../utils/i18n";

const CHART_IDS = [
  { id: "chart-top10",   name: "top10_most_viewed"     },
  { id: "chart-timeline",name: "views_over_time"        },
  { id: "chart-duration",name: "duration_distribution"  },
  { id: "chart-mix",     name: "content_mix"            },
  { id: "chart-scatter", name: "engagement_velocity"    },
];

export default function ExportMenu({ data }) {
  const [open, setOpen]       = useState(false);
  const [exporting, setExp]   = useState(false);
  const ref                   = useRef(null);
  const { lang }              = useLanguage();
  const channelTitle          = data?.channel?.title || "channel";

  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  async function handleExportCharts() {
    setOpen(false);
    setExp(true);
    await exportAllCharts(CHART_IDS);
    setExp(false);
  }

  const items = [
    {
      icon: <ImageDown size={14}/>,
      label: exporting ? "Exporting charts…" : "Export All Charts (PNG)",
      action: handleExportCharts,
      highlight: true,
    },
    {
      icon: <FileText size={14}/>,
      label: t(lang, "exportCSV"),
      action: () => { exportCSV(data.videos, channelTitle); setOpen(false); },
    },
    {
      icon: <FileJson size={14}/>,
      label: t(lang, "exportJSON"),
      action: () => { exportJSON(data, channelTitle); setOpen(false); },
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-700 border border-navy-600 text-slate-300 text-sm font-medium hover:bg-navy-600 hover:text-white transition-colors">
        <Download size={15}/>
        {t(lang, "exportBtn")}
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`}/>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-56 z-50 bg-navy-800 border border-navy-600 rounded-xl shadow-xl shadow-black/40 overflow-hidden">
          {/* Section label */}
          <div className="px-4 py-2 border-b border-navy-700">
            <span className="text-xs text-slate-600 uppercase tracking-wider">Export options</span>
          </div>
          {items.map((item) => (
            <button key={item.label} onClick={item.action} disabled={exporting}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left
                ${item.highlight
                  ? "text-accent-blue hover:bg-blue-500/10"
                  : "text-slate-300 hover:bg-navy-700 hover:text-white"}
                disabled:opacity-50`}>
              <span className={item.highlight ? "text-accent-blue" : "text-slate-500"}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
          <div className="px-4 py-2 border-t border-navy-700">
            <span className="text-xs text-slate-600">Each chart also has its own PNG button</span>
          </div>
        </div>
      )}
    </div>
  );
}
