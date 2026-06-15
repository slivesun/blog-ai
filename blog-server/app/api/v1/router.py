"""
API v1 路由聚合模块
负责聚合所有 v1 版本的 API 路由
"""
from fastapi import APIRouter
from app.api.v1.endpoints import auth, articles, comments, categories, tags, notes, notifications, profile, upload

api_router = APIRouter()

# 挂载各个模块的路由
api_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_router.include_router(articles.router, prefix="/articles", tags=["文章"])
api_router.include_router(comments.router, prefix="/comments", tags=["评论"])
api_router.include_router(categories.router, prefix="/categories", tags=["分类"])
api_router.include_router(tags.router, prefix="/tags", tags=["标签"])
api_router.include_router(notes.router, prefix="/notes", tags=["笔记"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["通知"])
api_router.include_router(profile.router, prefix="/profile", tags=["用户资料"])
api_router.include_router(upload.router, prefix="/upload", tags=["文件上传"])
