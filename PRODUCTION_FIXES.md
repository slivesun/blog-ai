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

## Remaining Production Work

- Replace SQLite with PostgreSQL for durable multi-user production use.
- Add Alembic migration scripts and stop relying on automatic `Base.metadata.create_all()` for schema management.
- Add CI checks for backend tests, frontend type-checking, and frontend build.
- Decide whether article and note creation should be admin-only or open to all registered users.
- Rotate or remove any existing `admin / admin123` account from old local or deployed databases.
- Review public registration policy before opening the site to the internet.
- Set up proper logging and monitoring solution.
- Configure automated backups.
