# blog-ui 前端开发要点

## 技术栈

- **框架**: React 19 + TypeScript
- **构建工具**: Vite 6
- **路由**: React Router v7 (BrowserRouter)
- **样式**: Tailwind CSS 4 + SCSS
- **动画**: Motion (framer-motion)
- **图标**: Lucide React
- **代码分割**: React.lazy + Suspense

## 项目结构

```
src/
├── api.ts                  # API 请求封装，401 拦截，请求/响应统一处理
├── App.tsx                 # 主路由、全局状态、登录/注册逻辑
├── types.ts                # 全局 TypeScript 类型定义
├── utils.ts                # 初始数据常量（INITIAL_ARTICLES 等）
├── dataTransform.ts        # 后端数据 → 前端类型的转换函数
├── main.tsx                # 入口，挂载 LanguageProvider + BrowserRouter
├── index.css               # Tailwind 入口
├── context/
│   └── LanguageContext.tsx  # 语言上下文，useLanguage hook
├── components/
│   ├── Header.tsx          # 导航栏
│   └── Footer.tsx          # 页脚
├── pages/
│   ├── home/               # 首页
│   ├── blog/               # 文章列表 + 详情 + 编辑
│   ├── notes/              # 笔记页面（需登录）
│   ├── dev-tools/          # 开发工具页面
│   ├── profile/            # 登录/注册 + 个人中心
│   ├── notifications/      # 通知中心
│   └── settings/           # 系统设置
├── i18n/
│   ├── index.ts            # getTranslation()、TranslationKeys 类型
│   ├── zh.ts               # 中文翻译
│   └── en.ts               # 英文翻译
└── styles/
    ├── global.scss         # 全局样式
    ├── _variables.scss     # SCSS 变量
    ├── _mixins.scss        # SCSS mixins
    ├── _utilities.scss     # 工具类
    ├── components/         # 组件样式
    └── pages/              # 页面样式
```

## API 请求

`api.ts` 封装了所有后端请求，核心逻辑：

- **基础路径**: `/api/v1/`（开发环境通过 vite proxy 转发，生产环境 nginx 代理）
- **认证**: JWT token 存在 `localStorage` 的 `blog_access_token`，每次请求带 `Authorization: Bearer {token}`
- **401 拦截**: 接口返回 401 时自动清除 token，跳转到 `/profile` 登录页，并在 `localStorage` 存 `login_redirect` 记录来源页
- **登录后跳转**: 登录/注册成功后检查 `login_redirect`，有值则跳回原页面

### API 模块

| 模块 | 文件 | 用途 |
|------|------|------|
| `authApi` | api.ts | 登录、注册、获取当前用户 |
| `articleApi` | api.ts | 文章 CRUD、点赞 |
| `commentApi` | api.ts | 评论 CRUD |
| `noteApi` | api.ts | 笔记 CRUD |
| `notificationApi` | api.ts | 通知列表、标记已读、删除（支持分页） |
| `profileApi` | api.ts | 个人资料、设置的读取和更新 |

## 国际化 (i18n)

自定义方案，不依赖第三方库：

- **LanguageContext**: React Context 提供 `language`、`setLanguage`、`t` 三个值
- **useLanguage hook**: 在组件中获取当前语言和翻译文本
- **语言持久化**: `localStorage` 的 `portalcore_language` 键
- **自动检测**: 首次访问根据 `navigator.language` 自动选择中/英文
- **使用方式**: 组件内 `const { t } = useLanguage()`，然后 `t.notifications.title` 等

### 翻译文件结构

`i18n/zh.ts` 和 `i18n/en.ts` 的 key 必须与 `i18n/index.ts` 的 `TranslationKeys` 类型完全一致。新增翻译时两边都要加。

### 已完成 i18n 的页面

- ✅ 通知页面 (`notifications/`)
- ✅ 个人中心 (`profile/`)
- ✅ 设置页面 (`settings/`)
- ✅ 导航栏 (`Header.tsx`)
- ✅ 页脚 (`Footer.tsx`)

## 路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | HomeView | 首页 |
| `/blog` | BlogView | 文章列表 |
| `/blog/:slug` | BlogView | 文章详情 |
| `/blog/compose` | BlogView | 写文章（需登录） |
| `/dev-tools` | DevToolsView | 开发工具 |
| `/notes` | NotesView | 笔记（需登录） |
| `/profile` | ProfileView | 登录/注册/个人中心 |
| `/notifications` | NotificationsView | 通知中心（需登录） |
| `/settings` | SettingsView | 系统设置（需登录） |

所有页面使用 `React.lazy` 按需加载，`Suspense` 显示 `PageLoader` 加载动画。

## 样式方案

- **Tailwind CSS 4**: 主要样式方案，通过 `@import "tailwindcss"` 引入
- **SCSS**: 用于复杂组件样式，通过 `@import` 引入各模块
- **主题色**: `settings.themeAccent` 支持 cyan/violet/amber/emerald 四种
- **高密度布局**: `settings.highDensityLayout` 控制信息密度

### SCSS 文件组织

- `_variables.scss`: 颜色、间距、字体等变量
- `_mixins.scss`: 响应式、主题色等 mixin
- `_utilities.scss`: 工具类
- `components/`: Header、Footer 等组件样式
- `pages/`: 各页面独立样式

## 数据转换

`dataTransform.ts` 负责将后端 API 响应转换为前端类型：

| 函数 | 用途 |
|------|------|
| `transformArticle()` | 后端文章 → `BlogArticle` |
| `transformNote()` | 后端笔记 → `SystemNote` |
| `transformNotification()` | 后端通知 → `AppNotification` |
| `transformProfile()` | 后端用户 → `UserProfile` |
| `transformSettings()` | 后端设置 → `SystemSettings` |
| `transformComment()` | 后端评论 → `BlogComment` |

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_URL` | 后端 API 地址（开发环境） | `http://localhost:8000` |
| `DISABLE_HMR` | 禁用热更新 | `false` |

开发环境通过 `vite.config.ts` 的 `server.proxy` 将 `/api` 请求代理到后端。

## 构建和部署

```bash
npm run dev        # 开发服务器，端口 3000
npm run build      # 生产构建，输出到 dist/
npm run preview    # 预览构建结果
npm run lint       # TypeScript 类型检查
```

生产部署：`dist/` 内容复制到 nginx 的 `html/` 目录，nginx 配置 `try_files $uri /index.html` 支持 SPA 路由。

## 注意事项

- 新增页面需要在 `App.tsx` 添加 lazy import 和 Route
- 新增翻译 key 需要同时更新 `zh.ts`、`en.ts` 和 `index.ts` 的类型定义
- API 请求统一通过 `api.ts` 的 `request()` 函数，自动处理 token 和 401
- 组件样式优 先用 Tailwind，复杂样式用 SCSS 文件
- 所有页面组件导出为 default export（lazy 要求）
