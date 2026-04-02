// src/components/VideoTable.jsx
import { useState } from "react";
import { Search, ExternalLink, ChevronUp, ChevronDown } from "lucide-react";
import { fmtNumber, fmtDate, TYPE_COLORS } from "../utils/format";
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../utils/i18n";

const COLS = [
  { key: "title",         sortable: true  },
  { key: "published_date",sortable: true  },
  { key: "view_count",    sortable: true  },
  { key: "like_count",    sortable: true  },
  { key: "views_per_day", sortable: true  },
  { key: "duration_fmt",  sortable: false },
  { key: "video_type",    sortable: false },
];

export default function VideoTable({ videos }) {
  const [search, setSearch]   = useState("");
  const [sortKey, setSortKey] = useState("view_count");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage]       = useState(0);
  const PAGE_SIZE = 15;
  const { lang }  = useLanguage();

  const colLabels = {
    title:          t(lang, "tableColTitle"),
    published_date: t(lang, "tableColDate"),
    view_count:     t(lang, "tableColViews"),
    like_count:     t(lang, "tableColLikes"),
    views_per_day:  t(lang, "tableColVpd"),
    duration_fmt:   t(lang, "tableColDuration"),
    video_type:     t(lang, "tableColType"),
  };

  function handleSort(key) {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(false); }
    setPage(0);
  }

  const filtered = videos.filter((v) =>
    v.title.toLowerCase().includes(search.toLowerCase())
  );
  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortKey], vb = b[sortKey];
    if (va == null) return 1; if (vb == null) return -1;
    return sortAsc ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
  });
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged      = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-navy-700">
        <h3 className="text-sm font-semibold text-slate-300">
          {t(lang, "tableTitle")}
          <span className="ml-2 text-xs text-slate-500 font-normal">
            ({filtered.length} {t(lang, "tableOf")} {videos.length})
          </span>
        </h3>
        <div className="relative w-56">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder={t(lang, "tableSearch")}
            className="w-full h-8 pl-8 pr-3 text-xs bg-navy-900 border border-navy-600 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-accent-blue" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-700">
              {COLS.map((col) => (
                <th key={col.key} onClick={() => col.sortable && handleSort(col.key)}
                  className={`px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap ${col.sortable ? "cursor-pointer select-none hover:text-slate-300" : ""}`}>
                  <span className="flex items-center gap-1">
                    {colLabels[col.key]}
                    {col.sortable && sortKey === col.key && (sortAsc ? <ChevronUp size={12}/> : <ChevronDown size={12}/>)}
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                {t(lang, "tableColLink")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-700">
            {paged.map((v) => (
              <tr key={v.id} className="hover:bg-navy-800/60 transition-colors">
                <td className="px-4 py-3 max-w-xs">
                  <div className="flex items-center gap-3">
                    {v.thumbnail && (
                      <img src={v.thumbnail} alt="" className="w-16 h-9 rounded object-cover flex-shrink-0" />
                    )}
                    <span className="text-slate-200 text-xs font-medium line-clamp-2">{v.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{fmtDate(v.published_date)}</td>
                <td className="px-4 py-3 text-slate-200 text-xs font-medium whitespace-nowrap">{fmtNumber(v.view_count)}</td>
                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{fmtNumber(v.like_count)}</td>
                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{fmtNumber(v.views_per_day)}</td>
                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{v.duration_fmt}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: TYPE_COLORS[v.video_type] + "20", color: TYPE_COLORS[v.video_type] }}>
                    {v.video_type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <a href={v.watch_url} target="_blank" rel="noreferrer"
                    className="text-accent-blue hover:text-blue-400 transition-colors">
                    <ExternalLink size={14}/>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-navy-700">
          <span className="text-xs text-slate-500">{t(lang,"tablePage")} {page+1} {t(lang,"tableOf")} {totalPages}</span>
          <div className="flex gap-2">
            <PagBtn onClick={() => setPage((p) => Math.max(0, p-1))} disabled={page === 0}>{t(lang,"tablePrev")}</PagBtn>
            <PagBtn onClick={() => setPage((p) => Math.min(totalPages-1, p+1))} disabled={page === totalPages-1}>{t(lang,"tableNext")}</PagBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function PagBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="px-3 py-1 text-xs rounded-md border border-navy-600 text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
      {children}
    </button>
  );
}
