---
name: blog-project-logic
description: 在这个仓库工作前使用：帮助理解 Blog 全栈项目的前后端结构、数据契约、部署假设、测试限制和已知坑点，适用于改代码、排查问题、评审、部署前检查。
---

# Blog 项目逻辑 Skill

以后接手这个项目、改功能、排查问题、做代码评审前，先读这个文件。它不是用户文档，而是给“以后继续干活的人或 AI”看的项目逻辑速查。

## 项目整体形态

- 根目录是一个全栈博客系统。
- 前端在 `blog-ui/`：React 19 + TypeScript + Vite + SCSS。
- 后端在 `blog-server/`：FastAPI + SQLAlchemy + Pydantic v2 + SQLite。
- 当前部署目标是 Windows 服务器 + nginx 反向代理。不要擅自连接服务器，除非用户明确要求。
- `Skill/*.md` 是项目自己的模块沉淀文档，不是 Codex 已安装的系统技能。

## 第一次看项目的推荐顺序

1. 先读 `CLAUDE.md`，里面有部署和服务器约束。
2. 再读本文件，了解当前架构、数据契约和已知坑。
3. 如果改前端，优先读：
   - `blog-ui/src/App.tsx`
   - `blog-ui/src/api.ts`
   - 涉及的页面：`blog-ui/src/pages/`
   - `blog-ui/src/dataTransform.ts`
   - `blog-ui/src/types.ts`
4. 如果改后端，优先读：
   - `blog-server/app/main.py`
   - `blog-server/app/api/v1/router.py`
   - 涉及的 endpoint：`blog-server/app/api/v1/endpoints/`
   - 对应 schema：`blog-server/app/schemas/`
   - 对应 model：`blog-server/app/models/`
5. 如果改数据库或部署，优先读：
   - `blog-server/scripts/init_db.py`
   - `deploy-windows.bat`
   - `nginx-windows.conf`
   - `docker-compose*.yml`

## 前端逻辑地图

- `App.tsx` 管理大部分全局状态：登录状态、用户资料、文章、笔记、通知、系统设置。
- `App.tsx` 会把常见 CRUD 写操作封装成 handler，再传给页面组件。
- 但有些页面会绕过 `App.tsx`，自己动态导入 API：
  - `BlogView`：文章详情加载、草稿保存、草稿编辑、分页加载、封面上传。
  - `ProfileView`：草稿加载、草稿发布/删除、头像上传、密码找回。
- `api.ts` 封装 fetch、JWT 请求头、401 自动跳转登录、图片上传和文件 hash。
- `dataTransform.ts` 把后端 snake_case 响应转换成前端 camelCase 类型。
- `types.ts` 是前端视角的数据类型定义。
- `LanguageContext` 负责中英文状态，本地 key 是 `portalcore_language`。
- `ToastContext` 是轻量提示系统。

## 前端样式系统

- 项目文档说“无 Tailwind”，但组件里大量使用 Tailwind 风格类名。
- 这些类名不是 Tailwind 运行时生成的，而是本地 SCSS 工具类实现的。
- 全局样式入口：`blog-ui/src/styles/global.scss`。
- 工具类：`blog-ui/src/styles/_utilities.scss`。
- 页面样式：`blog-ui/src/styles/pages/`。
- 组件样式：`blog-ui/src/styles/components/`。
- 除非明确做样式系统重构，否则改 UI 时继续沿用这个“SCSS + 工具类”的混合模式。

## 后端逻辑地图

- `main.py` 负责创建 FastAPI 应用，配置生命周期、日志、CORS、限流、中间件、API 路由、上传文件静态目录和 `/health`。
- `api/v1/router.py` 汇总这些模块：
  - `auth`
  - `articles`
  - `comments`
  - `categories`
  - `tags`
  - `notes`
  - `notifications`
  - `profile`
  - `upload`
- SQLAlchemy 模型在 `app/models/`。
- Pydantic schema 在 `app/schemas/`。
- `app/db/session.py` 创建数据库 engine、`SessionLocal`、`Base` 和 `init_db()`。
- `app/core/dependencies.py` 处理当前用户、必须登录、管理员权限。
- `app/core/security.py` 处理 bcrypt 密码哈希和 JWT。

