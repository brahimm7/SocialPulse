// src/components/Footer.jsx
import { Github, Linkedin } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../utils/i18n";
import logo from "../assets/logo.jpg";

export default function Footer() {
  const { lang, setLang, LANGUAGES } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-navy-700 bg-navy-900/60 print:hidden">
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Top row: brand + links */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="SocialPulse" className="w-9 h-9 rounded-lg object-contain bg-white p-0.5" />
            <div>
              <div className="font-bold text-white text-base">SocialPulse</div>
              <div className="text-xs text-slate-500">{t(lang, "footerBuiltWith")}</div>
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">
              {t(lang, "footerContact")}
            </span>
            <div className="flex items-center gap-3">
              <a
                href="https://www.linkedin.com/in/brahim-mayara-5265ba313/"
                target="_blank"
                rel="noreferrer"
                className="
                  flex items-center gap-2 px-3 py-1.5 rounded-lg
                  bg-[#0077b5]/10 border border-[#0077b5]/30
                  text-[#0077b5] hover:bg-[#0077b5]/20
                  text-xs font-medium transition-colors
                "
              >
                <Linkedin size={14} />
                Brahim Mayara
              </a>
              <a
                href="https://github.com/brahimm7"
                target="_blank"
                rel="noreferrer"
                className="
                  flex items-center gap-2 px-3 py-1.5 rounded-lg
                  bg-white/5 border border-white/10
                  text-slate-300 hover:bg-white/10
                  text-xs font-medium transition-colors
                "
              >
                <Github size={14} />
                brahimm7
              </a>
            </div>
          </div>

          {/* Language switcher */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">
              {t(lang, "footerLang")}
            </span>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                    border text-xs font-medium transition-colors
                    ${lang === l.code
                      ? "bg-accent-blue border-accent-blue text-white"
                      : "border-navy-600 text-slate-400 hover:border-slate-500 hover:text-white"}
                  `}
                >
                  <span>{l.flag}</span>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-navy-700 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              © {year} SocialPulse by Brahim Mayara. {t(lang, "footerRights")}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-700">MIT License</span>
              <span className="text-slate-700 mx-2">·</span>
              <span>Not affiliated with YouTube or Google.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
