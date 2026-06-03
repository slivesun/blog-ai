/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { BlogArticle, AppNotification, SystemNote, UserProfile, SystemSettings, ActivePath } from "./types";
import {
  INITIAL_ARTICLES,
  INITIAL_NOTES,
  INITIAL_NOTIFICATIONS,
  INITIAL_PROFILE
} from "./utils";
import { articleApi, noteApi, notificationApi, profileApi, authApi } from "./api";
import { transformArticle, transformNote, transformNotification, transformProfile, transformSettings } from "./dataTransform";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomeView from "./pages/home";
import BlogView from "./pages/blog";
import DevToolsView from "./pages/dev-tools";
import NotesView from "./pages/notes";
import ProfileView from "./pages/profile";
import NotificationsView from "./pages/notifications";
import SettingsView from "./pages/settings";

export default function App() {
  // 1. Initial State Loaders (Hydrating from localStorage, fallback to utils preset assets)
  const [path, setPath] = useState<ActivePath>(() => {
    return "home";
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem("portalcore_is_logged_in");
    return saved ? JSON.parse(saved) : false;
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("portalcore_profile");
    return saved ? JSON.parse(saved) : INITIAL_PROFILE;
  });

  const [articles, setArticles] = useState<BlogArticle[]>(() => {
    const saved = localStorage.getItem("portalcore_articles");
    return saved ? JSON.parse(saved) : INITIAL_ARTICLES;
  });

  const [notes, setNotes] = useState<SystemNote[]>(() => {
    const saved = localStorage.getItem("portalcore_notes");
    return saved ? JSON.parse(saved) : INITIAL_NOTES;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem("portalcore_notifications");
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem("portalcore_settings");
    return saved
      ? JSON.parse(saved)
      : {
          allowNotifications: true,
          allowComments: true,
          themeAccent: "cyan",
          highDensityLayout: false,
        };
  });

  // Loading states for API data
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Error states
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({});

  // Journey Map simulated prototype state
  const [prototypeMode, setPrototypeMode] = useState<boolean>(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  // 2. Load data from API on mount
  useEffect(() => {
    const loadApiData = async () => {
      // Load articles
      setLoadingArticles(true);
      try {
        const response = await articleApi.getArticles({ page_size: 20 });
        if (response.success && response.data) {
          const transformedArticles = response.data.articles.map(transformArticle);
          setArticles(transformedArticles);
          localStorage.setItem("portalcore_articles", JSON.stringify(transformedArticles));
        }
      } catch (error) {
        console.error("Failed to load articles:", error);
        setApiErrors(prev => ({ ...prev, articles: "Failed to load articles" }));
      } finally {
        setLoadingArticles(false);
      }

      // Load notes if logged in
      const token = localStorage.getItem('blog_access_token');
      if (token) {
        setLoadingNotes(true);
        try {
          const response = await noteApi.getNotes({ page_size: 50 });
          if (response.success && response.data) {
            const transformedNotes = response.data.notes.map(transformNote);
            setNotes(transformedNotes);
            localStorage.setItem("portalcore_notes", JSON.stringify(transformedNotes));
          }
        } catch (error) {
          console.error("Failed to load notes:", error);
          setApiErrors(prev => ({ ...prev, notes: "Failed to load notes" }));
        } finally {
          setLoadingNotes(false);
        }

        // Load notifications
        setLoadingNotifications(true);
        try {
          const response = await notificationApi.getNotifications();
          if (response.success && response.data) {
            const transformedNotifications = response.data.notifications.map(transformNotification);
            setNotifications(transformedNotifications);
            localStorage.setItem("portalcore_notifications", JSON.stringify(transformedNotifications));
          }
        } catch (error) {
          console.error("Failed to load notifications:", error);
          setApiErrors(prev => ({ ...prev, notifications: "Failed to load notifications" }));
        } finally {
          setLoadingNotifications(false);
        }

        // Load profile
        setLoadingProfile(true);
        try {
          const response = await profileApi.getProfile();
          if (response.success && response.data) {
            const transformedProfile = transformProfile(response.data);
            setProfile(transformedProfile);
            localStorage.setItem("portalcore_profile", JSON.stringify(transformedProfile));
            setIsLoggedIn(true);
          }
        } catch (error) {
          console.error("Failed to load profile:", error);
          setApiErrors(prev => ({ ...prev, profile: "Failed to load profile" }));
        } finally {
          setLoadingProfile(false);
        }

        // Load settings
        try {
          const response = await profileApi.getSettings();
          if (response.success && response.data) {
            const transformedSettings = transformSettings(response.data);
            setSettings(transformedSettings);
            localStorage.setItem("portalcore_settings", JSON.stringify(transformedSettings));
          }
        } catch (error) {
          console.error("Failed to load settings:", error);
        }
      }
    };

    loadApiData();
  }, []);

  // 3. Synchronize changes to Local Storage on triggers
  useEffect(() => {
    localStorage.setItem("portalcore_is_logged_in", JSON.stringify(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    if (!loadingProfile) {
      localStorage.setItem("portalcore_profile", JSON.stringify(profile));
    }
  }, [profile, loadingProfile]);

  useEffect(() => {
    if (!loadingArticles) {
      localStorage.setItem("portalcore_articles", JSON.stringify(articles));
    }
  }, [articles, loadingArticles]);

  useEffect(() => {
    if (!loadingNotes) {
      localStorage.setItem("portalcore_notes", JSON.stringify(notes));
    }
  }, [notes, loadingNotes]);

  useEffect(() => {
    if (!loadingNotifications) {
      localStorage.setItem("portalcore_notifications", JSON.stringify(notifications));
    }
  }, [notifications, loadingNotifications]);

  useEffect(() => {
    localStorage.setItem("portalcore_settings", JSON.stringify(settings));
  }, [settings]);

  // Handle global reset back to standard templates
  const handleResetDefaults = () => {
    localStorage.clear();
    localStorage.removeItem('blog_access_token');
    setIsLoggedIn(false);
    setProfile(INITIAL_PROFILE);
    setArticles(INITIAL_ARTICLES);
    setNotes(INITIAL_NOTES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setSettings({
      allowNotifications: true,
      allowComments: true,
      themeAccent: "cyan",
      highDensityLayout: false,
    });
    setPrototypeMode(false);
    setSelectedArticleId(null);
  };

  // API Handlers for CRUD operations
  
  // Article handlers
  const handleCreateArticle = async (data: {
    title: string;
    abstract?: string;
    content?: string;
    cover_image?: string;
    category_id?: number;
    tag_ids?: number[];
    is_draft?: boolean;
  }) => {
    const response = await articleApi.createArticle(data);
    if (response.success && response.data) {
      const newArticle = transformArticle(response.data);
      setArticles(prev => [newArticle, ...prev]);
      return { success: true, article: newArticle };
    }
    return { success: false, error: response.message };
  };

  const handleUpdateArticle = async (id: number, data: Partial<{
    title: string;
    abstract: string;
    content: string;
    cover_image: string;
    category_id: number;
    tag_ids: number[];
    is_draft: boolean;
    is_published: boolean;
  }>) => {
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

  const handleUpdateNote = async (id: string, data: Partial<{ title: string; content: string; category: string; tags: string }>) => {
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
  const handleUpdateProfile = async (data: {
    full_name?: string;
    bio?: string;
    avatar_url?: string;
    github_url?: string;
  }) => {
    const response = await profileApi.updateProfile(data);
    if (response.success && response.data) {
      const updatedProfile = transformProfile(response.data);
      setProfile(updatedProfile);
      return { success: true, profile: updatedProfile };
    }
    return { success: false, error: response.message };
  };

  const handleChangePassword = async (oldPassword: string, newPassword: string) => {
    const response = await profileApi.changePassword(oldPassword, newPassword);
    return response;
  };

  const handleUpdateSettings = async (data: {
    allow_notifications?: boolean;
    allow_comments?: boolean;
    theme_accent?: string;
    high_density_layout?: boolean;
    language?: string;
  }) => {
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
      
      // Reload user's data
      const notesResponse = await noteApi.getNotes({ page_size: 50 });
      if (notesResponse.success && notesResponse.data) {
        setNotes(notesResponse.data.notes.map(transformNote));
      }
      
      const notifResponse = await notificationApi.getNotifications();
      if (notifResponse.success && notifResponse.data) {
        setNotifications(notifResponse.data.notifications.map(transformNotification));
      }
      
      const settingsResponse = await profileApi.getSettings();
      if (settingsResponse.success && settingsResponse.data) {
        setSettings(transformSettings(settingsResponse.data));
      }
      
      return { success: true };
    }
    return { success: false, error: response.message };
  };

  const handleLogout = async () => {
    await authApi.logout();
    setIsLoggedIn(false);
    localStorage.removeItem('blog_access_token');
  };

  const handleRegister = async (username: string, email: string, password: string) => {
    const response = await authApi.register(username, email, password);
    if (response.success && response.data) {
      setIsLoggedIn(true);
      const transformedProfile = transformProfile(response.data.user);
      setProfile(transformedProfile);
      return { success: true };
    }
    return { success: false, error: response.message };
  };

  // 3. Highlighted active theme references
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

      {/* Global Navigation Header component */}
      <Header
        currentPath={path}
        setPath={setPath}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        profile={profile}
        notifications={notifications}
        settings={settings}
        prototypeMode={prototypeMode}
        setPrototypeMode={setPrototypeMode}
      />

      {/* Main Container Stage */}
      <main className="flex-1">
        {path === "home" && (
          <HomeView
            setPath={setPath}
            settings={settings}
            prototypeMode={prototypeMode}
          />
        )}

        {(path === "blog" || path === "blog-detail" || path === "blog-compose") && (
          <BlogView
            articles={articles}
            setArticles={setArticles}
            currentPath={path}
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
        )}

        {path === "dev-tools" && (
          <DevToolsView
            settings={settings}
          />
        )}

        {path === "notes" && (
          <NotesView
            notes={notes}
            setNotes={setNotes}
            settings={settings}
            onCreateNote={handleCreateNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
          />
        )}

        {path === "profile" && (
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
        )}

        {path === "notifications" && (
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
        )}

        {path === "settings" && (
          <SettingsView
            settings={settings}
            setSettings={setSettings}
            onResetDefaults={handleResetDefaults}
            onUpdateSettings={handleUpdateSettings}
            setPath={setPath}
          />
        )}
      </main>

      {/* Global Aligned Footer */}
      <Footer />
    </div>
  );
}
