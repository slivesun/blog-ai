#!/bin/bash
# ============================================
# Blog 一键部署脚本
# 适用：阿里云 Ubuntu/Debian 2核2G 服务器
# 用法：chmod +x deploy.sh && sudo ./deploy.sh
# ============================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ============================================
# 第一步：安装 Docker
# ============================================
install_docker() {
    if command -v docker &> /dev/null; then
        info "Docker 已安装: $(docker --version)"
    else
        info "正在安装 Docker..."
        apt update
        apt install -y ca-certificates curl gnupg lsb-release

        # 添加 Docker 官方 GPG key
        install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        chmod a+r /etc/apt/keyrings/docker.gpg

        # 添加仓库
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
          $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
          tee /etc/apt/sources.list.d/docker.list > /dev/null

        apt update
        apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

        systemctl enable docker
        systemctl start docker

        info "Docker 安装完成: $(docker --version)"
    fi
}

# ============================================
# 第二步：配置 Swap（2G 内存建议加）
# ============================================
setup_swap() {
    if [ -f /swapfile ]; then
        info "Swap 已存在"
    else
        info "正在创建 2G Swap 空间（防止内存不足）..."
        fallocate -l 2G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
        info "Swap 创建完成（2G）"
    fi
}

# ============================================
# 第三步：配置防火墙
# ============================================
setup_firewall() {
    if command -v ufw &> /dev/null; then
        info "配置 UFW 防火墙..."
        ufw allow 22/tcp    # SSH
        ufw allow 80/tcp    # HTTP
        ufw allow 443/tcp   # HTTPS
        ufw --force enable
        info "防火墙配置完成"
    else
        warn "未检测到 ufw，请手动在阿里云安全组开放 80 端口"
    fi
}

# ============================================
# 第四步：生成环境变量
# ============================================
setup_env() {
    PROJECT_DIR="$1"
    ENV_FILE="${PROJECT_DIR}/.env"

    if [ -f "$ENV_FILE" ]; then
        warn ".env 文件已存在，跳过生成"
        return
    fi

    info "正在生成环境变量..."

    SECRET_KEY=$(openssl rand -hex 32)

    # 询问域名
    echo ""
    echo -e "${YELLOW}请输入你的域名（例如 blog.example.com）：${NC}"
    read -r DOMAIN
    if [ -z "$DOMAIN" ]; then
        DOMAIN="localhost"
        warn "未输入域名，使用 localhost"
    fi

    cat > "$ENV_FILE" << EOF
# Blog 生产环境配置 - 自动生成于 $(date)
SECRET_KEY=${SECRET_KEY}
CORS_ORIGINS=http://${DOMAIN}
VITE_API_BASE_URL=/api/v1
FRONTEND_PORT=80
DATABASE_URL=sqlite:////app/data/blog.db
ENVIRONMENT=production
DEBUG=false
CREATE_DEFAULT_ADMIN=false
EOF

    info "环境变量已写入 ${ENV_FILE}"
    info "SECRET_KEY 已自动生成"
}

# ============================================
# 第五步：构建并启动 Docker 容器
# ============================================
start_services() {
    PROJECT_DIR="$1"
    cd "$PROJECT_DIR"

    info "正在构建 Docker 镜像（首次较慢，请耐心等待）..."
    docker compose -f docker-compose.prod.yml build

    info "正在启动服务..."
    docker compose -f docker-compose.prod.yml up -d

    info "等待服务启动..."
    sleep 10

    # 检查服务状态
    docker compose -f docker-compose.prod.yml ps
}

# ============================================
# 第六步：初始化数据库
# ============================================
init_database() {
    PROJECT_DIR="$1"
    cd "$PROJECT_DIR"

    info "正在初始化数据库..."
    docker exec blog-backend-prod python scripts/init_db.py || warn "数据库可能已初始化"
    info "数据库初始化完成"
}

# ============================================
# 第七步：设置自动备份
# ============================================
setup_backup() {
    PROJECT_DIR="$1"

    info "正在配置每日自动备份..."
    cat > /usr/local/bin/blog-backup.sh << 'BACKUP_EOF'
#!/bin/bash
BACKUP_DIR="/root/blog-backups"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)

# 备份数据库
docker cp blog-backend-prod:/app/data/blog.db "$BACKUP_DIR/blog_${DATE}.db"

# 保留最近 30 天的备份
find "$BACKUP_DIR" -name "*.db" -mtime +30 -delete

echo "[$(date)] 备份完成: blog_${DATE}.db"
BACKUP_EOF

    chmod +x /usr/local/bin/blog-backup.sh

    # 添加定时任务（每天凌晨 3 点）
    (crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/blog-backup.sh >> /var/log/blog-backup.log 2>&1") | crontab -

    info "自动备份已配置（每天凌晨 3 点，保留 30 天）"
}

# ============================================
# 主流程
# ============================================
main() {
    echo ""
    echo "=========================================="
    echo "   Blog 博客系统 - 一键部署"
    echo "=========================================="
    echo ""

    # 检查是否 root
    if [ "$EUID" -ne 0 ]; then
        error "请使用 root 权限运行: sudo ./deploy.sh"
    fi

    # 项目目录
    PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
    info "项目目录: ${PROJECT_DIR}"

    # 执行各步骤
    install_docker
    setup_swap
    setup_firewall
    setup_env "$PROJECT_DIR"
    start_services "$PROJECT_DIR"
    init_database
    setup_backup "$PROJECT_DIR"

    # 完成
    echo ""
    echo "=========================================="
    echo -e "${GREEN}   ✅ 部署完成！${NC}"
    echo "=========================================="
    echo ""

    # 读取域名
    DOMAIN=$(grep CORS_ORIGINS "${PROJECT_DIR}/.env" | cut -d'=' -f2 | sed 's|http://||')

    echo "  🌐 访问地址: http://${DOMAIN}"
    echo "  📝 API 文档: http://${DOMAIN}/docs"
    echo ""
    echo "  常用命令:"
    echo "    查看状态: docker compose -f docker-compose.prod.yml ps"
    echo "    查看日志: docker compose -f docker-compose.prod.yml logs -f"
    echo "    重启服务: docker compose -f docker-compose.prod.yml restart"
    echo "    停止服务: docker compose -f docker-compose.prod.yml down"
    echo "    手动备份: /usr/local/bin/blog-backup.sh"
    echo ""
    echo "  ⚠️  下一步："
    echo "    1. 在阿里云安全组开放 80 端口"
    echo "    2. 配置域名 DNS 解析指向此服务器 IP"
    echo "    3. 访问网站并创建管理员账号"
    echo ""
}

main "$@"
