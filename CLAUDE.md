# Blog Project - Key Notes

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

## Known Limitations

- No HTTPS (no certificate yet).
- JWT in localStorage (XSS-vulnerable; httpOnly cookies would be more secure but require larger refactor).
- SQLite for production (fine for low traffic, consider PostgreSQL for scale).
- In-memory like dedup resets on server restart (acceptable for current scale).
- No automated backup scheduling (manual `backup_db.py` or Windows Task Scheduler).
