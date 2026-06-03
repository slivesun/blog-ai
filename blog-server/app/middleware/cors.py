"""
CORS中间件配置
配置跨域资源共享
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings


def configure_cors(app: FastAPI) -> None:
    """
    配置CORS中间件

    参数:
        app: FastAPI应用实例
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
