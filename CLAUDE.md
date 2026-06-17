# Blog Project - Key Notes

## 不要擅自链接服务器，问题无法解决了在必须需要的情况下询问我之后再连接

## 服务器是windows系统

## Project Structure

- **Backend**: FastAPI + SQLAlchemy + SQLite, in `blog-server/`
- **Frontend**: React 19 + Vite + Tailwind CSS, in `blog-ui/`
- **Deployment**: Windows batch script `deploy-windows.bat`, nginx reverse proxy
- **Server**: Windows 11, Python 3.13, nginx 1.30.2
- **Domain**: whzzzhy.xyz (IP: 120.26.209.105)

## Security Measures (2026-06-14)

### Rate Limiting (slowapi)

Global default: 100 requests/minute per IP. Shared limiter instance in `app/core/limiter.py`.

| Endpoint | Limit | Purpose |
|----------|-------|---------|
| `POST /api/v1/auth/login` | 5/min | Login brute-force protection |
| `POST /api/v1/auth/register` | 3/min | Registration spam |
| `POST /api/v1/auth/login/form` | 5/min | OAuth form login |
| `POST /api/v1/articles` | 10/min | Article creation spam |
| `POST /api/v1/articles/{id}/like` | 30/min | Like spam |
| `POST /api/v1/comments/article/{id}` | 10/min | Comment spam |
| `POST /api/v1/notes` | 20/min | Note creation spam |
| `PUT /api/v1/profile/password` | 5/min | Password change abuse |

### Anti-Spam (Custom Dedup)

- **Like dedup**: In-memory IP+article tracking, 24h window. Same IP can only like same article once per 24h.
- **View dedup**: Cookie-based (`viewed_{article_id}`, httponly, 24h). Same browser counts view only once per 24h.

### Input Sanitization

- **Search**: SQL LIKE wildcards (`%`, `_`, `\`) escaped via `_escape_like_pattern()` in articles and notes search.
- **Notification content**: `html.escape()` on article titles and comment content before storing in notification descriptions.

### CORS

Restricted to: `GET, POST, PUT, DELETE, OPTIONS` methods and `Authorization, Content-Type` headers. Origins from `settings.cors_origins_list`.

### Error Handling

- Global exception handler returns generic "An error occurred" in all environments (no `str(e)` leak).
- `ErrorHandlingMiddleware` also hides error details.
- Logging middleware only records `url.path` (no query params that might contain tokens).

### Nginx Security Headers

```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ...
```

### Database

- SQLite with WAL mode enabled (PRAGMA journal_mode=WAL on every connection).
- `busy_timeout=5000` to handle concurrent write contention.
- `check_same_thread=False` for FastAPI async compatibility.

### Health Check

`GET /health` returns database connectivity status:
```json
{"status": "healthy|degraded", "version": "...", "environment": "...", "database": "connected|disconnected"}
```

## Deployment

### Server Paths

- nginx: `C:\Users\Administrator\nginx-1.30.2`
- Project: `C:\Users\Administrator\Desktop\blog-ai`
- Frontend static files: nginx `html/` directory

### Deploy Steps

1. `git pull`
2. Run `deploy-windows.bat` (handles venv, pip install, frontend build, nginx config copy)
3. Restart backend: `cd blog-server && start /min venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000`
4. Reload nginx: `C:\Users\Administrator\nginx-1.30.2\nginx.exe -s reload`

### Key Deploy Script Fallbacks

- **npm build**: npm run build → npx vite build → node node_modules/.bin/vite.js → vite.cmd
- **pip install**: pip → python -m pip → full path to venv pip.exe → global pip
- **SECRET_KEY**: python → python3 → powershell random string

### Nginx Config

Standalone config at `nginx-windows.conf` with full `http {}` block. Includes gzip, SPA fallback (`try_files $uri /index.html`), API proxy to `127.0.0.1:8000`, static file caching (1y for assets).

### 自动化部署方案

详见 [DEPLOYMENT.md](./DEPLOYMENT.md)，包含 5 种部署方案：
- Windows 批处理脚本（当前方案）
- GitHub Actions CI/CD
- Docker Compose
- 宝塔面板
- Linux Shell 脚本

## Database Backup

Script: `blog-server/backup_db.py`

```bash
python backup_db.py [backup_dir]   # default: ./backups/, keeps last 30 copies
```

## Auth Flow

- JWT tokens stored in frontend `localStorage`.
- 401 responses trigger redirect to `/profile` (login page), with `login_redirect` in localStorage for return-to-original-page.
- `EmailStr` validation only on `RegisterRequest`, not on `UserBase` (admin seed uses `admin@example.com`).

## i18n

Custom `LanguageContext` with `useLanguage` hook. Keys in `src/i18n/zh.ts` and `en.ts`. All pages (notifications, profile, settings) use `t.*` references.

## 2026-06-15 新增功能

### 自定义主题色系统
- 4种预设色：cyan、violet、amber、emerald（CSS类）
- 自定义色板：原生 `<input type="color">` 选择器
- CSS变量 + 内联样式覆盖模式支持自定义HEX色
- 全页面适配：首页、博客、笔记、通知、个人中心、设置

### 图片上传优化
- 客户端压缩：Canvas API，最大1920px，JPEG质量80，文件 >2MB 触发
- 文件哈希去重：SHA-256（HTTPS）/ FNV-1a 降级（HTTP）
- 服务端预检：`/upload/check` 端点
- 上传加载状态和错误提示

### Toast 通知系统
- 轻量 React Context：`ToastContext` + `useToast()` Hook
- 固定定位，zIndex 2147483647
- 成功（绿色边框）/ 失败（红色边框）/ 信息（蓝色边框）
- 替代所有 `alert()` 调用

### 草稿系统
- 真实API支持的草稿（非模拟数据）
- 创建、更新、删除、发布操作
- 个人中心草稿编辑入口
- 保存后跳转草稿箱标签页

### 个人中心改进
- 移除显示名称/角色字段（无实际用途）
- 新增 GitHub/邮箱编辑
- 表单校验 + Toast 反馈
- 删除二次确认弹框
- 文章详情页支持返回来源页

### 安全增强
- 限流（slowapi）：登录5次/分，注册3次/分，发文10次/分
- 防刷：点赞去重（24h IP+文章），浏览去重（Cookie 24h）
- 输入净化：SQL LIKE转义，通知内容HTML转义
- nginx `client_max_body_size 10m` 支持图片上传
- 401 响应自动登出并跳转登录页

### 国际化
- 自定义 `LanguageContext` + `useLanguage` Hook
- 中英文键值在 `src/i18n/zh.ts` 和 `en.ts`
- 全页面使用 `t.*` 引用

## Known Limitations

- No HTTPS (no certificate yet).
- JWT in localStorage (XSS-vulnerable; httpOnly cookies would be more secure but require larger refactor).
- SQLite for production (fine for low traffic, consider PostgreSQL for scale).
- In-memory like dedup resets on server restart (acceptable for current scale).
- No automated backup scheduling (manual `backup_db.py` or Windows Task Scheduler).
- Custom theme hover states use fallback colors (CSS can't do dynamic hover with inline styles).
