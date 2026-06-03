/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BlogComment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  date: string;
}

export interface BlogArticle {
  id: string;
  title: string;
  abstract: string;
  content?: string;
  category: "Engineering" | "Design" | "Security" | "Systems" | string;
  author: string;
  authorRole: string;
  authorAvatar?: string;
  date: string;
  coverImage: string;
  likes: number;
  comments: BlogComment[];
  isDraft?: boolean;
  isUserPublished?: boolean;
}

export interface SystemNote {
  id: string;
  title: string;
  category: "System Architecture" | "Design Philosophy" | "Snippets" | "General" | string;
  content: string;
  date: string;
  tags: string[];
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "security" | "sync" | "interaction" | "system";
  isRead: boolean;
  linkToId?: string; // Links to blog post id etc.
}

export interface UserProfile {
  name: string;
  role: string;
  bio: string;
  avatarUrl: string;
  githubUrl?: string;
  email?: string;
}

export interface SystemSettings {
  allowNotifications: boolean;
  allowComments: boolean;
  themeAccent: "cyan" | "violet" | "amber" | "emerald";
  highDensityLayout: boolean;
}

export type ActivePath = "home" | "blog" | "blog-detail" | "blog-compose" | "dev-tools" | "notes" | "profile" | "notifications" | "settings";
