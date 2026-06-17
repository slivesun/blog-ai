# Blog 自动化部署方案

> 最后更新：2026-06-15

## 目录

- [方案一：Windows 批处理脚本（当前方案）](#方案一windows-批处理脚本当前方案)
- [方案二：GitHub Actions CI/CD](#方案二github-actions-cicd)
- [方案三：Docker Compose 部署](#方案三docker-compose-部署)
- [方案四：宝塔面板部署](#方案四宝塔面板部署)
- [方案五：Linux Shell 脚本](#方案五linux-shell-脚本)
- [数据库迁移说明](#数据库迁移说明)
- [回滚策略](#回滚策略)

---

## 方案一：Windows 批处理脚本（当前方案）

### 适用场景

- 阿里云 Windows 服务器
- 手动部署或定时任务触发
- 最简单的部署方式

### 前置条件

- Git 已安装并配置
- Python 3.13+ 已安装
- Node.js 18+ 已安装
- nginx 已安装在 `C:\Users\Administrator\nginx-1.30.2`

### 部署步骤

#### 1. 首次部署

```bat
# 克隆项目
git clone <仓库地址> C:\Users\Administrator\Desktop\blog-ai
cd C:\Users\Administrator\Desktop\blog-ai

# 执行部署脚本
deploy-windows.bat
```

脚本会依次执行：
1. `git pull` 拉取最新代码
2. 询问是否初始化数据库（仅首次需要）
3. 创建 Python 虚拟环境
4. 安装后端依赖
5. 构建前端（npm run build）
6. 复制 nginx 配置
7. 复制前端静态文件到 nginx html 目录

#### 2. 启动服务

```bat
# 启动后端（后台运行）
cd blog-server
start /min venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# 重载 nginx
C:\Users\Administrator\nginx-1.30.2\nginx.exe -s reload
```

#### 3. 后续更新

```bat
cd C:\Users\Administrator\Desktop\blog-ai
deploy-windows.bat
# 然后重启后端和 nginx
```

### 定时自动部署（Windows 任务计划程序）

```bat
# 创建 auto-deploy.bat
@echo off
cd /d C:\Users\Administrator\Desktop\blog-ai
call deploy-windows.bat

# 重启后端
taskkill /f /im python.exe 2>nul
cd blog-server
start /min venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# 重载 nginx
cd C:\Users\Administrator\nginx-1.30.2
nginx.exe -s reload
```

在任务计划程序中设置：
- 触发器：每天凌晨 3:00
- 操作：运行 `auto-deploy.bat`
- 勾选"不管用户是否登录都要运行"

---

## 方案二：GitHub Actions CI/CD

### 适用场景

- 代码推送到 GitHub 自动触发部署
- 需要 SSH 访问服务器
- 适合团队协作

### 前置条件

- GitHub 仓库
- 服务器开启 SSH 服务
- 配置 GitHub Secrets

### 配置步骤

#### 1. 配置 GitHub Secrets

在 GitHub 仓库 → Settings → Secrets and variables → Actions 中添加：

| Secret 名称 | 说明 |
|-------------|------|
| `SERVER_HOST` | 服务器 IP 或域名 |
| `SERVER_USERNAME` | SSH 用户名 |
| `SERVER_SSH_KEY` | SSH 私钥内容 |
| `SERVER_PORT` | SSH 端口（默认22） |

#### 2. 创建工作流文件

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy Blog

on:
  push:
    branches: [master]
  workflow_dispatch:  # 支持手动触发

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: blog-ui/package-lock.json

      - name: Build frontend
        working-directory: blog-ui
        run: |
          npm ci
          npm run build

      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USERNAME }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          port: ${{ secrets.SERVER_PORT }}
          script: |
            cd C:\Users\Administrator\Desktop\blog-ai
            
            # 拉取代码
            git pull origin master
            
            # 更新后端依赖
            cd blog-server
            venv\Scripts\pip.exe install -r requirements.txt
            
            # 运行数据库迁移
            venv\Scripts\python.exe scripts\init_db.py
            
            # 复制前端构建产物（从 GitHub Actions 上传）
            cd ..
            
            # 重启后端
            taskkill /f /im python.exe 2>nul
            cd blog-server
            start /min venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
            
            # 重载 nginx
            C:\Users\Administrator\nginx-1.30.2\nginx.exe -s reload

      - name: Upload frontend build
        uses: appleboy/scp-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USERNAME }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          port: ${{ secrets.SERVER_PORT }}
          source: "blog-ui/dist/*"
          target: "C:/Users/Administrator/Desktop/blog-ai/blog-ui/"
          strip_components: 2
```

#### 3. Windows 服务器 SSH 配置

```powershell
# 安装 OpenSSH Server（管理员 PowerShell）
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0

# 启动 SSH 服务
Start-Service sshd
Set-Service -Name sshd -StartupType Automatic

# 配置防火墙
New-NetFirewallRule -Name sshd -DisplayName 'OpenSSH Server (sshd)' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22
```

---

## 方案三：Docker Compose 部署

### 适用场景

- 环境隔离，一致性好
- 适合 Linux 服务器
- 便于扩展和迁移

### 前置条件

- 服务器安装 Docker 和 Docker Compose
- Linux 服务器（推荐 Ubuntu 22.04+）

### 配置步骤

#### 1. 创建 Dockerfile（后端）

创建 `blog-server/Dockerfile`：

```dockerfile
FROM python:3.13-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY . .

# 创建上传目录
RUN mkdir -p uploads

# 非 root 用户
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 2. 创建 Dockerfile（前端）

创建 `blog-ui/Dockerfile`：

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 3. 创建 nginx 配置

创建 `blog-ui/nginx.conf`：

```nginx
server {
    listen 80;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1024;
    
    # API 代理
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10m;
    }
    
    # 上传文件代理
    location /uploads/ {
        proxy_pass http://backend:8000;
    }
    
    # SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 4. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./blog-server
      dockerfile: Dockerfile
    container_name: blog-backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      - blog-data:/app/data
      - blog-uploads:/app/uploads
    environment:
      - DATABASE_URL=sqlite:////app/data/blog.db
      - SECRET_KEY=${SECRET_KEY}
      - ENVIRONMENT=production
      - CORS_ORIGINS=${CORS_ORIGINS}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  frontend:
    build:
      context: ./blog-ui
      dockerfile: Dockerfile
    container_name: blog-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      backend:
        condition: service_healthy

volumes:
  blog-data:
  blog-uploads:
```

#### 5. 创建环境变量文件

创建 `.env`：

```env
SECRET_KEY=your-strong-random-secret-key-here
CORS_ORIGINS=https://your-domain.com
```

#### 6. 部署命令

```bash
# 首次部署
git clone <仓库地址> /root/blog
cd /root/blog

# 构建并启动
docker compose up -d --build

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f

# 后续更新
git pull
docker compose up -d --build
```

---

## 方案四：宝塔面板部署

### 适用场景

- 不熟悉命令行
- 需要可视化管理
- 适合个人站长

### 前置条件

- 安装宝塔面板
- 安装 Python 项目管理器插件

### 部署步骤

#### 1. 安装宝塔面板

```bash
# Ubuntu/Debian
wget -O install.sh https://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh

# CentOS
yum install -y wget && wget -O install.sh https://download.bt.cn/install/install_6.0.sh && sh install.sh
```

#### 2. 配置 Python 项目

1. 宝塔面板 → 软件商店 → 安装 Python 项目管理器
2. 添加项目：
   - 项目路径：`/www/wwwroot/blog/blog-server`
   - Python版本：3.13
   - 启动文件：`app/main.py`
   - 启动参数：`--host 0.0.0.0 --port 8000`
   - 开机自启：是

#### 3. 配置网站

1. 宝塔面板 → 网站 → 添加站点
2. 域名：填入你的域名
3. 根目录：`/www/wwwroot/blog/blog-ui/dist`
4. PHP版本：纯静态

#### 4. 配置 nginx

在站点设置 → 配置文件中添加：

```nginx
# API 代理
location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    client_max_body_size 10m;
}

# 上传文件
location /uploads/ {
    proxy_pass http://127.0.0.1:8000;
}

# SPA 路由
location / {
    try_files $uri $uri/ /index.html;
}
```

#### 5. 部署更新

```bash
cd /www/wwwroot/blog
git pull

# 构建前端
cd blog-ui
npm install
npm run build

# 重启后端
bt restart python
```

---

## 方案五：Linux Shell 脚本

### 适用场景

- Linux 服务器
- 简单自动化
- 不需要 Docker

### 创建部署脚本

创建 `deploy-linux.sh`：

```bash
#!/bin/bash
set -e

# 配置
PROJECT_DIR="/root/blog"
VENV_DIR="$PROJECT_DIR/blog-server/venv"
NGINX_HTML="/usr/share/nginx/html"

echo "=========================================="
echo "  Blog 自动化部署"
echo "=========================================="

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# 检查是否在项目目录
if [ ! -f "$PROJECT_DIR/deploy-linux.sh" ]; then
    echo -e "${RED}错误：请在项目根目录执行此脚本${NC}"
    exit 1
fi

cd "$PROJECT_DIR"

# 1. 拉取代码
echo -e "\n${GREEN}[1/6] 拉取最新代码...${NC}"
git pull origin master

# 2. 更新后端依赖
echo -e "\n${GREEN}[2/6] 更新后端依赖...${NC}"
cd blog-server
source "$VENV_DIR/bin/activate"
pip install -r requirements.txt -q

# 3. 运行数据库迁移
echo -e "\n${GREEN}[3/6] 运行数据库迁移...${NC}"
python scripts/init_db.py
deactivate

# 4. 构建前端
echo -e "\n${GREEN}[4/6] 构建前端...${NC}"
cd ../blog-ui
npm install --silent
npm run build

# 5. 部署前端
echo -e "\n${GREEN}[5/6] 部署前端静态文件...${NC}"
sudo rm -rf "$NGINX_HTML"/*
sudo cp -r dist/* "$NGINX_HTML/"

# 6. 重启服务
echo -e "\n${GREEN}[6/6] 重启服务...${NC}"

# 重启后端（systemd）
if systemctl is-active --quiet blog-backend; then
    sudo systemctl restart blog-backend
    echo "后端服务已重启"
else
    echo "后端服务未运行，正在启动..."
    sudo systemctl start blog-backend
fi

# 重载 nginx
sudo nginx -t && sudo nginx -s reload
echo "nginx 已重载"

echo -e "\n${GREEN}=========================================="
echo "  部署完成！"
echo "==========================================${NC}"
```

### 配置 systemd 服务

创建 `/etc/systemd/system/blog-backend.service`：

```ini
[Unit]
Description=Blog Backend FastAPI
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/blog/blog-server
Environment="PATH=/root/blog/blog-server/venv/bin"
ExecStart=/root/blog/blog-server/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable blog-backend
sudo systemctl start blog-backend
```

### 设置定时部署

```bash
# 编辑 crontab
crontab -e

# 添加（每天凌晨3点执行）
0 3 * * * cd /root/blog && bash deploy-linux.sh >> /var/log/blog-deploy.log 2>&1
```

---

## 数据库迁移说明

### 自动迁移机制

项目使用 SQLite + SQLAlchemy 的 `create_all` 自动创建表结构。对于新增列，需要手动运行迁移脚本。

### 迁移脚本位置

`blog-server/scripts/init_db.py`

### 运行迁移

```bash
cd blog-server

# Windows
venv\Scripts\python.exe scripts\init_db.py

# Linux
source venv/bin/activate
python scripts/init_db.py
```

### 迁移内容

脚本会自动检测并添加缺失的列：

| 表 | 列 | 类型 | 说明 |
|----|-----|------|------|
| user_settings | theme_accent_custom | VARCHAR(9) | 自定义主题色 HEX |
| images | - | 整表 | 图片去重记录表 |

---

## 回滚策略

### Git 回滚

```bash
# 查看最近提交
git log --oneline -10

# 回滚到指定提交
git reset --hard <commit-hash>

# 重新部署
deploy-windows.bat  # Windows
bash deploy-linux.sh  # Linux
docker compose up -d --build  # Docker
```

### 数据库备份与恢复

```bash
# 备份
cd blog-server
python backup_db.py ./backups/

# 恢复（手动复制备份文件）
cp backups/blog_backup_20260615_030000.db blog.db
```

### Docker 回滚

```bash
# 查看镜像历史
docker images blog-backend

# 回滚到指定版本
docker compose down
docker tag blog-backend:<old-tag> blog-backend:latest
docker compose up -d
```

---

## 方案对比

| 方案 | 复杂度 | 自动化程度 | 适用环境 | 回滚难度 |
|------|--------|-----------|----------|----------|
| Windows 批处理 | ⭐ | 手动/定时 | Windows | 简单 |
| GitHub Actions | ⭐⭐⭐ | 全自动 | 任意 | 简单 |
| Docker Compose | ⭐⭐ | 半自动 | Linux | 简单 |
| 宝塔面板 | ⭐ | 手动 | Linux | 中等 |
| Linux Shell | ⭐⭐ | 手动/定时 | Linux | 简单 |

### 推荐方案

- **个人项目、Windows 服务器**：方案一（Windows 批处理）
- **团队协作、持续部署**：方案二（GitHub Actions）
- **环境一致性要求高**：方案三（Docker Compose）
- **不熟悉命令行**：方案四（宝塔面板）

---

## 常见问题

### Q: 部署后页面空白

检查 nginx 配置是否正确，确保 `try_files $uri /index.html` 存在。

### Q: API 请求 404

检查 nginx 的 `/api/` 代理配置是否指向正确的后端地址和端口。

### Q: 图片上传失败

1. 检查 nginx `client_max_body_size` 是否足够（建议 10m）
2. 检查 `uploads` 目录权限
3. 查看后端日志确认错误原因

### Q: 数据库迁移失败

1. 确保后端已停止
2. 备份 `blog.db`
3. 手动运行 `python scripts/init_db.py`
4. 检查日志输出

### Q: 自定义主题色不生效

1. 确保运行了数据库迁移（添加 `theme_accent_custom` 列）
2. 重启后端服务
3. 清除浏览器缓存
