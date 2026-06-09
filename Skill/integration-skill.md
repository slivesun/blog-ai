# 前后端集成指南

## 概述

本文档描述如何将 blog-ui 前端与 blog-server 后端进行集成。

## 快速开始

### 1. 启动后端服务

```bash
cd blog-server

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows

# 安装依赖
pip install -r requirements.txt

# 初始化数据库
python scripts/init_db.py

# 启动服务
uvicorn app.main:app --reload --port 8000
```

### 2. 配置前端 API 地址

在 `blog-ui/.env` 文件中配置:
```env
VITE_API_URL=http://localhost:8000
VITE_API_BASE_URL=/api/v1
```

### 3. 启动前端服务

```bash
cd blog-ui
npm install
npm run dev
```

## API 集成配置

### Vite 代理配置

在 `vite.config.ts` 中配置代理:

```typescript
server: {
  proxy: {
    '/api': {
      target: process.env.VITE_API_URL || 'http://localhost:8000',
      changeOrigin: true,
      secure: false,
    },
  },
},
```

### API 服务模块

项目已提供完整的 API 服务封装，参见 `src/api.ts`:

```typescript
import api from './api';

// 登录
const result = await api.auth.login(username, password);

// 获取文章列表
const result = await api.articles.getArticles({ page: 1, page_size: 10 });

// 创建文章
const result = await api.articles.createArticle({
  title: 'New Article',
  content: 'Article content',
  category_id: 1,
});
```

## 接口调用示例

### 认证流程

```typescript
// 1. 登录
const loginResult = await api.auth.login('username', 'password');
if (loginResult.success) {
  // token 自动保存到 localStorage
  const { user, token } = loginResult.data;
}

// 2. 访问需要认证的接口
const articles = await api.articles.getArticles();

// 3. 登出
api.auth.logout();
```

### 文章管理

```typescript
// 获取文章列表
const result = await api.articles.getArticles({
  page: 1,
  page_size: 20,
  category_id: 1,
  search: 'keyword',
});

// 获取文章详情
const detail = await api.articles.getArticle(1);

// 创建文章
const create = await api.articles.createArticle({
  title: 'My Article',
  abstract: 'Summary',
  content: 'Full content',
  category_id: 1,
  tag_ids: [1, 2],
});

// 更新文章
await api.articles.updateArticle(1, {
  title: 'Updated Title',
});

// 删除文章
await api.articles.deleteArticle(1);

// 点赞
await api.articles.likeArticle(1);
```

### 评论操作

```typescript
// 获取评论
const comments = await api.comments.getComments(articleId);

// 发表评论
await api.comments.createComment(articleId, 'Great article!');

// 回复评论
await api.comments.createComment(articleId, 'Good point!', parentCommentId);

// 删除评论
await api.comments.deleteComment(commentId);
```

## 错误处理

### 统一错误处理

```typescript
const result = await api.articles.getArticles();

if (!result.success) {
  // 处理错误
  console.error(result.message);
  // 显示错误提示
  showToast(result.message, 'error');
}
```

### HTTP 状态码处理

| 状态码 | 说明 | 处理方式 |
|--------|------|----------|
| 200 | 成功 | 处理响应数据 |
| 201 | 创建成功 | 提示用户 |
| 400 | 请求错误 | 显示错误信息 |
| 401 | 未认证 | 跳转登录 |
| 403 | 无权限 | 提示权限不足 |
| 404 | 资源不存在 | 提示不存在 |
| 500 | 服务器错误 | 提示稍后重试 |

## 数据格式

### 请求格式

```typescript
// POST/PUT 请求使用 JSON
await api.articles.createArticle({
  title: 'Title',
  content: 'Content',
});

// Query 参数
await api.articles.getArticles({ page: 1, page_size: 20 });
```

### 响应格式

```typescript
// 统一响应格式
{
  success: boolean,
  data?: T,
  message?: string,
}

// 分页响应
{
  success: true,
  data: {
    articles: [],
    total: 100,
    page: 1,
    page_size: 20,
    total_pages: 5,
  }
}
```

## 认证状态管理

### Token 存储

Token 存储在 localStorage 中:
```javascript
localStorage.getItem('blog_access_token')
```

### 路由守卫

```typescript
// 在需要认证的页面检查
const token = localStorage.getItem('blog_access_token');
if (!token) {
  // 跳转登录页
  router.push('/login');
}
```

## 开发调试

### 查看 API 请求

1. 浏览器开发者工具 -> Network
2. 过滤 `/api/` 请求
3. 查看请求和响应详情

### 后端日志

启动后端时开启详细日志:
```bash
LOG_LEVEL=DEBUG uvicorn app.main:app --reload
```

### 前端调试

```typescript
// 在 API 调用处添加日志
const result = await api.articles.getArticles();
console.log('API Result:', result);
```

## 生产环境部署

### 后端部署

1. 构建 Docker 镜像
2. 配置环境变量
3. 启动服务

### 前端部署

1. 设置生产 API 地址
2. 构建项目: `npm run build`
3. 部署静态文件到 CDN 或 Nginx

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name example.com;

    # 前端
    location / {
        root /var/www/blog-ui/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
