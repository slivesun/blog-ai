/**
 * 数据转换模块
 * 将后端 API 响应转换为前端所需格式
 */

import { BlogArticle, BlogComment, SystemNote, AppNotification, UserProfile, SystemSettings } from "./types";

// 文章数据转换
export function transformArticle(apiArticle: any): BlogArticle {
  return {
    id: String(apiArticle.id),
    title: apiArticle.title,
    abstract: apiArticle.abstract || "",
    content: apiArticle.content,
    category: apiArticle.category?.name || apiArticle.category || "General",
    author: apiArticle.author_nickname || apiArticle.author_name || apiArticle.author?.nickname || apiArticle.author?.username || apiArticle.author || "Anonymous",
    authorId: apiArticle.author_id || apiArticle.author?.id,
    authorRole: apiArticle.author_role || apiArticle.author?.role || "Contributor",
    authorAvatar: apiArticle.author_avatar || apiArticle.author?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop",
    date: formatDate(apiArticle.created_at || apiArticle.updated_at),
    coverImage: apiArticle.cover_image || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop",
    likes: apiArticle.likes || 0,
    comments: (apiArticle.comments || []).map(transformComment),
    isDraft: apiArticle.is_draft,
    isUserPublished: !apiArticle.is_draft
  };
}

// 评论数据转换
export function transformComment(apiComment: any): BlogComment {
  return {
    id: String(apiComment.id),
    author: apiComment.author_nickname || apiComment.author?.nickname || apiComment.author_name || apiComment.author?.username || "Anonymous",
    avatar: apiComment.author_avatar || apiComment.author?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop",
    text: apiComment.content,
    date: formatDate(apiComment.created_at)
  };
}

// 笔记数据转换
export function transformNote(apiNote: any): SystemNote {
  let tags: string[] = [];
  if (apiNote.tags) {
    if (typeof apiNote.tags === "string") {
      tags = apiNote.tags.split(",").map((t: string) => t.trim()).filter((t: string) => t.length > 0);
    } else if (Array.isArray(apiNote.tags)) {
      tags = apiNote.tags;
    }
  }

  return {
    id: String(apiNote.id),
    title: apiNote.title,
    category: apiNote.category || "General",
    content: apiNote.content,
    date: apiNote.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
    tags
  };
}

// 通知数据转换
export function transformNotification(apiNotif: any): AppNotification {
  return {
    id: String(apiNotif.id),
    title: apiNotif.title,
    description: apiNotif.description || apiNotif.message || apiNotif.content || "",
    time: formatTimeAgo(apiNotif.created_at),
    type: apiNotif.notification_type || apiNotif.type || "system",
    isRead: apiNotif.is_read || false,
    linkToId: apiNotif.link_to_id ? String(apiNotif.link_to_id) : undefined
  };
}

// 用户资料转换
export function transformProfile(apiProfile: any): UserProfile {
  return {
    id: apiProfile.id,
    username: apiProfile.username,
    nickname: apiProfile.nickname,
    name: apiProfile.nickname || apiProfile.full_name || apiProfile.username || "User",
    role: apiProfile.role || "Contributor",
    bio: apiProfile.bio || "",
    avatarUrl: apiProfile.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop",
    githubUrl: apiProfile.github_url,
    email: apiProfile.email
  };
}

// 设置转换
export function transformSettings(apiSettings: any): SystemSettings {
  return {
    allowNotifications: apiSettings.allow_notifications ?? true,
    allowComments: apiSettings.allow_comments ?? true,
    themeAccent: apiSettings.theme_accent || "cyan",
    highDensityLayout: apiSettings.high_density_layout || false,
    skin: apiSettings.skin || "dark"
  };
}

// 日期格式化
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// 时间格式化 (相对时间)
function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
