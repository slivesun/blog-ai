/**
 * API 服务模块
 * 封装所有与后端 API 的交互逻辑
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface AuthResponse {
  user: {
    id: number;
    username: string;
    email: string;
    full_name?: string;
    bio?: string;
    avatar_url?: string;
    github_url?: string;
    role: string;
    is_active: boolean;
    is_admin: boolean;
  };
  token: TokenResponse;
}

// 请求封装
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('blog_access_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (response.status === 401) {
      localStorage.removeItem('blog_access_token');
      if (window.location.pathname !== '/profile') {
        localStorage.setItem('login_redirect', window.location.pathname);
        window.location.href = '/profile';
      }
      return { success: false, message: 'Unauthorized' };
    }

    if (!response.ok) {
      return {
        success: false,
        message: data.detail || 'Request failed',
      };
    }

    return {
      success: true,
      data: data.data ?? data,
      message: data.message,
    };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// 认证 API
export const authApi = {
  async login(username: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const response = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (response.success && response.data?.token.access_token) {
      localStorage.setItem('blog_access_token', response.data.token.access_token);
    }

    return response;
  },

  async register(
    username: string,
    email: string,
    password: string,
    securityQuestion?: string,
    securityAnswer?: string
  ): Promise<ApiResponse<AuthResponse>> {
    const body: Record<string, string> = { username, email, password };
    if (securityQuestion) body.security_question = securityQuestion;
    if (securityAnswer) body.security_answer = securityAnswer;
    const response = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (response.success && response.data?.token.access_token) {
      localStorage.setItem('blog_access_token', response.data.token.access_token);
    }

    return response;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('blog_access_token');
  },

  async forgotPassword(username: string, securityQuestion: string, securityAnswer: string, newPassword: string) {
    return request<any>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ username, security_question: securityQuestion, security_answer: securityAnswer, new_password: newPassword }),
    });
  },

  async getCurrentUser() {
    return request<AuthResponse['user']>('/auth/me');
  },
};

// 文章 API
export const articleApi = {
  async getArticles(params?: {
    page?: number;
    page_size?: number;
    category_id?: number;
    tag_id?: number;
    search?: string;
    include_drafts?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.page_size) searchParams.set('page_size', String(params.page_size));
    if (params?.category_id) searchParams.set('category_id', String(params.category_id));
    if (params?.tag_id) searchParams.set('tag_id', String(params.tag_id));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.include_drafts) searchParams.set('include_drafts', 'true');

    const query = searchParams.toString();
    return request<{
      articles: any[];
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
    }>(`/articles${query ? `?${query}` : ''}`);
  },

  async getArticle(id: number) {
    return request<any>(`/articles/${id}`);
  },

  async createArticle(data: {
    title: string;
    abstract?: string;
    content?: string;
    cover_image?: string;
    category_id?: number;
    tag_ids?: number[];
    is_draft?: boolean;
  }) {
    return request<any>('/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateArticle(
    id: number,
    data: Partial<{
      title: string;
      abstract: string;
      content: string;
      cover_image: string;
      category_id: number;
      tag_ids: number[];
      is_draft: boolean;
      is_published: boolean;
    }>
  ) {
    return request<any>(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteArticle(id: number) {
    return request<any>(`/articles/${id}`, {
      method: 'DELETE',
    });
  },

  async likeArticle(id: number) {
    return request<{ article_id: number; likes: number }>(`/articles/${id}/like`, {
      method: 'POST',
    });
  },
};

// 评论 API
export const commentApi = {
  async getComments(articleId: number) {
    return request<any[]>(`/comments/article/${articleId}`);
  },

  async createComment(
    articleId: number,
    content: string,
    parentId?: number
  ) {
    return request<any>(`/comments/article/${articleId}`, {
      method: 'POST',
      body: JSON.stringify({ content, parent_id: parentId }),
    });
  },

  async updateComment(commentId: number, content: string) {
    return request<any>(`/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  },

  async deleteComment(commentId: number) {
    return request<any>(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  },
};

// 分类 API
export const categoryApi = {
  async getCategories() {
    return request<any[]>('/categories');
  },

  async createCategory(data: { name: string; description?: string; color?: string }) {
    return request<any>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCategory(
    id: number,
    data: { name?: string; description?: string; color?: string }
  ) {
    return request<any>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteCategory(id: number) {
    return request<any>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },
};

// 标签 API
export const tagApi = {
  async getTags() {
    return request<any[]>('/tags');
  },

  async createTag(name: string) {
    return request<any>('/tags', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async deleteTag(id: number) {
    return request<any>(`/tags/${id}`, {
      method: 'DELETE',
    });
  },
};

// 笔记 API
export const noteApi = {
  async getNotes(params?: { page?: number; page_size?: number; category?: string; search?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.page_size) searchParams.set('page_size', String(params.page_size));
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return request<{
      notes: any[];
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
    }>(`/notes${query ? `?${query}` : ''}`);
  },

  async getNote(id: number) {
    return request<any>(`/notes/${id}`);
  },

  async createNote(data: {
    title: string;
    content: string;
    category?: string;
    tags?: string;
  }) {
    return request<any>('/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateNote(
    id: number,
    data: Partial<{ title: string; content: string; category: string; tags: string }>
  ) {
    return request<any>(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteNote(id: number) {
    return request<any>(`/notes/${id}`, {
      method: 'DELETE',
    });
  },
};

// 通知 API
export const notificationApi = {
  async getNotifications(params?: { page?: number; page_size?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.page_size) searchParams.set('page_size', String(params.page_size));

    const query = searchParams.toString();
    return request<{
      notifications: any[];
      total: number;
      unread_count: number;
    }>(`/notifications${query ? `?${query}` : ''}`);
  },

  async markAsRead(id: number) {
    return request<any>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  async markAllAsRead() {
    return request<any>('/notifications/read-all', {
      method: 'PUT',
    });
  },

  async deleteNotification(id: number) {
    return request<any>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },
};

// 用户资料 API
export const profileApi = {
  async getProfile() {
    return request<any>('/profile');
  },

  async updateProfile(data: {
    nickname?: string;
    full_name?: string;
    bio?: string;
    avatar_url?: string;
    github_url?: string;
  }) {
    return request<any>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async changePassword(oldPassword: string, newPassword: string) {
    return request<any>('/profile/password', {
      method: 'PUT',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
      }),
    });
  },

  async getSettings() {
    return request<any>('/profile/settings');
  },

  async updateSettings(data: {
    allow_notifications?: boolean;
    allow_comments?: boolean;
    theme_accent?: string;
    high_density_layout?: boolean;
    language?: string;
  }) {
    return request<any>('/profile/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// 客户端图片压缩（Canvas）
async function compressImage(file: File): Promise<File> {
  // 2MB 以下不压缩
  if (file.size <= 2 * 1024 * 1024) return file;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1920;
      let { width, height } = img;
      if (Math.max(width, height) > MAX) {
        const ratio = MAX / Math.max(width, height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(new File([blob], file.name, { type: "image/jpeg" }));
          else resolve(file);
        },
        "image/jpeg",
        0.8
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

// 计算文件 hash（HTTPS 用 SHA-256，HTTP 用纯 JS fallback）
async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  if (crypto.subtle?.digest) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  // HTTP fallback: 多轮 FNV-1a 凑 64 字符 hex（非加密级，仅用于去重判断）
  const bytes = new Uint8Array(buffer);
  const toHex = (n: number) => n.toString(16).padStart(8, "0");
  const parts: string[] = [];
  for (let round = 0; round < 8; round++) {
    let h = 0x811c9dc5 ^ round;
    const start = Math.floor(bytes.length * round / 8);
    const end = Math.floor(bytes.length * (round + 1) / 8);
    for (let i = start; i < end; i++) {
      h ^= bytes[i];
      h = (h * 0x01000193) >>> 0;
    }
    parts.push(toHex(h));
  }
  return parts.join("");
}

// 文件上传 API
export const uploadApi = {
  async uploadImage(file: File): Promise<ApiResponse<{ url: string }>> {
    // 1. 计算原始文件 hash
    const hash = await computeFileHash(file);

    // 2. 检查是否已存在
    const token = localStorage.getItem('blog_access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };

    try {
      const checkRes = await fetch(`${API_BASE_URL}/upload/check`, {
        method: "POST",
        headers,
        body: JSON.stringify({ hash }),
      });
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.data?.exists && checkData.data?.url) {
          return { success: true, data: { url: checkData.data.url }, message: "Image already exists" };
        }
      }
    } catch {
      // check 失败不影响上传流程
    }

    // 3. 不存在，压缩后上传，附带原始 hash
    const compressed = await compressImage(file);
    const formData = new FormData();
    formData.append('file', compressed);
    formData.append('hash', hash);

    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (response.status === 401) {
      localStorage.removeItem('blog_access_token');
      if (window.location.pathname !== '/profile') {
        localStorage.setItem('login_redirect', window.location.pathname);
        window.location.href = '/profile';
      }
      return { success: false, message: 'Unauthorized' };
    }

    if (response.status === 413) {
      return { success: false, message: 'File too large' };
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      return { success: false, message: `Upload failed (${response.status})` };
    }

    if (!response.ok) {
      return { success: false, message: data.detail || 'Upload failed' };
    }

    return { success: true, data: data.data, message: data.message };
  },
};

// 导出所有 API
export const api = {
  auth: authApi,
  articles: articleApi,
  comments: commentApi,
  categories: categoryApi,
  tags: tagApi,
  notes: noteApi,
  notifications: notificationApi,
  profile: profileApi,
  upload: uploadApi,
};

export default api;