## 核心数据契约

- 前端 localStorage 里的 token key：`blog_access_token`。
- 前端缓存用户资料 key：`portalcore_profile`。
- 前端缓存系统设置 key：`portalcore_settings`。
- 文章：
  - 后端模型：`Article`
  - 后端接口：`/api/v1/articles`
  - 前端类型：`BlogArticle`
  - 转换函数：`transformArticle`
- 评论：
  - 后端返回支持 `replies` 嵌套回复。
  - 前端 `BlogComment` 目前没有嵌套 replies 字段。
  - 文章详情页目前主要按扁平评论展示。
- 笔记：
  - 笔记是登录用户自己的资源。
  - 后端把 `tags` 存成字符串。
  - 前端会把逗号分隔字符串转换成数组。
- 设置：
  - 后端支持 `theme_accent_custom`、`language`、`skin`。
  - 前端对应 `themeAccentCustom` 和 `skin`。

## 已知坑点

- `blog-ui/src/api.ts` 现在会先无条件执行 `response.json()`。但后端多个 DELETE 接口返回 `204 No Content`，没有 JSON body，所以删除成功也可能被前端误判成失败。
- `npm run lint` 实际是 `tsc --noEmit`。Windows PowerShell 可能拦截 `npm.ps1`，这时用 `npm.cmd run lint`。
- 当前前端类型检查失败点在 `blog-ui/vite.config.ts`：`silenceDeprecations` 被推断成 `string[]`，和 Sass/Vite 类型不兼容。
- 后端测试不要随便跑。`blog-server/tests/conftest.py` 使用的是应用数据库，并且每个测试结束后会清空所有表数据。除非先改成隔离测试库，否则不要对有价值的数据跑 `pytest`。
- 项目里有两个 `get_db`：
  - `app.db.session.get_db`
  - `app.core.dependencies.get_db`
  endpoint 大多导入第一个，认证依赖内部用第二个。写测试覆盖时要注意两条依赖链。
- 前端文章分类目前硬编码：`Engineering=1`、`Design=2`、`Security=3`、`Systems=4`。这只在空库按默认初始化顺序创建分类时稳定，不是可靠长期契约。
- 如果文章 API 加载失败，前端可能继续显示 `INITIAL_ARTICLES` 示例文章，而不是显示错误或空状态。
- `blog-server/blog.db-wal` 和 `blog-server/blog.db-shm` 已经被 git 跟踪。虽然 `.gitignore` 现在忽略数据库文件，但对已跟踪文件不生效。
- 前端有一些疑似模板残留依赖，目前源码里没看到引用：`@google/genai`、`express`、`dotenv`、`motion`、`tailwindcss`、`@tailwindcss/vite`。

## 安全相关注意

- JWT 存在 localStorage，使用方便，但如果前端出现 XSS，会有 token 泄露风险。
- 生产环境会校验弱 `SECRET_KEY`，弱密钥会启动失败。
- CORS 来源由 `CORS_ORIGINS` 控制。
- 限流使用 slowapi，默认按远端地址限流。
- 点赞去重使用进程内内存字典，维度是 IP + article_id，窗口是 24 小时，服务重启后会丢失记录。
- 浏览量去重使用 `viewed_{article_id}` HttpOnly cookie，窗口是 24 小时。
- nginx 已传 `X-Forwarded-For`，但 FastAPI/uvicorn 是否拿到真实客户端 IP，取决于 proxy headers / trusted proxy 配置。生产上依赖 IP 限流或点赞去重前，需要实际验证。
- 笔记预览用了 `dangerouslySetInnerHTML`，但 `renderMarkdownHTML()` 会先转义 `&`、`<`、`>`、`"`、`'`，再做简单 markdown 替换。如果以后改 markdown 渲染，要重新审 XSS。

## 数据库与迁移

- 本地默认 SQLite：`sqlite:///./blog.db`。
- Docker 生产环境使用：`sqlite:////app/data/blog.db`，并挂载 volume。
- `init_db()` 只创建不存在的表，不会完整管理迁移。
- `scripts/init_db.py` 会初始化默认分类、标签、管理员、示例文章，也包含一些轻量字段迁移。
- `scripts/add_nickname_column.py` 是旧的定向迁移脚本。
- 虽然装了 Alembic，但当前项目没有正式使用完整 Alembic 迁移流程。

