/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AppNotification, ActivePath, SystemSettings } from "../../types";
import { Bell, ShieldAlert, CheckCircle, MessageSquare, Trash2, ArrowRight, Loader2 } from "lucide-react";

interface NotificationsProps {
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  setPath: (path: ActivePath) => void;
  setSelectedArticleId: (id: string | null) => void;
  settings: SystemSettings;
  onMarkAsRead?: (id: string) => Promise<any>;
  onMarkAllAsRead?: () => Promise<any>;
  onDeleteNotification?: (id: string) => Promise<any>;
}

export default function NotificationsView({
  notifications,
  setNotifications,
  setPath,
  setSelectedArticleId,
  settings,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
}: NotificationsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleMarkAllRead = async () => {
    setIsLoading(true);
    try {
      if (onMarkAllAsRead) {
        await onMarkAllAsRead();
      } else {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNotif = async (id: string) => {
    if (onDeleteNotification) {
      const result = await onDeleteNotification(id);
      if (!result.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } else {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const handleActionClick = async (notif: AppNotification) => {
    if (onMarkAsRead && !notif.isRead) {
      await onMarkAsRead(notif.id);
    } else {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    }

    if (notif.linkToId) {
      setSelectedArticleId(notif.linkToId);
      setPath("blog-detail");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "security":
        return <ShieldAlert className="w-5 h-5 text-red-400" />;
      case "sync":
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case "interaction":
        return <MessageSquare className="w-5 h-5 text-cyan-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16 animate-fade-in" id="notifications-panel">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-white">
            System Alerts & Updates
          </h1>
          <p className="text-sm text-slate-400 font-sans mt-1 font-light">
            Keep track of cryptographic access, comment interactions, and cache synchronization events.
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleMarkAllRead}
              disabled={isLoading}
              className="text-xs font-mono text-slate-400 hover:text-white px-3 py-1 bg-slate-900 rounded-lg border border-slate-850 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Marking...
                </>
              ) : (
                'Mark read'
              )}
            </button>
            <button
              onClick={handleClearAll}
              className="text-xs font-mono text-slate-400 hover:text-red-400 px-3 py-1 bg-slate-900 rounded-lg border border-slate-850 cursor-pointer"
            >
              Clear system
            </button>
          </div>
        )}
      </div>

      {/* Stream list */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center rounded-2xl border border-dashed border-slate-800 py-16 text-slate-500">
            <Bell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <span className="text-xs font-mono">No active alerts recorded in log stack.</span>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`rounded-xl border p-4 sm:p-5 flex gap-4 transition-all hover:bg-slate-900/10 ${
                notif.isRead 
                  ? "bg-slate-900/5 border-slate-850 opacity-80" 
                  : "bg-slate-900/20 border-slate-750"
              }`}
            >
              <div className="shrink-0 pt-0.5">{getIcon(notif.type)}</div>
              
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between gap-1.5">
                  <h4 className={`text-sm font-semibold tracking-tight ${notif.isRead ? "text-slate-400" : "text-white"}`}>
                    {notif.title}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">{notif.time}</span>
                </div>
                
                <p className="text-xs text-slate-400 font-sans mt-1 font-light leading-relaxed">
                  {notif.description}
                </p>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-900/50">
                  {notif.linkToId ? (
                    <button
                      onClick={() => handleActionClick(notif)}
                      className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      Inspect linked worksheet
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-[9px] font-mono uppercase tracking-wider text-slate-600 selection:bg-transparent">
                      Category // {notif.type}
                    </span>
                  )}

                  <button
                    onClick={() => handleDeleteNotif(notif.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors p-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
