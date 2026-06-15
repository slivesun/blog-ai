import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ActivePath, SystemSettings } from "../../types";
import { FileText, Terminal, LayoutGrid, ArrowRight, Share2, CornerRightDown, Laptop, Globe, ShieldAlert, X } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { QRCodeSVG } from "qrcode.react";

interface HomeViewProps {
  setPath: (path: ActivePath) => void;
  settings: SystemSettings;
  prototypeMode: boolean;
}

export default function HomeView({ setPath, settings, prototypeMode }: HomeViewProps) {
  const { t } = useLanguage();
  const [showQR, setShowQR] = useState(false);
  const siteUrl = window.location.origin;

  const routeMap: Record<string, string> = {
    "blog": "/blog",
    "dev-tools": "/dev-tools",
    "notes": "/notes",
  };

  const accentTextColors = {
    cyan: "text-cyan-400 group-hover:text-cyan-300",
    violet: "text-violet-400 group-hover:text-violet-300",
    amber: "text-amber-400 group-hover:text-amber-300",
    emerald: "text-emerald-400 group-hover:text-emerald-300",
  };

  const accentBorderColors = {
    cyan: "hover:border-cyan-500/30 group-hover:border-cyan-500/20",
    violet: "hover:border-violet-500/30 group-hover:border-violet-500/20",
    amber: "hover:border-amber-500/30 group-hover:border-amber-500/20",
    emerald: "hover:border-emerald-500/30 group-hover:border-emerald-500/20",
  };

  const accentGradients = {
    cyan: "from-cyan-500/10 via-cyan-950/5 to-transparent",
    violet: "from-violet-500/10 via-violet-950/5 to-transparent",
    amber: "from-amber-500/10 via-amber-950/5 to-transparent",
    emerald: "from-emerald-500/10 via-emerald-950/5 to-transparent",
  };

  const cards = [
    {
      id: "blog",
      title: t.home.cards.blog.title,
      desc: t.home.cards.blog.desc,
      actionLabel: t.home.cards.blog.action,
      path: "blog" as ActivePath,
      icon: <FileText className="w-6 h-6" />,
      badge: t.home.cards.blog.badge
    },
    {
      id: "dev-tools",
      title: t.home.cards.devTools.title,
      desc: t.home.cards.devTools.desc,
      actionLabel: t.home.cards.devTools.action,
      path: "dev-tools" as ActivePath,
      icon: <Terminal className="w-6 h-6" />,
      badge: t.home.cards.devTools.badge
    },
    {
      id: "notes",
      title: t.home.cards.notes.title,
      desc: t.home.cards.notes.desc,
      actionLabel: t.home.cards.notes.action,
      path: "notes" as ActivePath,
      icon: <LayoutGrid className="w-6 h-6" />,
      badge: t.home.cards.notes.badge
    }
  ];

  return (
    <div className="py-12 sm:py-16 lg:py-20 animate-fade-in" id="home-view-container">
      
      <div className="text-center max-w-3xl mx-auto px-4">
        {prototypeMode && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-[11px] font-mono text-indigo-400 border border-indigo-500/20 mb-6 animate-pulse">
            <Share2 className="w-3 h-3" />
            <span>{t.home.prototypeConnections}</span>
          </div>
        )}

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold tracking-tight text-white mb-6">
          {t.home.heroTitle}
        </h1>
        
        <p className="text-slate-400 text-base sm:text-lg lg:text-xl font-sans font-light leading-relaxed max-w-2xl mx-auto mb-12">
          {t.home.heroSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4" id="home-modules-grid">
        {cards.map((card) => {
          const isTargeted = prototypeMode;
          return (
            <Link
              key={card.id}
              id={`home-card-${card.id}`}
              to={routeMap[card.id] || "/"}
              className={`group relative flex flex-col justify-between rounded-2xl border ${
                isTargeted
                  ? "border-indigo-500 bg-slate-900/40 shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-2 ring-indigo-500/20"
                  : "border-slate-800 bg-slate-900/20 hover:border-slate-700 hover:bg-slate-900/40"
              } p-6 sm:p-8 transition-all duration-300 hover:translate-y-[-4px] cursor-pointer`}
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${accentGradients[settings.themeAccent]}`} />

              <div>
                <div className="flex items-center justify-between mb-6 relative">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-slate-400 transition-colors group-hover:text-white ${isTargeted ? "text-indigo-400" : ""}`}>
                    {card.icon}
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 group-hover:text-slate-400">
                    {card.badge}
                  </span>
                </div>

                <h3 className="text-xl font-heading font-semibold text-white mb-3 group-hover:text-white">
                  {card.title}
                </h3>
                <p className="text-sm text-slate-400 font-sans font-light leading-relaxed mb-8">
                  {card.desc}
                </p>
              </div>

              <div className="flex items-center gap-2 mt-auto relative z-10">
                <span className={`text-sm font-medium transition-colors ${accentTextColors[settings.themeAccent]}`}>
                  {card.actionLabel}
                </span>
                <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1.5 ${accentTextColors[settings.themeAccent]}`} />
              </div>
            </Link>
          );
        })}
      </div>

      {prototypeMode && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 animate-slide-up" id="journey-map-canvas-container">
          <div className="rounded-2xl border border-indigo-500/30 bg-slate-950/60 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 border-b border-indigo-500/20 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
                  <h4 className="text-sm font-mono uppercase tracking-wider text-indigo-300">
                    {t.home.journeyMap.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {t.home.journeyMap.subtitle}
                </p>
              </div>
              <button
                onClick={() => setShowQR(true)}
                className="hidden sm:flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span className="font-mono">{t.home.shareSite}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="blueprint-grid">
              
              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 relative group hover:border-indigo-400/50 transition-all">
                <CornerRightDown className="absolute top-3 right-3 w-4 h-4 text-slate-600 group-hover:text-indigo-400" />
                <span className="text-[10px] font-mono text-slate-500">ROOT // ENTRY</span>
                <h5 className="text-sm font-semibold text-white mt-1">{t.home.journeyMap.entry.title}</h5>
                <p className="text-[11px] text-slate-400 mt-1">{t.home.journeyMap.entry.desc}</p>
                <Link
                  to="/"
                  className="mt-3 text-xs text-indigo-400 font-mono flex items-center gap-1 hover:underline cursor-pointer"
                >
                  {t.home.journeyMap.entry.jump}
                </Link>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 relative group hover:border-indigo-400/50 transition-all">
                <CornerRightDown className="absolute top-3 right-3 w-4 h-4 text-slate-600 group-hover:text-indigo-400" />
                <span className="text-[10px] font-mono text-slate-500">CLUSTER // BLOG_MESH</span>
                <h5 className="text-sm font-semibold text-white mt-1">{t.home.journeyMap.blog.title}</h5>
                <p className="text-[11px] text-slate-400 mt-1">{t.home.journeyMap.blog.desc}</p>
                <Link
                  to="/blog"
                  className="mt-3 text-xs text-indigo-400 font-mono flex items-center gap-1 hover:underline cursor-pointer"
                >
                  {t.home.journeyMap.blog.jump}
                </Link>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 relative group hover:border-indigo-400/50 transition-all">
                <CornerRightDown className="absolute top-3 right-3 w-4 h-4 text-slate-600 group-hover:text-indigo-400" />
                <span className="text-[10px] font-mono text-slate-500">CLUSTER // DEV_UTILITIES</span>
                <h5 className="text-sm font-semibold text-white mt-1">{t.home.journeyMap.dev.title}</h5>
                <p className="text-[11px] text-slate-400 mt-1">{t.home.journeyMap.dev.desc}</p>
                <Link
                  to="/dev-tools"
                  className="mt-3 text-xs text-indigo-400 font-mono flex items-center gap-1 hover:underline cursor-pointer"
                >
                  {t.home.journeyMap.dev.jump}
                </Link>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 relative group hover:border-indigo-400/50 transition-all">
                <CornerRightDown className="absolute top-3 right-3 w-4 h-4 text-slate-600 group-hover:text-indigo-400" />
                <span className="text-[10px] font-mono text-slate-500">CLUSTER // MARKS_CANVAS</span>
                <h5 className="text-sm font-semibold text-white mt-1">{t.home.journeyMap.notes.title}</h5>
                <p className="text-[11px] text-slate-400 mt-1">{t.home.journeyMap.notes.desc}</p>
                <Link
                  to="/notes"
                  className="mt-3 text-xs text-indigo-400 font-mono flex items-center gap-1 hover:underline cursor-pointer"
                >
                  {t.home.journeyMap.notes.jump}
                </Link>
              </div>

            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 text-center border-t border-slate-900 pt-16">
        <span className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">{t.home.specs.title}</span>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-12 mt-6">
          <div className="flex items-center gap-2 cursor-default">
            <Laptop className="w-4 h-4 text-slate-600" />
            <span className="text-xs text-slate-500 font-mono">{t.home.specs.react}</span>
          </div>
          <div className="flex items-center gap-2 cursor-default">
            <Globe className="w-4 h-4 text-slate-600" />
            <span className="text-xs text-slate-500 font-mono">{t.home.specs.proxy}</span>
          </div>
          <div className="flex items-center gap-2 cursor-default">
            <ShieldAlert className="w-4 h-4 text-slate-600" />
            <span className="text-xs text-slate-500 font-mono">{t.home.specs.storage}</span>
          </div>
        </div>
      </div>

      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowQR(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl animate-fade-in w-1/2 max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-heading font-semibold text-white">{t.home.shareSite}</h3>
              <button onClick={() => setShowQR(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG value={siteUrl} size={180} level="M" />
              </div>
              <p className="text-xs text-slate-400 font-mono">{t.home.scanToVisit}</p>
              <p className="text-sm text-indigo-400 font-mono">{siteUrl}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}