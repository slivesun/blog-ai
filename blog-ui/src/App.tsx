/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense, useCallback } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { BlogArticle, AppNotification, SystemNote, UserProfile, SystemSettings, ActivePath } from "./types";
import {
  INITIAL_ARTICLES,
  INITIAL_NOTIFICATIONS,
  INITIAL_PROFILE
} from "./utils";
import { articleApi, noteApi, notificationApi, profileApi, authApi, commentApi } from "./api";
import { transformArticle, transformNote, transformNotification, transformProfile, transformSettings, transformComment } from "./dataTransform";
import Header from "./components/Header";
import Footer from "./components/Footer";

// Lazy load pages for code splitting
const HomeView = lazy(() => import("./pages/home"));
const BlogView = lazy(() => import("./pages/blog"));
const DevToolsView = lazy(() => import("./pages/dev-tools"));
const NotesView = lazy(() => import("./pages/notes"));
const ProfileView = lazy(() => import("./pages/profile"));
const NotificationsView = lazy(() => import("./pages/notifications"));
const SettingsView = lazy(() => import("./pages/settings"));

// Loading fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-slate-600 border-t-cyan-400 rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-500">Loading...</span>
      </div>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Derive current path from URL
  const getCurrentPath = (): ActivePath => {
    const p = location.pathname;
    if (p === "/") return "home";
    if (p.startsWith("/blog")) return p.includes("/compose") ? "blog-compose" : p !== "/blog" ? "blog-detail" : "blog";
    if (p === "/dev-tools") return "dev-tools";
    if (p === "/notes") return "notes";
    if (p === "/profile") return "profile";
    if (p === "/notifications") return "notifications";
    if (p === "/settings") return "settings";
    return "home";
  };

  const currentPath = getCurrentPath();

  const setPath = useCallback((path: ActivePath) => {
    const routeMap: Record<ActivePath, string> = {
      "home": "/",
      "blog": "/blog",
      "blog-detail": "/blog",
      "blog-compose": "/blog/compose",
      "dev-tools": "/dev-tools",
      "notes": "/notes",
      "profile": "/profile",
      "notifications": "/notifications",
      "settings": "/settings",
    };
    navigate(routeMap[path] || "/");
  }, [navigate]);

  // State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return !!localStorage.getItem('blog_access_token');
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("portalcore_profile");
    return saved ? JSON.parse(saved) : INITIAL_PROFILE;
  });

  const [articles, setArticles] = useState<BlogArticle[]>(INITIAL_ARTICLES);
  const [notes, setNotes] = useState<SystemNote[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem("portalcore_settings");
    return saved ? JSON.parse(saved) : {
      allowNotifications: true,
      allowComments: true,
      themeAccent: "cyan",
      highDensityLayout: false,
    };
  });

  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [prototypeMode, setPrototypeMode] = useState<boolean>(false);

  // Page-specific loading flags
  const [articlesLoaded, setArticlesLoaded] = useState(false);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load articles on blog pages only
  useEffect(() => {
    if ((currentPath === "blog" || currentPath === "blog-detail" || currentPath === "blog-compose") && !articlesLoaded) {
      const loadArticles = async () => {
        try {
          const response = await articleApi.getArticles({ page_size: 50 });
          if (response.success && response.data) {
            const transformed = response.data.articles.map(transformArticle);
            setArticles(transformed);
          }
        } catch (e) {
          console.error("Failed to load articles:", e);
        } finally {
          setArticlesLoaded(true);
        }
      };
      loadArticles();
    }
  }, [currentPath, articlesLoaded]);

  // Load authenticated user data only when visiting those pages
  useEffect(() => {
    const token = localStorage.getItem('blog_access_token');
    if (!token) return;

    // Load profile on first auth-page visit
    if ((currentPath === "profile" || currentPath === "settings" || currentPath === "notifications") && !profileLoaded) {
      const loadProfile = async () => {
        try {
          const response = await profileApi.getProfile();
          if (response.success && response.data) {
            const transformed = transformProfile(response.data);
            setProfile(transformed);
            localStorage.setItem("portalcore_profile", JSON.stringify(transformed));
            setIsLoggedIn(true);
          }
        } catch (e) {
          console.error("Failed to load profile:", e);
        } finally {
          setProfileLoaded(true);
        }
      };
      loadProfile();
    }

    // Load notes only on notes page
    if (currentPath === "notes" && !notesLoaded) {
      const loadNotes = async () => {
        try {
          const response = await noteApi.getNotes({ page_size: 50 });
          if (response.success && response.data) {
            const transformed = response.data.notes.map(transformNote);
            setNotes(transformed);
          }
        } catch (e) {
          console.error("Failed to load notes:", e);
        } finally {
          setNotesLoaded(true);
        }
      };
      loadNotes();
    }

    // Load notifications whenever logged in (needed for header badge)
    if (!notificationsLoaded) {
      const loadNotifications = async () => {
        try {
          const response = await notificationApi.getNotifications();
          if (response.success && response.data) {
            const transformed = response.data.notifications.map(transformNotification);
            setNotifications(transformed);
          }
        } catch (e) {
          console.error("Failed to load notifications:", e);
        } finally {
          setNotificationsLoaded(true);
        }
      };
      loadNotifications();
    }

    // Load settings only on settings page
    if (currentPath === "settings") {
      const loadSettings = async () => {
        try {
          const response = await profileApi.getSettings();
          if (response.success && response.data) {
            const transformed = transformSettings(response.data);
            setSettings(transformed);
            localStorage.setItem("portalcore_settings", JSON.stringify(transformed));
          }
        } catch (e) {
          console.error("Failed to load settings:", e);
        }
      };
      loadSettings();
    }
  }, [currentPath, profileLoaded, notesLoaded, notificationsLoaded]);

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem("portalcore_settings", JSON.stringify(settings));
  }, [settings]);

  // Reset defaults
  const handleResetDefaults = () => {
    localStorage.clear();
    localStorage.removeItem('blog_access_token');
    setIsLoggedIn(false);
    setProfile(INITIAL_PROFILE);
    setArticles(INITIAL_ARTICLES);
    setNotes([]);
    setNotifications(INITIAL_NOTIFICATIONS);
    setSettings({
      allowNotifications: true,
      allowComments: true,
      themeAccent: "cyan",
      highDensityLayout: false,
    });
    setPrototypeMode(false);
    setSelectedArticleId(null);
    setArticlesLoaded(false);
    setNotesLoaded(false);
    setNotificationsLoaded(false);
    setProfileLoaded(false);
  };

  // Article handlers
  const handleCreateArticle = async (data: any) => {
    const response = await articleApi.createArticle(data);
    if (response.success && response.data) {
      const newArticle = transformArticle(response.data);
      setArticles(prev => [newArticle, ...prev]);
      return { success: true, article: newArticle };
    }
    return { success: false, error: response.message };
  };

  const handleUpdateArticle = async (id: number, data: any) => {
    const response = await articleApi.updateArticle(id, data);
    if (response.success && response.data) {
      const updatedArticle = transformArticle(response.data);
      setArticles(prev => prev.map(a => a.id === String(id) ? updatedArticle : a));
      return { success: true, article: updatedArticle };
    }
    return { success: false, error: response.message };
  };

  const handleDeleteArticle = async (id: string) => {
    const response = await articleApi.deleteArticle(Number(id));
    if (response.success) {
      setArticles(prev => prev.filter(a => a.id !== id));
      return { success: true };
    }
    return { success: false, error: response.message };
  };

  const handleLikeArticle = async (id: string) => {
    const response = await articleApi.likeArticle(Number(id));
    if (response.success && response.data) {
      setArticles(prev => prev.map(a =>
        a.id === id ? { ...a, likes: response.data?.likes || a.likes + 1 } : a
      ));
      return { success: true };
    }
    return { success: false, error: response.message };
  };

  // Comment handlers
  const handleCreateComment = async (articleId: string, content: string, parentId?: number) => {
    const response = await commentApi.createComment(Number(articleId), content, parentId);
    if (response.success && response.data) {
      const newComment = transformComment(response.data);
      setArticles(prev => prev.map(a =>
        a.id === articleId ? { ...a, comments: [...a.comments, newComment] } : a
      ));
      return { success: true, comment: newComment };
    }
    return { success: false, error: response.message };
  };

  const handleDeleteComment = async (commentId: string, articleId: string) => {
    const response = await commentApi.deleteComment(Number(commentId));
    if (response.success) {
      setArticles(prev => prev.map(a =>
        a.id === articleId ? { ...a, comments: a.comments.filter(c => c.id !== commentId) } : a
      ));
      return { success: true };
    }
    return { success: false, error: response.message };
  };

  // Note handlers
  const handleCreateNote = async (data: { title: string; content: string; category?: string; tags?: string }) => {
    const response = await noteApi.createNote(data);
    if (response.success && response.data) {
      const newNote = transformNote(response.data);
      setNotes(prev => [newNote, ...prev]);
      return { success: true, note: newNote };
    }
    return { success: false, error: response.message };
  };

  const handleUpdateNote = async (id: string, data: any) => {
    const response = await noteApi.updateNote(Number(id), data);
    if (response.success && response.data) {
      const updatedNote = transformNote(response.data);
      setNotes(prev => prev.map(n => n.id === id ? updatedNote : n));
      return { success: true, note: updatedNote };
    }
    return { success: false, error: response.message };
  };

  const handleDeleteNote = async (id: string) => {
    const response = await noteApi.deleteNote(Number(id));
    if (response.success) {
      setNotes(prev => prev.filter(n => n.id !== id));
      return { success: true };
    }
    return { success: false, error: response.message };
  };

  // Notification handlers
  const handleMarkNotificationRead = async (id: string) => {
    const response = await notificationApi.markAsRead(Number(id));
    if (response.success) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      return { success: true };
    }
    return { success: false, error: response.message };
  };

  const handleMarkAllNotificationsRead = async () => {
    const response = await notificationApi.markAllAsRead();
    if (response.success) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      return { success: true };
    }
    return { success: false, error: response.message };
  };

  const handleDeleteNotification = async (id: string) => {
    const response = await notificationApi.deleteNotification(Number(id));
    if (response.success) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      return { success: true };
    }
    return { success: false, error: response.message };
  };

  // Profile handlers
  const handleUpdateProfile = async (data: any) => {
    const response = await profileApi.updateProfile(data);
    if (response.success && response.data) {
      const updatedProfile = transformProfile(response.data);
      setProfile(updatedProfile);
      return { success: true, profile: updatedProfile };
    }
    return { success: false, error: response.message };
  };

  const handleChangePassword = async (oldPassword: string, newPassword: string) => {
    return await profileApi.changePassword(oldPassword, newPassword);
  };

  const handleUpdateSettings = async (data: any) => {
    const response = await profileApi.updateSettings(data);
    if (response.success && response.data) {
      const updatedSettings = transformSettings(response.data);
      setSettings(updatedSettings);
      return { success: true, settings: updatedSettings };
    }
    return { success: false, error: response.message };
  };

  // Auth handlers
  const handleLogin = async (username: string, password: string) => {
    const response = await authApi.login(username, password);
    if (response.success && response.data) {
      setIsLoggedIn(true);
      const transformedProfile = transformProfile(response.data.user);
      setProfile(transformedProfile);
      localStorage.setItem("portalcore_profile", JSON.stringify(transformedProfile));
      // Reset loaded flags so data reloads on next visit
      setNotesLoaded(false);
      setNotificationsLoaded(false);
      setProfileLoaded(true);
      // 登录成功后跳回原页面
      const redirect = localStorage.getItem('login_redirect');
      if (redirect) {
        localStorage.removeItem('login_redirect');
        navigate(redirect);
      }
      return { success: true };
    }
    return { success: false, error: response.message };
  };

  const handleLogout = async () => {
    await authApi.logout();
    setIsLoggedIn(false);
    setProfile(INITIAL_PROFILE);
    setNotes([]);
    setNotifications(INITIAL_NOTIFICATIONS);
    setNotesLoaded(false);
    setNotificationsLoaded(false);
    setProfileLoaded(false);
    navigate("/");
  };

  const handleRegister = async (username: string, email: string, password: string) => {
    const response = await authApi.register(username, email, password);
    if (response.success && response.data) {
      setIsLoggedIn(true);
      const transformedProfile = transformProfile(response.data.user);
      setProfile(transformedProfile);
      localStorage.setItem("portalcore_profile", JSON.stringify(transformedProfile));
      setProfileLoaded(true);
      // 注册成功后跳回原页面
      const redirect = localStorage.getItem('login_redirect');
      if (redirect) {
        localStorage.removeItem('login_redirect');
        navigate(redirect);
      }
      return { success: true };
    }
    return { success: false, error: response.message };
  };

  const bgThemeClasses = {
    cyan: "selection:bg-cyan-500/30 selection:text-cyan-200",
    violet: "selection:bg-violet-500/30 selection:text-violet-200",
    amber: "selection:bg-amber-500/30 selection:text-amber-200",
    emerald: "selection:bg-emerald-500/30 selection:text-emerald-200"
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans ${bgThemeClasses[settings.themeAccent]} ${settings.highDensityLayout ? "px-0 py-0" : ""}`}>

      {/* Dynamic Progress indicator */}
      <div className={`h-[1.5px] w-full bg-slate-900 overflow-hidden relative`}>
        <div className={`absolute top-0 bottom-0 left-0 w-2/3 ${settings.themeAccent === "cyan" ? "bg-cyan-500" : settings.themeAccent === "violet" ? "bg-violet-500" : settings.themeAccent === "amber" ? "bg-amber-500" : "bg-emerald-500"} animate-pulse`} />
      </div>

      {/* Header */}
      <Header
        currentPath={currentPath}
        setPath={setPath}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        profile={profile}
        notifications={notifications}
        settings={settings}
        prototypeMode={prototypeMode}
        setPrototypeMode={setPrototypeMode}
      />

      {/* Main Content with Suspense for lazy loading */}
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={
              <HomeView
                setPath={setPath}
                settings={settings}
                prototypeMode={prototypeMode}
              />
            } />

            <Route path="/blog" element={
              <BlogView
                articles={articles}
                setArticles={setArticles}
                currentPath="blog"
                setPath={setPath}
                selectedArticleId={selectedArticleId}
                setSelectedArticleId={setSelectedArticleId}
                isLoggedIn={isLoggedIn}
                settings={settings}
                profile={profile}
                onCreateArticle={handleCreateArticle}
                onUpdateArticle={handleUpdateArticle}
                onDeleteArticle={handleDeleteArticle}
                onLikeArticle={handleLikeArticle}
                onCreateComment={handleCreateComment}
              />
            } />

            <Route path="/blog/:id" element={
              <BlogView
                articles={articles}
                setArticles={setArticles}
                currentPath="blog-detail"
                setPath={setPath}
                selectedArticleId={selectedArticleId}
                setSelectedArticleId={setSelectedArticleId}
                isLoggedIn={isLoggedIn}
                settings={settings}
                profile={profile}
                onCreateArticle={handleCreateArticle}
                onUpdateArticle={handleUpdateArticle}
                onDeleteArticle={handleDeleteArticle}
                onLikeArticle={handleLikeArticle}
                onCreateComment={handleCreateComment}
              />
            } />

            <Route path="/blog/compose" element={
              <BlogView
                articles={articles}
                setArticles={setArticles}
                currentPath="blog-compose"
                setPath={setPath}
                selectedArticleId={selectedArticleId}
                setSelectedArticleId={setSelectedArticleId}
                isLoggedIn={isLoggedIn}
                settings={settings}
                profile={profile}
                onCreateArticle={handleCreateArticle}
                onUpdateArticle={handleUpdateArticle}
                onDeleteArticle={handleDeleteArticle}
                onLikeArticle={handleLikeArticle}
                onCreateComment={handleCreateComment}
              />
            } />

            <Route path="/dev-tools" element={
              <DevToolsView settings={settings} />
            } />

            <Route path="/notes" element={
              <NotesView
                notes={notes}
                setNotes={setNotes}
                settings={settings}
                onCreateNote={handleCreateNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
              />
            } />

            <Route path="/profile" element={
              <ProfileView
                profile={profile}
                setProfile={setProfile}
                articles={articles}
                setArticles={setArticles}
                isLoggedIn={isLoggedIn}
                setIsLoggedIn={setIsLoggedIn}
                setPath={setPath}
                setSelectedArticleId={setSelectedArticleId}
                settings={settings}
                onUpdateProfile={handleUpdateProfile}
                onDeleteArticle={handleDeleteArticle}
                onLogin={handleLogin}
                onLogout={handleLogout}
                onRegister={handleRegister}
              />
            } />

            <Route path="/notifications" element={
              <NotificationsView
                notifications={notifications}
                setNotifications={setNotifications}
                setPath={setPath}
                setSelectedArticleId={setSelectedArticleId}
                settings={settings}
                onMarkAsRead={handleMarkNotificationRead}
                onMarkAllAsRead={handleMarkAllNotificationsRead}
                onDeleteNotification={handleDeleteNotification}
              />
            } />

            <Route path="/settings" element={
              <SettingsView
                settings={settings}
                setSettings={setSettings}
                onResetDefaults={handleResetDefaults}
                onUpdateSettings={handleUpdateSettings}
                setPath={setPath}
              />
            } />

            {/* Catch-all redirect */}
            <Route path="*" element={
              <HomeView
                setPath={setPath}
                settings={settings}
                prototypeMode={prototypeMode}
              />
            } />
          </Routes>
        </Suspense>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
