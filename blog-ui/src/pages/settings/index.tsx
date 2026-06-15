/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SystemSettings, ActivePath } from "../../types";
import { useLanguage } from "../../context/LanguageContext";
import { Sliders, BellOff, MessageSquare, Palette, RefreshCcw, CheckCircle, Info, LayoutGrid, Loader2, Sun, Moon } from "lucide-react";

interface SettingsProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  onResetDefaults: () => void;
  onUpdateSettings?: (data: any) => Promise<any>;
  setPath: (path: ActivePath) => void;
}

export default function SettingsView({
  settings,
  setSettings,
  onResetDefaults,
  onUpdateSettings,
  setPath,
}: SettingsProps) {
  const { t } = useLanguage();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const triggerFeedback = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  const handleToggleNotify = async () => {
    const next = !settings.allowNotifications;
    
    setIsSaving(true);
    try {
      if (onUpdateSettings) {
        const result = await onUpdateSettings({
          allow_notifications: next,
        });
        
        if (result.success) {
          setSettings((prev) => ({ ...prev, allowNotifications: next }));
          triggerFeedback(next ? t.settings.success.notifyAllow : t.settings.success.notifyDisable);
        }
      } else {
        setSettings((prev) => ({ ...prev, allowNotifications: next }));
        triggerFeedback(next ? t.settings.success.notifyAllow : t.settings.success.notifyDisable);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleComments = async () => {
    const next = !settings.allowComments;
    
    setIsSaving(true);
    try {
      if (onUpdateSettings) {
        const result = await onUpdateSettings({
          allow_comments: next,
        });
        
        if (result.success) {
          setSettings((prev) => ({ ...prev, allowComments: next }));
          triggerFeedback(next ? t.settings.success.commentsAllow : t.settings.success.commentsDisable);
        }
      } else {
        setSettings((prev) => ({ ...prev, allowComments: next }));
        triggerFeedback(next ? t.settings.success.commentsAllow : t.settings.success.commentsDisable);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDensity = async () => {
    const next = !settings.highDensityLayout;
    
    setIsSaving(true);
    try {
      if (onUpdateSettings) {
        const result = await onUpdateSettings({
          high_density_layout: next,
        });
        
        if (result.success) {
          setSettings((prev) => ({ ...prev, highDensityLayout: next }));
          triggerFeedback(next ? t.settings.success.densityHigh : t.settings.success.densityStandard);
        }
      } else {
        setSettings((prev) => ({ ...prev, highDensityLayout: next }));
        triggerFeedback(next ? t.settings.success.densityHigh : t.settings.success.densityStandard);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const setThemeAccent = async (theme: "cyan" | "violet" | "amber" | "emerald" | "custom", customHex?: string) => {
    setIsSaving(true);
    try {
      const data: Record<string, any> = { theme_accent: theme };
      if (theme === "custom" && customHex) {
        data.theme_accent_custom = customHex;
      }
      if (onUpdateSettings) {
        const result = await onUpdateSettings(data);
        if (result.success) {
          setSettings((prev) => ({ ...prev, themeAccent: theme, themeAccentCustom: customHex || prev.themeAccentCustom }));
          triggerFeedback(t.settings.success.theme.replace("{theme}", theme === "custom" ? customHex || "CUSTOM" : theme.toUpperCase()));
        }
      } else {
        setSettings((prev) => ({ ...prev, themeAccent: theme, themeAccentCustom: customHex || prev.themeAccentCustom }));
        triggerFeedback(t.settings.success.theme.replace("{theme}", theme === "custom" ? customHex || "CUSTOM" : theme.toUpperCase()));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const setSkin = async (skin: "dark" | "light") => {
    setIsSaving(true);
    try {
      if (onUpdateSettings) {
        const result = await onUpdateSettings({ skin });
        if (result.success) {
          setSettings((prev) => ({ ...prev, skin }));
          triggerFeedback(t.settings.skin.success.replace("{skin}", skin === "dark" ? t.settings.skin.dark : t.settings.skin.light));
        }
      } else {
        setSettings((prev) => ({ ...prev, skin }));
        triggerFeedback(t.settings.skin.success.replace("{skin}", skin === "dark" ? t.settings.skin.dark : t.settings.skin.light));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const navigate = useNavigate();

  const handleReset = () => {
    onResetDefaults();
    triggerFeedback(t.settings.success.reset);
    setTimeout(() => navigate("/"), 1200);
  };

  const [customColor, setCustomColor] = useState(settings.themeAccentCustom || "#3b82f6");

  const paletteOptions = [
    { id: "cyan" as const, label: t.settings.theme.cyan, bgClass: "bg-cyan-500", borderClass: "border-cyan-500/20", colorText: "text-cyan-400" },
    { id: "violet" as const, label: t.settings.theme.violet, bgClass: "bg-violet-500", borderClass: "border-violet-500/20", colorText: "text-violet-400" },
    { id: "amber" as const, label: t.settings.theme.amber, bgClass: "bg-amber-500", borderClass: "border-amber-500/20", colorText: "text-amber-400" },
    { id: "emerald" as const, label: t.settings.theme.emerald, bgClass: "bg-emerald-500", borderClass: "border-emerald-500/20", colorText: "text-emerald-400" },
    { id: "custom" as const, label: t.settings.theme.custom || "Custom", bgClass: "", borderClass: "border-slate-500/20", colorText: "text-slate-300" },
  ];

  const themeBtnColors = {
    cyan: "bg-cyan-600 hover:bg-cyan-500",
    violet: "bg-violet-600 hover:bg-violet-500",
    amber: "bg-amber-600 hover:bg-amber-500",
    emerald: "bg-emerald-600 hover:bg-emerald-500",
    custom: "bg-slate-600 hover:bg-slate-500"
  };

  const getThemeBtnStyle = () => {
    if (settings.themeAccent === "custom" && settings.themeAccentCustom) {
      return { backgroundColor: settings.themeAccentCustom };
    }
    return {};
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16 animate-fade-in" id="settings-view-workspace">
      
      {/* Introduction */}
      <div className="mb-10 pb-6 border-b border-slate-800">
        <h1 className="text-3xl font-heading font-extrabold tracking-tight text-white mb-2 flex items-center gap-2">
          <Sliders className="w-7 h-7 text-slate-500" />
          {t.settings.title}
        </h1>
        <p className="text-sm text-slate-400 font-sans font-light">
          {t.settings.subtitle}
        </p>
      </div>

      {successMsg && (
        <div style={settings.themeAccent === "custom" && settings.themeAccentCustom ? { borderColor: settings.themeAccentCustom + "33", backgroundColor: settings.themeAccentCustom + "14" } : undefined} className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3.5 mb-6 text-center text-xs text-indigo-300 font-mono flex items-center justify-center gap-2 animate-pulse">
          <CheckCircle style={settings.themeAccent === "custom" && settings.themeAccentCustom ? { color: settings.themeAccentCustom } : undefined} className="w-4 h-4 text-indigo-400" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="space-y-6">
        
        {/* Aspect 1: Theme presets config */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 sm:p-6 text-left">
          <div className="flex gap-2 items-center mb-4">
            <Palette className="w-5 h-5 text-slate-500" />
            <h3 className="text-sm font-semibold tracking-wide text-white">{t.settings.theme.title}</h3>
          </div>

          <p className="text-xs text-slate-400 font-sans mb-5 leading-normal font-light">
            {t.settings.theme.subtitle}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {paletteOptions.map((opt) => {
              const active = settings.themeAccent === opt.id;
              if (opt.id === "custom") {
                return (
                  <button
                    key={opt.id}
                    onClick={() => setThemeAccent("custom", customColor)}
                    disabled={isSaving}
                    className={`rounded-xl border p-4 text-center cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      active
                        ? "border-slate-500/20 bg-slate-950 shadow-md scale-[1.02] ring-1 ring-slate-800"
                        : "border-slate-850 bg-slate-900/10 hover:border-slate-805 hover:bg-slate-900/40"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative h-4.5 w-4.5">
                        <input
                          type="color"
                          value={customColor}
                          onChange={(e) => {
                            setCustomColor(e.target.value);
                            setThemeAccent("custom", e.target.value);
                          }}
                          className="absolute inset-0 w-full h-full rounded-full cursor-pointer opacity-0"
                        />
                        <div
                          className="h-4.5 w-4.5 rounded-full border border-slate-600"
                          style={{ backgroundColor: customColor }}
                        />
                      </div>
                      <span className={`text-[10px] font-mono font-medium ${active ? "text-slate-300" : "text-slate-400"}`}>
                        {opt.label}
                      </span>
                    </div>
                  </button>
                );
              }
              return (
                <button
                  key={opt.id}
                  onClick={() => setThemeAccent(opt.id)}
                  disabled={isSaving}
                  className={`rounded-xl border p-4 text-center cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    active
                      ? `${opt.borderClass} bg-slate-950 shadow-md scale-[1.02] ring-1 ring-slate-800`
                      : "border-slate-850 bg-slate-900/10 hover:border-slate-805 hover:bg-slate-900/40"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`h-4.5 w-4.5 rounded-full ${opt.bgClass}`} />
                    <span className={`text-[10px] font-mono font-medium ${active ? opt.colorText : "text-slate-400"}`}>
                      {opt.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Skin toggle */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 sm:p-6 text-left">
          <div className="flex gap-2 items-center mb-4">
            {settings.skin === "light" ? <Sun className="w-5 h-5 text-slate-500" /> : <Moon className="w-5 h-5 text-slate-500" />}
            <h3 className="text-sm font-semibold tracking-wide text-white">{t.settings.skin.title}</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSkin("dark")}
              disabled={isSaving}
              className={`rounded-xl border p-4 text-center cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                settings.skin === "dark"
                  ? "border-slate-600 bg-slate-950 shadow-md scale-[1.02] ring-1 ring-slate-700"
                  : "border-slate-850 bg-slate-900/10 hover:border-slate-805 hover:bg-slate-900/40"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Moon className="w-5 h-5 text-slate-400" />
                <span className={`text-xs font-mono font-medium ${settings.skin === "dark" ? "text-white" : "text-slate-400"}`}>
                  {t.settings.skin.dark}
                </span>
                <div className="flex gap-1 mt-1">
                  <div className="w-4 h-4 rounded bg-slate-950 border border-slate-800" />
                  <div className="w-4 h-4 rounded bg-slate-900 border border-slate-800" />
                  <div className="w-4 h-4 rounded bg-slate-800 border border-slate-700" />
                </div>
              </div>
            </button>

            <button
              onClick={() => setSkin("light")}
              disabled={isSaving}
              className={`rounded-xl border p-4 text-center cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                settings.skin === "light"
                  ? "border-slate-400 bg-white shadow-md scale-[1.02] ring-1 ring-slate-300"
                  : "border-slate-850 bg-slate-900/10 hover:border-slate-805 hover:bg-slate-900/40"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Sun className="w-5 h-5 text-amber-400" />
                <span className={`text-xs font-mono font-medium ${settings.skin === "light" ? "text-slate-800" : "text-slate-400"}`}>
                  {t.settings.skin.light}
                </span>
                <div className="flex gap-1 mt-1">
                  <div className="w-4 h-4 rounded bg-gray-50 border border-gray-200" />
                  <div className="w-4 h-4 rounded bg-white border border-gray-200" />
                  <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200" />
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Aspect 2: Operational switches */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 sm:p-6 text-left space-y-5">
          <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block pl-1">{t.settings.switches.title}</span>
          
          {/* Notification Alert System */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-900">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <BellOff className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-semibold text-white tracking-tight">{t.settings.switches.notifications.title}</h4>
              </div>
              <p className="text-[11px] text-slate-400 font-sans font-light leading-normal mt-1">
                {t.settings.switches.notifications.desc}
              </p>
            </div>

            <button
              onClick={handleToggleNotify}
              disabled={isSaving}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                !settings.allowNotifications ? "bg-red-600" : "bg-slate-800"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  !settings.allowNotifications ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Comment Locks Controls */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-900">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-semibold text-white tracking-tight">{t.settings.switches.comments.title}</h4>
              </div>
              <p className="text-[11px] text-slate-400 font-sans font-light leading-normal mt-1">
                {t.settings.switches.comments.desc}
              </p>
            </div>

            <button
              onClick={handleToggleComments}
              disabled={isSaving}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                !settings.allowComments ? "bg-red-600" : "bg-slate-800"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  !settings.allowComments ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* High Density Layout Parameters */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-semibold text-white tracking-tight">{t.settings.switches.density.title}</h4>
              </div>
              <p className="text-[11px] text-slate-400 font-sans font-light leading-normal mt-1">
                {t.settings.switches.density.desc}
              </p>
            </div>

            <button
              onClick={handleToggleDensity}
              disabled={isSaving}
              style={settings.highDensityLayout && settings.themeAccent === "custom" && settings.themeAccentCustom ? { backgroundColor: settings.themeAccentCustom } : undefined}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                settings.highDensityLayout ? "bg-indigo-600" : "bg-slate-800"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.highDensityLayout ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Aspect 3: Safe Factory Reset */}
        <div className="rounded-2xl border border-red-500/20 bg-red-950/5 p-5 sm:p-6 text-left">
          <div className="flex gap-2 items-center mb-3">
            <RefreshCcw className="w-4 h-4 text-red-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-red-400">{t.settings.reset.title}</h3>
          </div>

          <p className="text-[11px] text-slate-400 font-sans leading-normal mb-5 font-light">
            {t.settings.reset.desc}
          </p>

          <button
            onClick={handleReset}
            className="rounded-lg bg-red-600/10 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white px-4 py-2 text-xs font-mono transition-colors cursor-pointer"
          >
            {t.settings.reset.button}
          </button>
        </div>

        {/* Informational specs */}
        <div className="flex gap-2 items-start text-left text-[11px] text-slate-500 pl-2">
          <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
          <span className="font-light">
            {t.settings.info}
          </span>
        </div>

      </div>

    </div>
  );
}
