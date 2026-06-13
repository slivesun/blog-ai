/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { UserProfile, BlogArticle, ActivePath, SystemSettings } from "../../types";
import { useLanguage } from "../../context/LanguageContext";
import { Edit3, Check, Github, Mail, FileText, Bookmark, Trash2, Globe, Eye, EyeOff, BookOpen, LogOut, Loader2, AlertCircle, X } from "lucide-react";

interface ProfileProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  articles: BlogArticle[];
  setArticles: React.Dispatch<React.SetStateAction<BlogArticle[]>>;
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;
  setPath: (path: ActivePath) => void;
  setSelectedArticleId: (id: string | null) => void;
  settings: SystemSettings;
  onUpdateProfile?: (data: any) => Promise<any>;
  onDeleteArticle?: (id: string) => Promise<any>;
  onLogin?: (username: string, password: string) => Promise<any>;
  onLogout?: () => Promise<void>;
  onRegister?: (username: string, email: string, password: string) => Promise<any>;
}

export default function ProfileView({
  profile,
  setProfile,
  articles,
  setArticles,
  isLoggedIn,
  setIsLoggedIn,
  setPath,
  setSelectedArticleId,
  settings,
  onUpdateProfile,
  onDeleteArticle,
  onLogin,
  onLogout,
  onRegister,
}: ProfileProps) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [newNickname, setNewNickname] = useState(profile.nickname || "");
  const [newName, setNewName] = useState(profile.name);
  const [newRole, setNewRole] = useState(profile.role);
  const [newBio, setNewBio] = useState(profile.bio);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<"published" | "drafts">("published");

  // Auth states
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const [simulatedDrafts, setSimulatedDrafts] = useState<{ id: string; title: string; category: string; date: string }[]>([
    { id: "draft-1", title: "Review of Container Limits in Cloud sandboxes", category: "Systems", date: "June 03, 2024" },
    { id: "draft-2", title: "Visual contrast alignment requirements", category: "Design", date: "May 29, 2024" }
  ]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      if (onUpdateProfile) {
        const result = await onUpdateProfile({
          nickname: newNickname || undefined,
          full_name: newName,
          bio: newBio,
          github_url: profile.githubUrl,
        });

        if (result.success) {
          setProfile({
            ...profile,
            nickname: newNickname || undefined,
            name: newNickname || newName,
            bio: newBio
          });
          setIsEditing(false);
        }
      } else {
        setProfile({
          ...profile,
          nickname: newNickname || undefined,
          name: newNickname || newName,
          role: newRole,
          bio: newBio
        });
        setIsEditing(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePublished = async (id: string) => {
    if (onDeleteArticle) {
      const result = await onDeleteArticle(id);
      if (result.success) {
        setArticles((prev) => prev.filter((art) => art.id !== id));
      }
    } else {
      setArticles((prev) => prev.filter((art) => art.id !== id));
    }
  };

  const handleDeleteDraft = (id: string) => {
    setSimulatedDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const handlePublishDraft = (draft: { id: string; title: string; category: string; date: string }) => {
    const newArticle: BlogArticle = {
      id: `post-${Date.now()}`,
      title: draft.title,
      abstract: "Published from pre-saved user documentation draft.",
      content: "This document details the critical limits verified during internal container runtime examinations on port 3000.",
      category: draft.category,
      author: profile.name,
      authorRole: profile.role,
      authorAvatar: profile.avatarUrl,
      date: draft.date,
      coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop",
      likes: 1,
      comments: [],
      isUserPublished: true
    };

    setArticles((prev) => [newArticle, ...prev]);
    handleDeleteDraft(draft.id);
  };

  // Filter articles published by this author only (by userId match or name match)
  const userPublishedArticles = articles.filter((art) => {
    if (profile.id && art.authorId) {
      return art.authorId === profile.id;
    }
    return art.author === profile.name;
  });

  const themeAccentColors = {
    cyan: "bg-cyan-600 hover:bg-cyan-500",
    violet: "bg-violet-600 hover:bg-violet-500",
    amber: "bg-amber-600 hover:bg-amber-500",
    emerald: "bg-emerald-600 hover:bg-emerald-500"
  };

  const themeTextColors = {
    cyan: "text-cyan-400 border-cyan-400",
    violet: "text-violet-400 border-violet-400",
    amber: "text-amber-400 border-amber-400",
    emerald: "text-emerald-400 border-emerald-400"
  };

  const themeBtnText = {
    cyan: "text-cyan-400",
    violet: "text-violet-400",
    amber: "text-amber-400",
    emerald: "text-emerald-400"
  };

  // --- SIGN IN / REGISTER SCREEN ---
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 animate-fade-in" id="auth-view-card">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 text-left shadow-xl relative">

          <div className="text-center mb-8">
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block mb-1">
              {authMode === "login" ? t.profile.auth.title : t.profile.auth.title}
            </span>
            <h2 className="text-2xl font-bold font-heading text-white">
              {authMode === "login" ? t.profile.auth.title : t.profile.auth.title}
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-1.5 leading-relaxed">
              {authMode === "login" ? t.profile.auth.subtitle : t.profile.auth.subtitle}
            </p>
          </div>

          {/* Error Message */}
          {authError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-red-300">{authError}</p>
                {authError.includes("Incorrect username or password") && (
                  <button
                    onClick={() => {
                      setAuthMode("register");
                      setAuthError(null);
                    }}
                    className="text-xs text-indigo-400 hover:underline mt-1 cursor-pointer"
                  >
                    {t.profile.auth.noAccount}
                  </button>
                )}
              </div>
              <button onClick={() => setAuthError(null)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Success Message */}
          {authSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-start gap-2">
              <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              <p className="text-xs text-green-300 flex-1">{authSuccess}</p>
              <button onClick={() => setAuthSuccess(null)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const username = formData.get('username') as string;
            const password = formData.get('password') as string;
            const email = formData.get('email') as string;

            setAuthError(null);
            setAuthSuccess(null);
            setIsLoggingIn(true);

            try {
              if (authMode === "login") {
                if (onLogin) {
                  const result = await onLogin(username, password);
                  if (result.success) {
                    setPath("profile");
                  } else {
                    setAuthError(result.error || "Login failed");
                  }
                } else {
                  setIsLoggedIn(true);
                  setPath("profile");
                }
              } else {
                // Register mode
                if (onRegister) {
                  const result = await onRegister(username, email || `${username}@example.com`, password);
                  if (result.success) {
                    setAuthSuccess(t.profile.auth.registerSuccess);
                    setPath("profile");
                  } else {
                    setAuthError(result.error || "Registration failed");
                  }
                }
              }
            } catch (error: any) {
              setAuthError(error?.message || "An unexpected error occurred");
            } finally {
              setIsLoggingIn(false);
            }
          }} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">{t.profile.auth.username}</label>
              <input
                name="username"
                type="text"
                required
                className="w-full text-xs rounded-xl bg-slate-950 border border-slate-850 px-4 py-3 text-white focus:outline-none focus:border-slate-700"
                placeholder={t.profile.auth.username}
              />
            </div>

            {authMode === "register" && (
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">{t.profile.auth.email}</label>
                <input
                  name="email"
                  type="email"
                  className="w-full text-xs rounded-xl bg-slate-950 border border-slate-850 px-4 py-3 text-white focus:outline-none focus:border-slate-700"
                  placeholder={t.profile.auth.email}
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">{t.profile.auth.password}</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full text-xs rounded-xl bg-slate-950 border border-slate-850 px-4 py-3 pr-10 text-white focus:outline-none focus:border-slate-700 font-mono tracking-widest"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold text-white transition-all cursor-pointer ${themeAccentColors[settings.themeAccent]} ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {authMode === "login" ? t.profile.auth.authenticating : t.profile.auth.creating}
                </>
              ) : (
                authMode === "login" ? t.profile.auth.loginBtn : t.profile.auth.registerBtn
              )}
            </button>
          </form>

          {/* Toggle between login and register */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            {authMode === "login" ? (
              <button
                onClick={() => {
                  setAuthMode("register");
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                className="text-[11px] font-mono text-indigo-400 hover:underline cursor-pointer"
              >
                {t.profile.auth.noAccount}
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthMode("login");
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                className="text-[11px] font-mono text-indigo-400 hover:underline cursor-pointer"
              >
                {t.profile.auth.backToLogin}
              </button>
            )}
          </div>

        </div>
      </div>
    );
  }

  // --- LOGGED-IN VIEW ---
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 animate-fade-in" id="profile-panel-container">
      
      {/* Profile Card Summary Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-6 sm:p-8 mb-8 text-left relative">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="h-20 w-20 rounded-full object-cover border border-slate-800 bg-slate-950"
            referrerPolicy="no-referrer"
          />

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">{t.profile.auth.username}</label>
                    <input
                      type="text"
                      className="rounded bg-slate-950 border border-slate-800 text-sm text-white px-3 py-1.5 font-bold w-full"
                      value={newNickname}
                      onChange={(e) => setNewNickname(e.target.value)}
                      placeholder="输入昵称"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">{t.profile.auth.username}</label>
                    <input
                      type="text"
                      className="rounded bg-slate-950 border border-slate-800 text-sm text-white px-3 py-1.5 font-bold w-full"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    className="rounded bg-slate-950 border border-slate-800 text-xs text-white px-3 py-1.5 font-mono"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  />
                </div>
                <textarea
                  className="rounded bg-slate-950 border border-slate-800 text-xs text-slate-300 w-full px-3 py-1.5"
                  rows={2}
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white rounded px-3 py-1 text-xs font-semibold cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {t.profile.edit}
                  </button>
                  <button
                    onClick={() => {
                      setNewNickname(profile.nickname || "");
                      setNewName(profile.name);
                      setNewRole(profile.role);
                      setNewBio(profile.bio);
                      setIsEditing(false);
                    }}
                    className="text-slate-500 hover:text-slate-300 rounded px-3 py-1 text-xs"
                  >
                    {t.profile.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">{profile.name}</h2>
                  <span className="rounded bg-slate-950 border border-slate-850 px-2 py-0.5 text-[9px] font-mono text-slate-500 uppercase h-fit w-fit">
                    {t.profile.title}
                  </span>
                </div>
                <p className="text-xs font-mono text-indigo-400 mt-1">{profile.role}</p>
                <p className="text-sm font-sans font-light text-slate-300 leading-relaxed mt-3">{profile.bio}</p>

                {/* Sub-coordinates */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-5 pt-4 border-t border-slate-900/60 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5" />
                    <span>{profile.githubUrl || "github.com/portalcore"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{profile.email || "alex.chen@portalcore"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="absolute top-4 right-4 sm:static rounded bg-slate-800 hover:bg-slate-700 text-white p-2 text-xs transition-colors h-fit cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}

        </div>
      </div>

      {/* Tabs list (Published Posts vs. Drafts) */}
      <div className="border-b border-slate-800 mb-6 flex justify-between items-center" id="profile-tabs-row">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("published")}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
              activeTab === "published"
                ? `${themeTextColors[settings.themeAccent]}`
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            {t.profile.published.replace("{count}", String(userPublishedArticles.length))}
          </button>
          <button
            onClick={() => setActiveTab("drafts")}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
              activeTab === "drafts"
                ? `${themeTextColors[settings.themeAccent]}`
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <Bookmark className="w-4 h-4" />
            {t.profile.drafts.replace("{count}", String(simulatedDrafts.length))}
          </button>
        </div>

        {/* Disconnect Access Trigger */}
        <button
          onClick={() => {
            if (onLogout) {
              onLogout();
            } else {
              setIsLoggedIn(false);
              setPath("home");
            }
          }}
          className="flex items-center gap-1 text-slate-500 hover:text-red-400 text-xs font-mono mb-2 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          {t.profile.disconnect}
        </button>
      </div>

      {/* Grid content list based on tabs */}
      {activeTab === "published" ? (
        <div className="space-y-4" id="published-worksheet-stream">
          {userPublishedArticles.length === 0 ? (
            <div className="text-center rounded-xl border border-dashed border-slate-800 p-12 text-slate-600">
              <span className="text-xs font-mono block">{t.profile.noPublished}</span>
              <button
                onClick={() => setPath("blog-compose")}
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-indigo-400 font-mono hover:underline cursor-pointer"
              >
                {t.profile.publishNew}
              </button>
            </div>
          ) : (
            userPublishedArticles.map((art) => (
              <div
                key={art.id}
                className="rounded-xl border border-slate-800 bg-slate-900/10 p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-750 transition-colors"
              >
                <div
                  className="min-w-0 cursor-pointer text-left flex-1"
                  onClick={() => {
                    setSelectedArticleId(art.id);
                    setPath("blog-detail");
                  }}
                >
                  <span className="text-[10px] font-mono text-slate-500">{art.date}</span>
                  <h3 className="text-base font-semibold text-white tracking-tight group-hover:text-cyan-200 mt-0.5 line-clamp-2">
                    {art.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-sans mt-1 leading-normal font-light">
                    {art.abstract}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => {
                      setSelectedArticleId(art.id);
                      setPath("blog-detail");
                    }}
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-950 rounded-lg border border-slate-850 flex items-center gap-1 text-xs font-mono cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {t.profile.read}
                  </button>
                  <button
                    onClick={() => handleDeletePublished(art.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 bg-slate-950 rounded-lg border border-slate-850 cursor-pointer"
                    title="Delete post"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4" id="drafts-stream">
          {simulatedDrafts.length === 0 ? (
            <div className="text-center rounded-xl border border-dashed border-slate-800 p-12 text-slate-600">
              <span className="text-xs font-mono">{t.profile.noDrafts}</span>
            </div>
          ) : (
            simulatedDrafts.map((draft) => (
              <div
                key={draft.id}
                className="rounded-xl border border-slate-800 bg-slate-900/10 p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4"
              >
                <div className="min-w-0 text-left flex-1 animate-fade-in">
                  <span className="rounded bg-indigo-950/20 border border-indigo-900/30 px-1.5 py-0.5 text-[8px] font-mono text-indigo-400 uppercase">
                    {draft.category}
                  </span>
                  <h3 className="text-sm font-semibold text-white mt-2 mb-1">
                    {draft.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">{t.profile.created.replace("{date}", draft.date)}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => handlePublishDraft(draft)}
                    className={`px-3 py-1.5 rounded-lg text-white font-mono text-xs cursor-pointer ${themeAccentColors[settings.themeAccent]}`}
                  >
                    {t.profile.instantPublish}
                  </button>
                  <button
                    onClick={() => handleDeleteDraft(draft.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 bg-slate-950 rounded-lg border border-slate-850 cursor-pointer"
                    title="Remove draft"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
