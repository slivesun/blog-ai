# blog-server 后端项目

## 项目概述

基于 FastAPI 构建的博客系统后端 API 服务，提供完整的 RESTful 接口。

## 技术栈

- **框架**: FastAPI 0.95+
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **ORM**: SQLAlchemy 2.0+
- **认证**: JWT Token
- **验证**: Pydantic v2

## 快速开始

### 1. 创建虚拟环境

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
.\venv\Scripts\activate  # Windows
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件配置数据库等参数
```

### 4. 初始化数据库

```bash
python scripts/init_db.py
```

### 5. 运行服务

```bash
# 开发环境（热重载）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 或使用脚本
python scripts/run_dev.py
```

### 6. 访问 API 文档

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 项目结构

```
blog-server/
├── app/
│   ├── api/              # API 路由
│   │   └── v1/
│   │       └── endpoints/
│   ├── core/             # 核心配置
│   ├── db/               # 数据库配置
│   ├── models/            # SQLAlchemy 模型
│   ├── schemas/           # Pydantic 模式
│   ├── services/         # 业务逻辑
│   ├── utils/            # 工具函数
│   └── middleware/       # 中间件
├── scripts/             # 脚本
├── tests/               # 测试
└── requirements.txt
```

## API 接口

### 认证接口
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/logout` - 用户登出
- `GET /api/v1/auth/me` - 获取当前用户

### 文章接口
- `GET /api/v1/articles` - 获取文章列表
- `GET /api/v1/articles/{id}` - 获取文章详情
- `POST /api/v1/articles` - 创建文章
- `PUT /api/v1/articles/{id}` - 更新文章
- `DELETE /api/v1/articles/{id}` - 删除文章
- `POST /api/v1/articles/{id}/like` - 点赞文章

### 评论接口
- `GET /api/v1/articles/{id}/comments` - 获取文章评论
- `POST /api/v1/articles/{id}/comments` - 添加评论
- `DELETE /api/v1/comments/{id}` - 删除评论

### 分类接口
- `GET /api/v1/categories` - 获取分类列表
- `POST /api/v1/categories` - 创建分类
- `PUT /api/v1/categories/{id}` - 更新分类
- `DELETE /api/v1/categories/{id}` - 删除分类

### 标签接口
- `GET /api/v1/tags` - 获取标签列表
- `POST /api/v1/tags` - 创建标签
- `DELETE /api/v1/tags/{id}` - 删除标签

### 笔记接口
- `GET /api/v1/notes` - 获取笔记列表
- `GET /api/v1/notes/{id}` - 获取笔记详情
- `POST /api/v1/notes` - 创建笔记
- `PUT /api/v1/notes/{id}` - 更新笔记
- `DELETE /api/v1/notes/{id}` - 删除笔记

### 通知接口
- `GET /api/v1/notifications` - 获取通知列表
- `PUT /api/v1/notifications/{id}/read` - 标记已读
- `PUT /api/v1/notifications/read-all` - 全部标记已读

### 用户设置接口
- `GET /api/v1/settings` - 获取用户设置
- `PUT /api/v1/settings` - 更新用户设置
- `GET /api/v1/profile` - 获取个人资料
- `PUT /api/v1/profile` - 更新个人资料

## 环境配置

```env
# 数据库配置
DATABASE_URL=sqlite:///./blog.db
# PostgreSQL 示例: postgresql://user:password@localhost/blog

# JWT 配置
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS 配置
CORS_ORIGINS=["http://localhost:3000"]

# 环境模式
ENVIRONMENT=development
```

## 测试

```bash
# 运行所有测试
pytest

# 运行测试并生成覆盖率报告
pytest --cov=app tests/
```

## 部署

### Docker 部署

```bash
# 构建镜像
docker build -t blog-server .

# 运行容器
docker run -d -p 8000:8000 --env-file .env blog-server
```

### Docker Compose 部署（前后端）

```bash
docker-compose up -d
```

## 许可证

MIT