## 部署注意事项

- 根目录 `CLAUDE.md` 明确说服务器是 Windows，不要擅自连接服务器。
- Windows 部署脚本：`deploy-windows.bat`。
- Windows nginx 配置：`nginx-windows.conf`。
- 后端在服务器上用 uvicorn 跑 8000 端口。
- 前端生产构建后由部署脚本复制到 nginx html 目录。
- Docker 生产配置：`docker-compose.prod.yml`。
- 前端开发脚本实际跑 Vite 3000 端口；部分 README 仍写 5173。文档和源码冲突时，以源码为准。

## 验证规则

- 前端验证：
  - Windows 下优先用 `npm.cmd run lint`。
  - `npm run build` 会生成 `dist/`，没必要时不要制造构建产物变化。
- 后端验证：
  - 不要直接跑 `pytest`，除非确认或修复了测试数据库隔离。
  - 如果必须跑测试，先检查并调整 `tests/conftest.py`，确保它使用临时测试库，并且必要时覆盖两条 `get_db` 依赖链。
- 改 API 时：
  - 后端 model、schema、endpoint 要一起看。
  - 前端 `api.ts`、`dataTransform.ts`、`types.ts` 要一起看。
  - 还要检查受影响页面，尤其是 `BlogView` 和 `ProfileView`，因为有些流程直接调用 API，不走 `App.tsx` handler。
- 改 UI 时：
  - 沿用现有 SCSS 工具类模式。
  - 新增文案要同步改 `zh.ts` 和 `en.ts`。
  - 除非明确重构构建系统，不要假设项目真的启用了 Tailwind。

## 常见改动路线

### 修 API 响应处理

重点看 `blog-ui/src/api.ts`。空响应，例如 204，应该在解析 JSON 前被当作成功处理；或者按状态码、content-type、body 内容有条件解析。

### 新增或修改用户设置

通常要同时改：

- `blog-server/app/models/settings.py`
- `blog-server/app/schemas/user.py`
- `blog-server/app/api/v1/endpoints/profile.py`
- `blog-ui/src/types.ts`
- `blog-ui/src/dataTransform.ts`
- `blog-ui/src/api.ts`
- `blog-ui/src/pages/settings/index.tsx`
- 如果已有数据库需要新增列，还要更新 `blog-server/scripts/init_db.py` 的轻量迁移列表

### 新增或修改文章字段

通常要同时改：

- `blog-server/app/models/article.py`
- `blog-server/app/schemas/article.py`
- `blog-server/app/api/v1/endpoints/articles.py`
- `blog-ui/src/types.ts`
- `blog-ui/src/dataTransform.ts`
- `blog-ui/src/api.ts`
- `blog-ui/src/pages/blog/index.tsx`
- 如果个人中心文章/草稿列表受影响，还要看 `blog-ui/src/pages/profile/index.tsx`

### 改草稿功能

至少读这两个文件：

- `blog-ui/src/pages/blog/index.tsx`
- `blog-ui/src/pages/profile/index.tsx`

草稿编辑靠 `sessionStorage.setItem('edit_draft', JSON.stringify(draft))` 在个人中心和写作页之间传递数据。

### 改登录、注册、个人资料

至少读：

- `blog-server/app/api/v1/endpoints/auth.py`
- `blog-server/app/api/v1/endpoints/profile.py`
- `blog-server/app/schemas/auth.py`
- `blog-server/app/schemas/user.py`
- `blog-ui/src/api.ts`
- `blog-ui/src/pages/profile/index.tsx`

当前个人资料里的 email 输入框是禁用的，保存逻辑也不会提交 email。

## 仓库卫生

- 不要回滚用户未要求回滚的改动。
- `blog.db-wal` / `blog.db-shm` 已被跟踪，是否从 git 中移除应该作为单独清理任务处理。
- 不要提交缓存、`node_modules`、`dist`、venv、uploads、logs、本地数据库文件。
- README 和源码冲突时，以源码为准。
