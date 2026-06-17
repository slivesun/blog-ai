# Blog 项目部署文档

> 最后更新：2026-06-15

## 项目概述

本文档描述如何部署 blog-ui 前端和 blog-server 后端项目。

## 当前生产环境

- 服务器：阿里云 Windows 11，2核2G
- 域名：whzzzhy.xyz（IP: 120.26.209.105）
- Web服务器：nginx 1.30.2
- Python：3.13
- 数据库：SQLite（WAL模式）

## 环境要求

### 生产环境（Windows）
- Windows 11
- Node.js 18+
- Python 3.13+
- nginx 1.30.2
- Git

### 开发环境
- Node.js 18+
- Python 3.8+
- SQLite (内置)

## 项目结构

```
blog/
├── blog-ui/              # 前端项目 (React + Vite)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── blog-server/         # 后端项目 (FastAPI)
│   ├── app/
│   ├── scripts/
│   ├── tests/
│   └── requirements.txt
├── blog-skill/          # 技术文档
├── docker-compose.yml   # Docker 部署配置
└── README.md
```

## 部署方式

### 方式一: Docker Compose 部署 (推荐)

#### 1. 配置环境变量

**后端配置** `blog-server/.env`:
```env
DATABASE_URL=sqlite:///./blog.db
SECRET_KEY=your-secure-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:3000
ENVIRONMENT=production
LOG_LEVEL=INFO
```

#### 2. 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 3. 访问服务

- 前端: http://localhost:3000
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs

---

### 方式二: 手动部署

#### 后端部署

##### 1. 创建虚拟环境

```bash
cd blog-server
python -m venv venv

# Windows
.\venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

##### 2. 安装依赖

```bash
pip install -r requirements.txt
```

##### 3. 配置环境

```bash
cp .env.example .env
# 编辑 .env 配置数据库等参数
```

##### 4. 初始化数据库

```bash
python scripts/init_db.py
```

##### 5. 运行数据库迁移

```bash
# 添加 nickname 列 (如已存在会自动跳过)
python scripts/add_nickname_column.py
```

##### 6. 运行服务

```bash
# 开发环境 (热重载)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 生产环境
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### 前端部署

##### 1. 安装依赖

```bash
cd blog-ui
npm install
```

##### 2. 配置环境

```bash
cp .env.example .env
# 编辑 .env 配置 API 地址
```

##### 3. 构建项目

```bash
npm run build
```

##### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式 (需先配置 nginx)
```

---

### 方式三: Nginx 部署 (生产环境)

#### 1. 构建前端

```bash
cd blog-ui
npm run build
```

#### 2. Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/blog-ui/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 数据库配置

### SQLite (开发环境)

默认配置，开箱即用：
```env
DATABASE_URL=sqlite:///./blog.db
```

### PostgreSQL (生产环境)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/blogdb
```

#### PostgreSQL 安装与配置

```bash
# Ubuntu
sudo apt install postgresql postgresql-contrib

# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE blogdb;
CREATE USER bloguser WITH ENCRYPTED PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE blogdb TO bloguser;
```

## 运维操作

### 启动/停止服务

```bash
# Docker Compose
docker-compose up -d      # 启动
docker-compose down       # 停止
docker-compose restart    # 重启

# Systemd (手动部署)
systemctl start blog-server
systemctl stop blog-server
systemctl restart blog-server
```

### 日志查看

```bash
# Docker Compose
docker-compose logs -f backend

# 本地运行
tail -f logs/blog-server.log
```

### 数据库备份

```bash
# SQLite
cp blog.db blog.db.backup

# PostgreSQL
pg_dump -U bloguser blogdb > backup.sql
```

### 数据恢复

```bash
# SQLite
cp blog.db.backup blog.db

# PostgreSQL
psql -U bloguser blogdb < backup.sql
```

## 安全配置

### 1. 修改密钥

```env
SECRET_KEY=<生成一个64位随机字符串>
```

生成方式:
```python
import secrets
print(secrets.token_hex(64))
```

### 2. 配置 CORS

生产环境应限制为实际域名:
```env
CORS_ORIGINS=https://your-domain.com
```

### 3. 启用 HTTPS

使用 Nginx 反向代理并配置 SSL:
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    # ...
}
```

## 性能优化

### 1. 数据库优化

- 添加适当索引
- 使用连接池
- 启用查询缓存

### 2. 缓存策略

启用 Redis 缓存:
```python
# 安装 redis
pip install redis

# 环境变量
REDIS_URL=redis://localhost:6379
```

### 3. 静态文件

- 启用 Gzip 压缩
- 使用 CDN 加速静态资源
- 配置浏览器缓存

## 监控与告警

### 日志监控

使用 ELK Stack 或 Loki 收集分析日志

### 性能监控

- Prometheus + Grafana
- Sentry 错误追踪

## 常见问题处理

### 1. CORS 错误

检查 CORS_ORIGINS 配置是否包含前端地址

### 2. 数据库连接失败

检查 DATABASE_URL 配置和数据库服务状态

### 3. 前端无法访问 API

检查 nginx 代理配置和后端服务状态

### 4. 静态资源加载失败

检查构建输出目录和 nginx root 配置

## 技术支持

如有问题，请查看:
- API 文档: http://localhost:8000/docs
- 项目 Wiki: https://github.com/your-repo/wiki
