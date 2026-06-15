import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ActivePath, UserProfile, AppNotification, SystemSettings } from "../types";
import { Terminal, Bell, Settings, LogIn, Compass, FileText, ToggleLeft, ToggleRight, LayoutGrid, Globe } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface HeaderProps {
  currentPath: ActivePath;
  setPath: (path: ActivePath) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;
  profile: UserProfile;
  notifications: AppNotification[];
  settings: SystemSettings;
  prototypeMode: boolean;
  setPrototypeMode: (v: boolean) => void;
}

export default function Header({
  currentPath,
  setPath,
  isLoggedIn,
  setIsLoggedIn,
  profile,
  notifications,
  settings,
  prototypeMode,
  setPrototypeMode,
}: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate("/");
  };

  const navItems: { path: ActivePath; route: string; label: string; icon: React.ReactNode }[] = [
    { path: "home", route: "/", label: t.header.overview, icon: <Compass className="w-4 h-4" /> },
    { path: "blog", route: "/blog", label: t.header.blog, icon: <FileText className="w-4 h-4" /> },
    { path: "dev-tools", route: "/dev-tools", label: t.header.devTools, icon: <Terminal className="w-4 h-4" /> },
    { path: "notes", route: "/notes", label: t.header.notes, icon: <LayoutGrid className="w-4 h-4" /> },
  ];

  const accentClasses = {
    cyan: "border-cyan-500 text-cyan-400 focus:ring-cyan-500/20 shadow-cyan-950/30",
    violet: "border-violet-500 text-violet-400 focus:ring-violet-500/20 shadow-violet-950/30",
    amber: "border-amber-500 text-amber-400 focus:ring-amber-500/20 shadow-amber-950/30",
    emerald: "border-emerald-500 text-emerald-400 focus:ring-emerald-500/20 shadow-emerald-950/30"
  };

  const activeAccentText = {
    cyan: "text-cyan-400 font-medium",
    violet: "text-violet-400 font-medium",
    amber: "text-amber-400 font-medium",
    emerald: "text-emerald-400 font-medium",
    custom: "text-slate-300 font-medium"
  };

  const activeAccentBg = {
    cyan: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
    violet: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
    amber: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    custom: "bg-slate-500/10 text-slate-300 border border-slate-500/20"
  };

  const isCustom = settings.themeAccent === "custom" && settings.themeAccentCustom;
  const customColor = isCustom ? settings.themeAccentCustom : undefined;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        <div className="flex items-center gap-8">
          <Link
            id="header-nav-logo"
            to="/"
            className="flex items-center gap-2.5 transition-transform hover:scale-[1.02] text-left"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
              <div
                className={`absolute inset-[6px] rounded-sm border-2 border-dashed ${settings.themeAccent === "cyan" ? "border-cyan-500/40" : settings.themeAccent === "violet" ? "border-violet-500/40" : settings.themeAccent === "amber" ? "border-amber-500/40" : settings.themeAccent === "emerald" ? "border-emerald-500/40" : "border-slate-500/40"}`}
                style={settings.themeAccent === "custom" && settings.themeAccentCustom ? { borderColor: settings.themeAccentCustom + "66" } : {}}
              />
              <div
                className={`h-2.5 w-2.5 rounded-full ${settings.themeAccent === "cyan" ? "bg-cyan-400" : settings.themeAccent === "violet" ? "bg-violet-400" : settings.themeAccent === "amber" ? "bg-amber-400" : settings.themeAccent === "emerald" ? "bg-emerald-400" : "bg-slate-400"} animate-pulse`}
                style={settings.themeAccent === "custom" && settings.themeAccentCustom ? { backgroundColor: settings.themeAccentCustom } : {}}
              />
            </div>
            <div>
              <span className="font-heading text-lg font-bold tracking-tight text-white">PortalCore</span>
              <p className="text-[9px] font-mono tracking-widest text-slate-500 uppercase">Precision.Arch</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5" id="header-nav-links">
            {navItems.map((item) => {
              const isActive = currentPath === item.path || (item.path === "blog" && (currentPath === "blog-detail" || currentPath === "blog-compose"));
              return (
                <Link
                  key={item.path}
                  id={`header-nav-link-${item.path}`}
                  to={item.route}
                  style={isActive && isCustom ? { color: customColor, backgroundColor: customColor + "1a", borderColor: customColor + "33" } : undefined}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
                    isActive
                      ? activeAccentBg[settings.themeAccent]
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          
          <button
            id="prototype-flow-toggle"
            onClick={() => setPrototypeMode(!prototypeMode)}
            className={`hidden sm:flex items-center gap-2 rounded-full px-3 py-1 text-xs border transition-all ${
              prototypeMode 
                ? "bg-indigo-950/40 border-indigo-500/50 text-indigo-300 shadow-sm" 
                : "bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300"
            }`}
            title="Toggle interactive route navigation vectors"
          >
            {prototypeMode ? (
              <>
                <ToggleRight className="w-4 h-4 text-indigo-400" />
                <span className="font-mono">{t.header.journeyMapOn}</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4" />
                <span className="font-mono">{t.header.journeyMapOff}</span>
              </>
            )}
          </button>

          <button
            id="language-toggle"
            onClick={() => setLanguage(language === "en" ? "zh" : "en")}
            className="flex items-center gap-2 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
            title="Toggle language"
          >
            <Globe className="w-4 h-4" />
            {language === "en" ? "中文" : "EN"}
          </button>

          {isLoggedIn ? (
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              
              <Link
                id="header-notifications-btn"
                to="/notifications"
                className={`relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white ${
                  currentPath === "notifications" ? "bg-slate-800 text-white" : ""
                }`}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-[3px] right-[3px] flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white shadow-md">
                    {unreadCount}
                  </span>
                )}
              </Link>

              <Link
                id="header-settings-btn"
                to="/settings"
                className={`rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white ${
                  currentPath === "settings" ? "bg-slate-800 text-white" : ""
                }`}
                title={t.header.systemSettings}
              >
                <Settings className="h-5 w-5" />
              </Link>

              <Link
                id="header-profile-btn"
                to="/profile"
                style={currentPath === "profile" && isCustom ? { borderColor: customColor + "99" } : undefined}
                className={`flex items-center gap-2 rounded-full border p-0.5 transition-all outline-none ${
                  currentPath === "profile"
                    ? `border-${settings.themeAccent}-500/60 ring-2 ring-${settings.themeAccent}-500/10`
                    : "border-slate-800 hover:border-slate-600"
                }`}
              >
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="h-8.5 w-8.5 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </Link>
            </div>
          ) : (
            <Link
              id="header-login-btn"
              to="/profile"
              className={`flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 text-sm font-medium text-white transition-all hover:scale-[1.01]`}
            >
              <LogIn className="w-4 h-4" />
              {t.header.login}
            </Link>
          )}
        </div>
      </div>

      <div className="md:hidden border-t border-slate-800 bg-slate-950/60 flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const isActive = currentPath === item.path || (item.path === "blog" && (currentPath === "blog-detail" || currentPath === "blog-compose"));
          return (
            <Link
              key={item.path}
              to={item.route}
              style={isActive && isCustom ? { color: customColor } : undefined}
              className={`flex flex-col items-center gap-0.5 rounded-md px-3 py-1 text-[10px] font-mono transition-colors ${
                isActive
                  ? activeAccentText[settings.themeAccent]
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {item.icon}
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}