// src/pages/Home.jsx
import { useChannelData } from "../hooks/useChannelData";
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../utils/i18n";
import logo from "../assets/logo.jpg";

import SearchBar      from "../components/SearchBar";
import ChannelHeader  from "../components/ChannelHeader";
import KpiCards       from "../components/KpiCards";
import VideoTable     from "../components/VideoTable";
import ExportMenu     from "../components/ExportMenu";
import Footer         from "../components/Footer";
import {
  Top10Chart, ViewsTimelineChart,
  DurationHistogram, ContentMixPie, EngagementScatter,
} from "../components/Charts";

export default function Home() {
  const { data, loading, error, fetchChannel } = useChannelData();
  const { lang } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Navbar ──────────────────────────────────────────── */}
      <header className="border-b border-navy-700 bg-navy-900/80 backdrop-blur-sm sticky top-0 z-20 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="SocialPulse" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" />
            <span className="font-bold text-white text-lg tracking-tight">SocialPulse</span>
          </div>
          <span className="text-xs text-slate-500 hidden sm:block">{t(lang, "tagline")}</span>
        </div>
      </header>

      {/* ── Hero search ─────────────────────────────────────── */}
      <section className="py-14 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src={logo} alt="SocialPulse" className="w-12 h-12 rounded-xl object-contain bg-white p-1" />
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {t(lang, "heroTitle")}
            </h1>
          </div>
          <p className="text-slate-400 mb-8 text-sm sm:text-base">{t(lang, "heroSub")}</p>
          <SearchBar onSearch={fetchChannel} loading={loading} />
        </div>
      </section>

      {/* ── Error ───────────────────────────────────────────── */}
      {error && (
        <div className="max-w-3xl mx-auto px-4 mb-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-300">
            <strong>{t(lang, "errorPrefix")}</strong> {error}
          </div>
        </div>
      )}

      {/* ── Loading skeleton ────────────────────────────────── */}
      {loading && (
        <div className="max-w-7xl mx-auto px-4 pb-12 space-y-4 animate-pulse">
          <div className="card h-28 bg-navy-800" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="card-sm h-28 bg-navy-800 border border-navy-700" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card h-80 bg-navy-800" />
            <div className="card h-80 bg-navy-800" />
          </div>
        </div>
      )}

      {/* ── Dashboard ───────────────────────────────────────── */}
      {data && !loading && (
        <main className="max-w-7xl mx-auto px-4 pb-10 space-y-5 flex-1 w-full">

          {/* Channel header + export */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <div className="flex-1"><ChannelHeader channel={data.channel} /></div>
            <div className="flex-shrink-0 sm:pt-6"><ExportMenu data={data} /></div>
          </div>

          {/* KPIs */}
          <KpiCards videos={data.videos} />

          {/* Charts row 1 — full width */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Top10Chart videos={data.videos} />
            <ViewsTimelineChart videos={data.videos} />
          </div>

          {/* Charts row 2 — three columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <DurationHistogram videos={data.videos} />
            <ContentMixPie summary={data.summary} />
            <EngagementScatter videos={data.videos} />
          </div>

          {/* Table */}
          <VideoTable videos={data.videos} />
        </main>
      )}

      {!data && !loading && !error && (
        <div className="flex-1 flex items-center justify-center text-slate-600 text-sm pb-20">
          Enter a channel above to get started.
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
