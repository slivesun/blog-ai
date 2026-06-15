/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserProfile, BlogArticle, ActivePath, SystemSettings } from "../../types";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
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
  onRegister?: (username: string, email: string, password: string, securityQuestion?: string, securityAnswer?: string) => Promise<any>;
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
  const { showMessage } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [newNickname, setNewNickname] = useState(profile.nickname || "");
  const [newBio, setNewBio] = useState(profile.bio);
  const [newGithubUrl, setNewGithubUrl] = useState(profile.githubUrl || "");
  const [newEmail, setNewEmail] = useState(profile.email || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<"published" | "drafts">("published");

  // 从导航状态读取 tab
  useEffect(() => {
    const state = location.state as { tab?: string } | null;
    if (state?.tab === "drafts") {
      setActiveTab("drafts");
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Auth states
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot">("login");
  const [resetStep, setResetStep] = useState<"question" | "newPassword">("question");
  const [resetUsername, setResetUsername] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<BlogArticle[]>([]);
  const [draftsLoaded, setDraftsLoaded] = useState(false);

  // 加载草稿
  useEffect(() => {
    if (!isLoggedIn || draftsLoaded) return;
    const loadDrafts = async () => {
      try {
        const { articleApi } = await import("../../api");
        const { transformArticle } = await import("../../dataTransform");
        const response = await articleApi.getArticles({ page_size: 50, include_drafts: true });
        if (response.success && response.data) {
          const allArticles = response.data.articles.map(transformArticle);
          setDrafts(allArticles.filter((a: BlogArticle) => a.isDraft));
        }
      } catch (e) {
        console.error("Failed to load drafts:", e);
      } finally {
        setDraftsLoaded(true);
      }
    };
    loadDrafts();
  }, [isLoggedIn, draftsLoaded]);

  const handleSaveProfile = async () => {
    // 前端校验
    if (newNickname.length > 20) {
      showMessage("昵称不能超过20个字符", "error");
      return;
    }
    if (/[<>{}[\]\\\/"'`;|&]/.test(newNickname)) {
      showMessage("昵称包含非法字符", "error");
      return;
    }
    if (newBio.length > 200) {
      showMessage("BIO 不能超过200个字符", "error");
      return;
    }
    if (newGithubUrl && newGithubUrl.length > 100) {
      showMessage("GitHub 地址不能超过100个字符", "error");
      return;
    }
    if (newGithubUrl && !/^https?:\/\/.+/.test(newGithubUrl) && newGithubUrl !== "") {
      showMessage("GitHub 地址格式不正确，需以 http:// 或 https:// 开头", "error");
      return;
    }

    setIsSaving(true);
    try {
      if (onUpdateProfile) {
        const updateData: Record<string, any> = {
          nickname: newNickname || undefined,
          bio: newBio,
          github_url: newGithubUrl || undefined,
        };
        const result = await onUpdateProfile(updateData);

        if (result.success) {
          setProfile({
            ...profile,
            nickname: newNickname || undefined,
            name: newNickname || profile.username || "User",
            bio: newBio,
            githubUrl: newGithubUrl || undefined,
          });
          setIsEditing(false);
          showMessage("保存成功", "success");
        } else {
          showMessage(result.error || "保存失败", "error");
        }
      } else {
        setProfile({
          ...profile,
          nickname: newNickname || undefined,
          name: newNickname || profile.username || "User",
          bio: newBio,
          githubUrl: newGithubUrl || undefined,
        });
        setIsEditing(false);
        showMessage("保存成功", "success");
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

  const handleDeleteDraft = async (id: string) => {
    try {
      const { articleApi } = await import("../../api");
      const result = await articleApi.deleteArticle(Number(id));
      if (result.success) {
        setDrafts((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete draft:", e);
    }
  };

  const handlePublishDraft = async (draft: BlogArticle) => {
    try {
      const { articleApi } = await import("../../api");
      const { transformArticle } = await import("../../dataTransform");
      const result = await articleApi.updateArticle(Number(draft.id), { is_draft: false });
      if (result.success && result.data) {
        setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
        const published = transformArticle(result.data);
        setArticles((prev) => [published, ...prev]);
      }
    } catch (e) {
      console.error("Failed to publish draft:", e);
    }
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
              {authMode === "forgot" ? t.profile.auth.forgotTitle : t.profile.auth.title}
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-1.5 leading-relaxed">
              {authMode === "forgot" ? t.profile.auth.forgotSubtitle : t.profile.auth.subtitle}
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

          {authMode === "forgot" ? (
            /* --- FORGOT PASSWORD FORM --- */
            <div>
              {resetStep === "question" ? (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const username = formData.get('forgot_username') as string;
                  const answer = formData.get('security_answer') as string;

                  if (!securityQuestion) {
                    setAuthError(t.profile.auth.questionRequired);
                    return;
                  }
                  if (!answer) {
                    setAuthError(t.profile.auth.answerRequired);
                    return;
                  }

                  setAuthError(null);
                  setResetUsername(username);
                  setSecurityAnswer(answer);
                  setResetStep("newPassword");
                }} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">{t.profile.auth.username}</label>
                    <input
                      name="forgot_username"
                      type="text"
                      required
                      className="w-full text-xs rounded-xl bg-slate-950 border border-slate-850 px-4 py-3 text-white focus:outline-none focus:border-slate-700"
                      placeholder={t.profile.auth.username}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">{t.profile.auth.securityQuestion}</label>
                    <select
                      value={securityQuestion}
                      onChange={(e) => setSecurityQuestion(e.target.value)}
                      className="w-full text-xs rounded-xl bg-slate-950 border border-slate-850 px-4 py-3 text-white focus:outline-none focus:border-slate-700 appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-slate-950">-- {t.profile.auth.securityQuestion} --</option>
                      <option value="pet" className="bg-slate-950">{t.profile.auth.questions.pet}</option>
                      <option value="city" className="bg-slate-950">{t.profile.auth.questions.city}</option>
                      <option value="book" className="bg-slate-950">{t.profile.auth.questions.book}</option>
                      <option value="mother" className="bg-slate-950">{t.profile.auth.questions.mother}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">{t.profile.auth.securityAnswer}</label>
                    <input
                      name="security_answer"
                      type="text"
                      required
                      className="w-full text-xs rounded-xl bg-slate-950 border border-slate-850 px-4 py-3 text-white focus:outline-none focus:border-slate-700"
                      placeholder={t.profile.auth.securityAnswer}
                    />
                  </div>

                  <button
                    style={{ marginTop: "16px" }}
                    type="submit"
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold text-white transition-all cursor-pointer ${themeAccentColors[settings.themeAccent]}`}
                  >
                    {t.profile.auth.resetBtn}
                  </button>
                </form>
              ) : (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setAuthError(null);

                  if (!newPassword) {
                    setAuthError(t.profile.auth.newPassword);
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    setAuthError(t.profile.auth.passwordMismatch);
                    return;
                  }

                  setIsLoggingIn(true);
                  try {
                    const { authApi } = await import("../../api");
                    const result = await authApi.forgotPassword(resetUsername, securityQuestion, securityAnswer, newPassword);
                    if (result.success) {
                      setAuthSuccess(t.profile.auth.resetSuccess);
                      setAuthMode("login");
                      setResetStep("question");
                      setResetUsername("");
                      setSecurityQuestion("");
                      setSecurityAnswer("");
                      setNewPassword("");
                      setConfirmPassword("");
                    } else {
                      setAuthError(result.message || "Reset failed");
                    }
                  } catch (error: any) {
                    setAuthError(error?.message || "An unexpected error occurred");
                  } finally {
                    setIsLoggingIn(false);
                  }
                }} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">{t.profile.auth.newPassword}</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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

                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">{t.profile.auth.confirmPassword}</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full text-xs rounded-xl bg-slate-950 border border-slate-850 px-4 py-3 text-white focus:outline-none focus:border-slate-700 font-mono tracking-widest"
                      placeholder="••••••••••••"
                    />
                  </div>

                  <button
                    style={{ marginTop: "16px" }}
                    type="submit"
                    disabled={isLoggingIn}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold text-white transition-all cursor-pointer ${themeAccentColors[settings.themeAccent]} ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t.profile.auth.verifying}
                      </>
                    ) : (
                      t.profile.auth.resetBtn
                    )}
                  </button>
                </form>
              )}

              <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setResetStep("question");
                    setResetUsername("");
                    setSecurityQuestion("");
                    setSecurityAnswer("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className="text-[11px] font-mono text-indigo-400 hover:underline cursor-pointer"
                >
                  {t.profile.auth.backToLogin}
                </button>
              </div>
            </div>
          ) : (
            /* --- LOGIN / REGISTER FORM --- */
            <>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const username = formData.get('username') as string;
                const password = formData.get('password') as string;
                const email = formData.get('email') as string;
                const sq = formData.get('security_question') as string;
                const sa = formData.get('security_answer') as string;

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
                      const result = await onRegister(username, email || `${username}@example.com`, password, sq || undefined, sa || undefined);
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
              }} className="space-y-6">
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

                {authMode === "register" && (
                  <>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">{t.profile.auth.securityQuestion}</label>
                      <select
                        name="security_question"
                        required
                        className="w-full text-xs rounded-xl bg-slate-950 border border-slate-850 px-4 py-3 text-white focus:outline-none focus:border-slate-700 appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-slate-950">-- {t.profile.auth.securityQuestion} --</option>
                        <option value="pet" className="bg-slate-950">{t.profile.auth.questions.pet}</option>
                        <option value="city" className="bg-slate-950">{t.profile.auth.questions.city}</option>
                        <option value="book" className="bg-slate-950">{t.profile.auth.questions.book}</option>
                        <option value="mother" className="bg-slate-950">{t.profile.auth.questions.mother}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">{t.profile.auth.securityAnswer}</label>
                      <input
                        name="security_answer"
                        type="text"
                        required
                        className="w-full text-xs rounded-xl bg-slate-950 border border-slate-850 px-4 py-3 text-white focus:outline-none focus:border-slate-700"
                        placeholder={t.profile.auth.securityAnswer}
                      />
                    </div>
                  </>
                )}

                <button
                  style={{ marginTop: "16px" }}
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

                {authMode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("forgot");
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className="text-xs text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer text-center w-full mt-2"
                  >
                    {t.profile.auth.forgotPassword}
                  </button>
                )}
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
            </>
          )}

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

          <div className="relative group cursor-pointer" onClick={() => !isUploadingAvatar && document.getElementById('avatar-upload-input')?.click()}>
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="h-20 w-20 rounded-full object-cover border border-slate-800 bg-slate-950"
              referrerPolicy="no-referrer"
            />
            {isUploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            <div className={`absolute inset-0 rounded-full bg-black/50 flex items-center justify-center transition-opacity ${isUploadingAvatar ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            <input
              id="avatar-upload-input"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsUploadingAvatar(true);
                try {
                  const { uploadApi, profileApi } = await import("../../api");
                  const uploadResult = await uploadApi.uploadImage(file);
                  if (uploadResult.success && uploadResult.data) {
                    const updateResult = await profileApi.updateProfile({ avatar_url: uploadResult.data.url });
                    if (updateResult.success) {
                      setProfile({ ...profile, avatarUrl: uploadResult.data.url });
                    }
                  } else {
                    showMessage(uploadResult.message?.includes("too large") ? t.profile.uploadTooLarge : t.profile.uploadFailed, "error");
                  }
                } catch (err) {
                  console.error("Avatar upload failed:", err);
                  showMessage(t.profile.uploadFailed, "error");
                } finally {
                  setIsUploadingAvatar(false);
                }
                e.target.value = '';
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase">{t.profile.nickname}</label>
                    <span className={`text-[10px] font-mono ${newNickname.length > 20 ? 'text-red-400' : 'text-slate-600'}`}>{newNickname.length}/20</span>
                  </div>
                  <input
                    type="text"
                    className="rounded bg-slate-950 border border-slate-800 text-sm text-white px-3 py-1.5 font-bold w-full"
                    value={newNickname}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[<>{}[\]\\\/"'`;|&]/g, '');
                      if (v.length <= 20) setNewNickname(v);
                    }}
                    placeholder={t.profile.nickname}
                    maxLength={20}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase">BIO</label>
                    <span className={`text-[10px] font-mono ${newBio.length > 200 ? 'text-red-400' : 'text-slate-600'}`}>{newBio.length}/200</span>
                  </div>
                  <textarea
                    className="rounded bg-slate-950 border border-slate-800 text-xs text-slate-300 w-full px-3 py-1.5"
                    rows={2}
                    value={newBio}
                    onChange={(e) => {
                      if (e.target.value.length <= 200) setNewBio(e.target.value);
                    }}
                    maxLength={200}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">GITHUB</label>
                    <input
                      type="text"
                      className="rounded bg-slate-950 border border-slate-800 text-xs text-white px-3 py-1.5 font-mono w-full"
                      value={newGithubUrl}
                      onChange={(e) => {
                        if (e.target.value.length <= 100) setNewGithubUrl(e.target.value);
                      }}
                      placeholder="https://github.com/username"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">EMAIL</label>
                    <input
                      type="email"
                      className="rounded bg-slate-950 border border-slate-800 text-xs text-white px-3 py-1.5 font-mono w-full"
                      value={newEmail}
                      placeholder="user@example.com"
                      disabled
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
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
                      setNewBio(profile.bio);
                      setNewGithubUrl(profile.githubUrl || "");
                      setNewEmail(profile.email || "");
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
            className={`flex items-center gap-2 pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${activeTab === "published"
              ? `${themeTextColors[settings.themeAccent]}`
              : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
          >
            <BookOpen className="w-4 h-4" />
            {t.profile.published.replace("{count}", String(userPublishedArticles.length))}
          </button>
          <button
            onClick={() => setActiveTab("drafts")}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${activeTab === "drafts"
              ? `${themeTextColors[settings.themeAccent]}`
              : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
          >
            <Bookmark className="w-4 h-4" />
            {t.profile.drafts.replace("{count}", String(drafts.length))}
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
          {t.profile.logout}
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
                className="mt-2 rounded-xl border border-slate-800 bg-slate-900/10 p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-750 transition-colors"
              >
                <div
                  className="min-w-0 cursor-pointer text-left flex-1"
                  onClick={() => {
                    setSelectedArticleId(art.id);
                    sessionStorage.setItem('detail_return_to', '/profile');
                    navigate(`/blog/${art.id}`);
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
                      sessionStorage.setItem('detail_return_to', '/profile');
                      navigate(`/blog/${art.id}`);
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
          {!draftsLoaded ? (
            <div className="text-center p-12">
              <Loader2 className="w-5 h-5 text-slate-500 animate-spin mx-auto" />
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center rounded-xl border border-dashed border-slate-800 p-12 text-slate-600">
              <span className="text-xs font-mono">{t.profile.noDrafts}</span>
            </div>
          ) : (
            drafts.map((draft) => (
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
