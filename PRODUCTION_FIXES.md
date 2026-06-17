# Production Readiness Fixes

Date: 2026-06-10

## Fixed

### Backend safety

- Disabled `DEBUG` by default in `blog-server/app/core/config.py`.
- Added `CREATE_DEFAULT_ADMIN=false` as the default configuration.
- Changed application startup so the default `admin / admin123` account is only created when both conditions are true:
  - `ENVIRONMENT=development`
  - `CREATE_DEFAULT_ADMIN=true`
- Added production validation for `SECRET_KEY`. The backend now refuses to start in production when the secret key is empty or still using the known placeholder value.

### Backend permissions

- Restricted category create/update/delete flows to admin users.
- Restricted tag create/delete flows to admin users.

### Frontend checks

- Added the Vite TypeScript environment declaration in `blog-ui/src/vite-env.d.ts`.
- Fixed missing imports in `blog-ui/src/App.tsx` for:
  - `commentApi`
  - `transformComment`

### Production Docker path

- Added `blog-ui/Dockerfile` for production builds:
  - Builds the React app with `npm run build`.
  - Serves static files with Nginx.
- Added `blog-ui/nginx.conf`:
  - Serves the SPA.
  - Proxies `/api/` requests to the backend service.
  - Added security headers (X-Frame-Options, X-Content-Type-Options, etc.).
  - Enabled gzip compression for better performance.
  - Added static asset caching configuration.
  - Added HTTPS configuration template (commented out).
- Added `docker-compose.prod.yml`:
  - Keeps backend and frontend on an internal Docker network.
  - Avoids source-code bind mounts in production.
  - Uses the production frontend image instead of the Vite dev server.
  - Requires production environment values such as `SECRET_KEY`.
  - Added health checks for both backend and frontend services.
  - Frontend depends on backend health check passing.

### Docker security and optimization

- Updated `blog-server/Dockerfile`:
  - Added non-root user (`appuser`) for security.
  - Added health check endpoint.
  - Added `curl` for health check functionality.
  - Proper log directory permissions.
- Added `.dockerignore` files for both backend and frontend:
  - Reduces build context size.
  - Excludes unnecessary files from Docker images.

### Git configuration

- Updated `blog-server/.gitignore` to exclude `venv*/` directories.

## Verification

Current local verification results:

- Passed: `cd blog-ui && npm.cmd run lint`
- Passed: `cd blog-ui && npm.cmd run build`
- Not completed locally: `cd blog-server && .\venv\Scripts\python.exe -m pytest`
  - The local virtualenv Python failed to start a process on this machine.
  - Re-run backend tests in a clean Python environment or CI before deployment.

Run these before deployment:

```bash
cd blog-ui
npm run lint
npm run build
```

```bash
cd blog-server
python -m pytest
```

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

Required production environment variables:

```env
SECRET_KEY=<strong-random-secret>
CORS_ORIGINS=https://your-domain.example
FRONTEND_PORT=80
DATABASE_URL=sqlite:////app/data/blog.db
```

For real production traffic, prefer PostgreSQL:

```env
DATABASE_URL=postgresql://user:password@postgres:5432/blog
```

## Production Deployment Checklist

1. **Environment Variables**
   - [ ] Set strong `SECRET_KEY`
   - [ ] Configure `CORS_ORIGINS` for your domain
   - [ ] Set `DATABASE_URL` (PostgreSQL recommended)
   - [ ] Configure `FRONTEND_PORT` if not using default 80

2. **Database**
   - [ ] Migrate from SQLite to PostgreSQL
   - [ ] Run Alembic migrations
   - [ ] Remove any existing `admin/admin123` accounts

3. **Security**
   - [ ] Enable HTTPS in nginx.conf
   - [ ] Configure SSL certificates
   - [ ] Review public registration policy
   - [ ] Set up proper firewall rules

4. **Monitoring**
   - [ ] Verify health checks are working
   - [ ] Set up log aggregation
   - [ ] Configure alerting

5. **Backup**
   - [ ] Set up database backups
   - [ ] Configure volume backups for uploads

## 2026-06-15 新增修复

### 图片上传
- nginx `client_max_body_size 10m` 配置
- 客户端压缩（Canvas API，>2MB 文件自动压缩）
- 文件哈希去重（SHA-256 / FNV-1a 降级）
- 413 错误处理和友好提示

### 认证流程
- 401 响应自动登出并跳转登录页
- `auth:logout` 事件广播清除全局状态
- `login_redirect` 支持返回原页面

### 主题系统
- 自定义主题色支持（HEX 色值）
- 数据库迁移：`theme_accent_custom` 列
- 全页面内联样式适配自定义色

### 输入验证
- 个人中心表单校验（字数、特殊字符）
- Toast 通知替代 alert()
- 删除二次确认弹框

## 剩余待办

- 替换 SQLite 为 PostgreSQL（高并发场景）
- 引入 Alembic 迁移脚本替代 `create_all`
- 添加 CI 检查（后端测试、前端类型检查、构建）
- 确定文章/笔记创建权限策略
- 配置 HTTPS 证书
- 设置自动化备份调度
- 配置日志聚合和监控告警
