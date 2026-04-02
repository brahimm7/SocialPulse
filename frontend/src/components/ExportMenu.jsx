// src/components/ExportMenu.jsx
import { useState, useRef, useEffect } from "react";
import { Download, FileText, FileJson, Printer, ChevronDown } from "lucide-react";
import { exportCSV, exportJSON, exportPDF } from "../utils/exportData";
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../utils/i18n";

export default function ExportMenu({ data }) {
  const [open, setOpen]   = useState(false);
  const ref               = useRef(null);
  const { lang }          = useLanguage();
  const channelTitle      = data?.channel?.title || "channel";

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items = [
    {
      icon: <FileText size={14} />,
      label: t(lang, "exportCSV"),
      action: () => { exportCSV(data.videos, channelTitle); setOpen(false); },
    },
    {
      icon: <FileJson size={14} />,
      label: t(lang, "exportJSON"),
      action: () => { exportJSON(data, channelTitle); setOpen(false); },
    },
    {
      icon: <Printer size={14} />,
      label: t(lang, "exportPDF"),
      action: () => { exportPDF(); setOpen(false); },
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="
          flex items-center gap-2 px-4 py-2 rounded-lg
          bg-navy-700 border border-navy-600
          text-slate-300 text-sm font-medium
          hover:bg-navy-600 hover:text-white transition-colors
        "
      >
        <Download size={15} />
        {t(lang, "exportBtn")}
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="
          absolute right-0 mt-1 w-52 z-50
          bg-navy-800 border border-navy-600 rounded-xl
          shadow-xl shadow-black/40 overflow-hidden
        ">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="
                w-full flex items-center gap-3 px-4 py-3
                text-sm text-slate-300 hover:bg-navy-700 hover:text-white
                transition-colors text-left
              "
            >
              <span className="text-slate-500">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
