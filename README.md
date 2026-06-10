# Blog 全栈博客系统

基于 React + FastAPI 的全栈博客系统，支持文章管理、评论互动、笔记记录、通知推送等功能。

## 项目结构

```
blog/
├── blog-ui/          # 前端 (React 19 + TypeScript + SCSS)
├── blog-server/      # 后端 (FastAPI + SQLAlchemy + SQLite)
└── README.md
```

## 技术栈

### 前端 (blog-ui)
- React 19 + TypeScript
- React Router v7
- Vite 6
- SCSS (纯手写样式，无 Tailwind CSS)
- Lucide React 图标

### 后端 (blog-server)
- FastAPI 0.115+
- SQLAlchemy 2.0 + Pydantic v2
- SQLite (开发) / PostgreSQL (生产)
- JWT Token 认证

## 快速开始

### 启动后端

```bash
cd blog-server
python -m venv venv
source venv/bin/activate  # Linux/Mac 或 .\venv\Scripts\activate (Windows)
pip install -r requirements.txt
python scripts/init_db.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 启动前端

```bash
cd blog-ui
npm install
npm run dev
```

访问 http://localhost:5173

## 核心功能

- **用户系统**: 注册/登录/登出，JWT 认证，用户昵称
- **文章管理**: CRUD、分类、标签、点赞、浏览量统计
- **评论系统**: 嵌套回复、软删除、评论通知
- **笔记功能**: 个人笔记 CRUD
- **通知中心**: 点赞/评论自动生成通知，已读/删除管理
- **系统设置**: 主题色切换、中英文双语
- **响应式设计**: 移动端适配

## API 文档

后端启动后访问:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 详细文档

- [前端文档](./blog-ui/README.md)
- [后端文档](./blog-server/README.md)

## 许可证

MIT
