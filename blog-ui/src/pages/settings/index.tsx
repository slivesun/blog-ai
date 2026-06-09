/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SystemSettings, ActivePath } from "../../types";
import { Sliders, BellOff, MessageSquare, Palette, RefreshCcw, CheckCircle, Info, LayoutGrid, Loader2 } from "lucide-react";

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
          triggerFeedback(`Notification parameters configured: ${next ? "Allow Alert Stream" : "Disable Alerts"}`);
        }
      } else {
        setSettings((prev) => ({ ...prev, allowNotifications: next }));
        triggerFeedback(`Notification parameters configured: ${next ? "Allow Alert Stream" : "Disable Alerts"}`);
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
          triggerFeedback(`Comments lockdown: ${next ? "Allow reader feedback" : "Secure locks enabled (Read only)"}`);
        }
      } else {
        setSettings((prev) => ({ ...prev, allowComments: next }));
        triggerFeedback(`Comments lockdown: ${next ? "Allow reader feedback" : "Secure locks enabled (Read only)"}`);
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
          triggerFeedback(`Layout scale updated: ${next ? "High density active" : "Standard canvas standard"}`);
        }
      } else {
        setSettings((prev) => ({ ...prev, highDensityLayout: next }));
        triggerFeedback(`Layout scale updated: ${next ? "High density active" : "Standard canvas standard"}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const setThemeAccent = async (theme: "cyan" | "violet" | "amber" | "emerald") => {
    setIsSaving(true);
    try {
      if (onUpdateSettings) {
        const result = await onUpdateSettings({
          theme_accent: theme,
        });
        
        if (result.success) {
          setSettings((prev) => ({ ...prev, themeAccent: theme }));
          triggerFeedback(`Visual highlight configured to ${theme.toUpperCase()}`);
        }
      } else {
        setSettings((prev) => ({ ...prev, themeAccent: theme }));
        triggerFeedback(`Visual highlight configured to ${theme.toUpperCase()}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const navigate = useNavigate();

  const handleReset = () => {
    onResetDefaults();
    triggerFeedback("System cache, worksheets, and layouts successfully restored.");
    setTimeout(() => navigate("/"), 1200);
  };

  const paletteOptions = [
    { id: "cyan" as const, label: "Space Cyan", bgClass: "bg-cyan-500", borderClass: "border-cyan-500/20", colorText: "text-cyan-400" },
    { id: "violet" as const, label: "Violet Obsidian", bgClass: "bg-violet-500", borderClass: "border-violet-500/20", colorText: "text-violet-400" },
    { id: "amber" as const, label: "Solar Amber", bgClass: "bg-amber-500", borderClass: "border-amber-500/20", colorText: "text-amber-400" },
    { id: "emerald" as const, label: "Emerald Terminal", bgClass: "bg-emerald-500", borderClass: "border-emerald-500/20", colorText: "text-emerald-400" },
  ];

  const themeBtnColors = {
    cyan: "bg-cyan-600 hover:bg-cyan-500",
    violet: "bg-violet-600 hover:bg-violet-500",
    amber: "bg-amber-600 hover:bg-amber-500",
    emerald: "bg-emerald-600 hover:bg-emerald-500"
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16 animate-fade-in" id="settings-view-workspace">
      
      {/* Introduction */}
      <div className="mb-10 pb-6 border-b border-slate-800">
        <h1 className="text-3xl font-heading font-extrabold tracking-tight text-white mb-2 flex items-center gap-2">
          <Sliders className="w-7 h-7 text-slate-500" />
          General Preferences
        </h1>
        <p className="text-sm text-slate-400 font-sans font-light">
          Configure security bounds, comments moderation, UI scaling layout density, and visual highlight presets.
        </p>
      </div>

      {successMsg && (
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3.5 mb-6 text-center text-xs text-indigo-300 font-mono flex items-center justify-center gap-2 animate-pulse">
          <CheckCircle className="w-4 h-4 text-indigo-400" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="space-y-6">
        
        {/* Aspect 1: Theme presets config */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 sm:p-6 text-left">
          <div className="flex gap-2 items-center mb-4">
            <Palette className="w-5 h-5 text-slate-500" />
            <h3 className="text-sm font-semibold tracking-wide text-white">Interface Accent Matrix</h3>
          </div>
          
          <p className="text-xs text-slate-400 font-sans mb-5 leading-normal font-light">
            Select an aesthetic signature wavelength to override borders, buttons, and visual focus states.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {paletteOptions.map((opt) => {
              const active = settings.themeAccent === opt.id;
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

        {/* Aspect 2: Operational switches */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 sm:p-6 text-left space-y-5">
          <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block pl-1">Operational Switches</span>
          
          {/* Notification Alert System */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-900">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <BellOff className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-semibold text-white tracking-tight">Deactivate Alert System</h4>
              </div>
              <p className="text-[11px] text-slate-400 font-sans font-light leading-normal mt-1">
                Completely disable unread counters and silence system update feeds.
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
                <h4 className="text-xs font-semibold text-white tracking-tight">Disable Comments Logging</h4>
              </div>
              <p className="text-[11px] text-slate-400 font-sans font-light leading-normal mt-1">
                Prevents external reader profiles from appending commentary variables to published works.
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
                <h4 className="text-xs font-semibold text-white tracking-tight">Enforce High-Density Layout</h4>
              </div>
              <p className="text-[11px] text-slate-400 font-sans font-light leading-normal mt-1">
                Minimizes padding limits and displays developer telemetry markers on relevant screens.
              </p>
            </div>

            <button
              onClick={handleToggleDensity}
              disabled={isSaving}
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
            <h3 className="text-xs font-mono uppercase tracking-wider text-red-400">Initialize Cache Reset</h3>
          </div>
          
          <p className="text-[11px] text-slate-400 font-sans leading-normal mb-5 font-light">
            Deletes all custom notes composed in Notes Canvas, published items, and resets system parameters back to pre-saved factory default variables.
          </p>

          <button
            onClick={handleReset}
            className="rounded-lg bg-red-600/10 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white px-4 py-2 text-xs font-mono transition-colors cursor-pointer"
          >
            Clear Caches and Restore Defaults
          </button>
        </div>

        {/* Informational specs */}
        <div className="flex gap-2 items-start text-left text-[11px] text-slate-500 pl-2">
          <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
          <span className="font-light">
            Settings require no server reload. Variables synchronize into client local states instantaneously, guaranteeing secure local configurations.
          </span>
        </div>

      </div>

    </div>
  );
}
