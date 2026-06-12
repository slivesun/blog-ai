# Blog 阿里云部署指南

## 你的环境

- 服务器：阿里云 2核2G
- 数据库：SQLite
- 域名：已备案
- HTTPS：暂不需要

---

## 快速部署（3 步完成）

### 第 1 步：上传代码到服务器

**方式 A：用 Git（推荐）**

```bash
# 1. 先把代码推到 GitHub 或 Gitee
# 2. 在服务器上克隆
git clone https://你的仓库地址.git /root/blog
cd /root/blog
```

**方式 B：用 scp 上传**

```bash
# 在本地电脑执行（Windows 用 Git Bash）
scp -r D:/project/blog root@你的服务器IP:/root/blog
```

**方式 C：用宝塔面板上传**

1. 宝塔面板 → 文件 → 上传到 `/root/blog`
2. 解压

### 第 2 步：执行部署脚本

```bash
cd /root/blog
chmod +x deploy.sh
sudo ./deploy.sh
```

脚本会自动完成：
- ✅ 安装 Docker
- ✅ 创建 Swap（防止 2G 内存不够）
- ✅ 配置防火墙
- ✅ 生成环境变量（会问你域名）
- ✅ 构建并启动容器
- ✅ 初始化数据库
- ✅ 配置每日自动备份

### 第 3 步：配置域名解析

在阿里云域名控制台添加：

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| A | @ | 你的服务器公网IP |
| A | www | 你的服务器公网IP |

---

## 部署后操作

### 查看服务状态

```bash
docker compose -f docker-compose.prod.yml ps
```

### 查看日志

```bash
# 全部日志
docker compose -f docker-compose.prod.yml logs -f

# 只看后端
docker compose -f docker-compose.prod.yml logs -f backend

# 只看前端
docker compose -f docker-compose.prod.yml logs -f frontend
```

### 创建管理员账号

```bash
# 进入后端容器
docker exec -it blog-backend-prod bash

# 初始化数据库和管理员
python scripts/init_db.py

# 退出容器
exit
```

### 手动备份

```bash
/usr/local/bin/blog-backup.sh
```

备份文件保存在 `/root/blog-backups/`

### 重启服务

```bash
cd /root/blog
docker compose -f docker-compose.prod.yml restart
```

### 更新代码后重新部署

```bash
cd /root/blog
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

---

## 常见问题

### Q: 访问网站显示 502 Bad Gateway

后端还没启动完，等 10 秒再刷新。如果持续 502：

```bash
docker compose -f docker-compose.prod.yml logs backend
```

### Q: 内存不够用

```bash
# 查看内存使用
free -h

# 如果 Swap 没生效
sudo swapon /swapfile
```

### Q: 端口被占用

```bash
# 查看谁占了 80 端口
sudo lsof -i :80

# 停掉占用的服务（比如 nginx）
sudo systemctl stop nginx
```

### Q: 域名访问不了

1. 确认 DNS 已解析：`ping 你的域名`
2. 确认阿里云安全组开放了 80 端口
3. 确认域名已备案

### Q: 想加 HTTPS 怎么办

```bash
# 安装 certbot
sudo apt install certbot -y

# 获取证书（先停掉 docker 的 80 端口）
docker compose -f docker-compose.prod.yml stop frontend
sudo certbot certonly --standalone -d 你的域名.com

# 证书在 /etc/letsencrypt/live/你的域名.com/
# 然后修改 nginx.conf 启用 HTTPS 配置
```

---

## 文件说明

| 文件 | 用途 |
|------|------|
| `deploy.sh` | 一键部署脚本 |
| `.env.production` | 环境变量模板 |
| `docker-compose.prod.yml` | 生产环境 Docker 配置 |
| `blog-ui/nginx.conf` | Nginx 配置（含 HTTPS 模板） |
| `blog-server/Dockerfile` | 后端镜像构建 |
| `blog-ui/Dockerfile` | 前端镜像构建 |
| `/usr/local/bin/blog-backup.sh` | 自动备份脚本 |
| `/root/blog-backups/` | 备份文件目录 |
