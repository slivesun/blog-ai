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
    password: string
  ): Promise<ApiResponse<AuthResponse>> {
    const response = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });

    if (response.success && response.data?.token.access_token) {
      localStorage.setItem('blog_access_token', response.data.token.access_token);
    }

    return response;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('blog_access_token');
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
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.page_size) searchParams.set('page_size', String(params.page_size));
    if (params?.category_id) searchParams.set('category_id', String(params.category_id));
    if (params?.tag_id) searchParams.set('tag_id', String(params.tag_id));
    if (params?.search) searchParams.set('search', params.search);

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
};

export default api;
