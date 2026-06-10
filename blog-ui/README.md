# blog-ui 前端项目

## 项目概述

基于 React 19 + TypeScript 构建的博客系统前端，使用 SCSS 编写样式，Vite 6 构建，支持中英文双语切换。

## 技术栈

- **框架**: React 19 + TypeScript
- **路由**: React Router v7
- **构建**: Vite 6
- **样式**: SCSS (纯手写，无 Tailwind CSS)
- **图标**: Lucide React
- **HTTP**: Fetch API (封装于 api.ts)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 4. 构建生产版本

```bash
npm run build
npm run preview
```

## 项目结构

```
blog-ui/
├── public/                  # 静态资源
├── src/
│   ├── api.ts               # API 请求封装 (fetch + JWT)
│   ├── App.tsx              # 主应用组件 (路由 + 全局状态)
│   ├── main.tsx             # 入口文件
│   ├── types.ts             # TypeScript 类型定义
│   ├── utils.ts             # 工具函数 (MD5, SHA256, 初始数据)
│   ├── dataTransform.ts     # API 数据 → 前端类型转换
│   ├── context/
│   │   └── LanguageContext.tsx  # 中英文语言上下文
│   ├── components/
│   │   ├── Header.tsx       # 顶部导航栏
│   │   └── Footer.tsx       # 底部栏
│   ├── pages/
│   │   ├── home/            # 首页
│   │   ├── blog/            # 博客列表 + 详情 + 编辑
│   │   ├── notes/           # 笔记页面
│   │   ├── profile/         # 个人资料 + 登录/注册
│   │   ├── notifications/   # 通知中心
│   │   ├── settings/        # 系统设置
│   │   └── dev-tools/       # 开发工具
│   └── styles/
│       ├── global.css       # 全局样式入口
│       ├── _variables.scss  # SCSS 变量
│       ├── _mixins.scss     # SCSS 混入
│       ├── _utilities.scss  # 工具类 (替代 Tailwind)
│       └── pages/           # 页面级样式
│           ├── _home.scss
│           ├── _blog.scss
│           ├── _notes.scss
│           ├── _profile.scss
│           ├── _notifications.scss
│           ├── _settings.scss
│           └── _dev-tools.scss
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 核心功能

### 页面路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | Home | 首页概览 |
| `/blog` | Blog | 博客文章列表 |
| `/blog/:id` | Blog Detail | 文章详情 (含评论) |
| `/blog/compose` | Blog Compose | 撰写新文章 |
| `/notes` | Notes | 笔记列表 |
| `/profile` | Profile | 个人资料 (登录/注册) |
| `/notifications` | Notifications | 通知中心 |
| `/settings` | Settings | 系统设置 |
| `/dev-tools` | Dev Tools | 开发工具 |

### 数据流

```
Backend API → api.ts (fetch + JWT) → dataTransform.ts (类型转换) → React State → 组件渲染
```

- `api.ts`: 封装所有 HTTP 请求，自动附加 JWT token
- `dataTransform.ts`: 将后端 API 响应转换为前端 TypeScript 类型
- 优先展示 nickname，fallback 到 full_name / username

### 样式系统 (SCSS)

项目使用纯 SCSS 编写，不依赖 Tailwind CSS:

- `_variables.scss`: 颜色、间距、字体等变量
- `_mixins.scss`: 响应式断点、主题色等混入
- `_utilities.scss`: 工具类集合 (类名兼容 Tailwind，但用 SCSS 实现)
- 各页面独立 `.scss` 文件，使用 BEM 命名

### 国际化 (i18n)

通过 `LanguageContext` 实现中英文切换:

- `useLanguage()` hook 获取当前语言和翻译函数
- Header 中有语言切换按钮
- 所有界面文本通过 `t.xxx.yyy` 访问

### 状态管理

使用 React 内置的 useState + useEffect:

- **全局状态**: 登录状态、用户资料、文章列表、通知等在 App.tsx 中管理
- **懒加载数据**: 各页面数据按需加载 (访问时才请求 API)
- **本地缓存**: 用户资料和设置通过 localStorage 缓存

## 开发注意事项

### API 请求

所有 API 请求通过 `api.ts` 封装，支持:
- 自动附加 JWT Authorization header
- 统一错误处理
- Token 过期自动清除

### 组件开发

- 使用 React.lazy + Suspense 实现路由级代码分割
- 图标统一使用 lucide-react
- 所有组件接受 props 接口，类型定义在 `types.ts`

### 样式开发

- 新样式优先在对应页面 `.scss` 文件中编写
- 工具类可直接使用原 Tailwind 类名 (已在 `_utilities.scss` 中定义)
- 主题色通过 `settings.themeAccent` 动态切换

## 构建配置

```typescript
// vite.config.ts 关键配置
- SCSS 预处理器: silenceDeprecations: ['legacy-js-api']
- 路径别名: @ → src/
- 代理: /api → http://localhost:8000
```

## 许可证

MIT
