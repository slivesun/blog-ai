"""
FastAPI 应用主模块
负责应用创建、配置和启动
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.limiter import limiter
from app.api.v1.router import api_router
from app.middleware.cors import configure_cors
from app.middleware.logging import RequestLoggingMiddleware, ErrorHandlingMiddleware
from slowapi.errors import RateLimitExceeded
from loguru import logger
import sys


def setup_logging():
    """
    配置日志系统
    设置日志格式、级别和输出位置
    """
    # 移除默认的日志处理器
    logger.remove()

    # 添加控制台处理器
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=settings.LOG_LEVEL,
        colorize=True
    )

    # 如果配置了日志文件，添加文件处理器
    if settings.LOG_FILE:
        import os
        log_dir = os.path.dirname(settings.LOG_FILE)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)

        logger.add(
            settings.LOG_FILE,
            format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
            level=settings.LOG_LEVEL,
            rotation="10 MB",
            retention="7 days",
            compression="zip"
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理
    在应用启动时初始化数据库，在应用关闭时清理资源
    """
    # 启动时
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")

    # 初始化数据库
    from app.db.session import init_db
    init_db()
    logger.info("Database initialized")

    # 创建默认管理员账号（如果不存在）
    if settings.is_development and settings.CREATE_DEFAULT_ADMIN:
        await create_default_admin()

    yield

    # 关闭时
    logger.info("Shutting down...")


async def create_default_admin():
    """
    创建默认管理员账号
    仅在开发环境创建，生产环境应通过正常注册流程
    """
    from app.db.session import SessionLocal
    from app.models.user import User
    from app.models.settings import UserSettings
    from app.core.security import get_password_hash

    db = SessionLocal()
    try:
        # 检查是否已存在管理员
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            # 创建管理员账号
            admin = User(
                username="admin",
                email="admin@example.com",
                hashed_password=get_password_hash("admin123"),
                full_name="Administrator",
                role="admin",
                is_active=True,
                is_admin=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

            # 创建管理员设置
            settings_obj = UserSettings(user_id=admin.id)
            db.add(settings_obj)
            db.commit()

            logger.info("Default admin user created: admin / admin123")
    except Exception as e:
        logger.error(f"Failed to create default admin: {e}")
    finally:
        db.close()


def create_app() -> FastAPI:
    """
    创建并配置FastAPI应用

    返回:
        FastAPI: 配置好的应用实例
    """
    # 设置日志
    setup_logging()

    # 创建应用
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="Blog系统后端API服务",
        docs_url="/docs" if settings.is_development else None,
        redoc_url="/redoc" if settings.is_development else None,
        openapi_url="/openapi.json" if settings.is_development else None,
        lifespan=lifespan
    )

    # 配置CORS
    configure_cors(app)

    # 配置限流
    app.state.limiter = limiter

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        return JSONResponse(
            status_code=429,
            content={
                "success": False,
                "message": "请求过于频繁，请稍后再试",
                "detail": str(exc.detail)
            }
        )

    # 添加中间件
    app.add_middleware(ErrorHandlingMiddleware)
    app.add_middleware(RequestLoggingMiddleware)

    # 注册API路由
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    # 健康检查端点（含数据库连通性检测）
    @app.get("/health", tags=["健康检查"])
    async def health_check():
        """健康检查端点"""
        db_ok = True
        try:
            from app.db.session import SessionLocal
            from sqlalchemy import text
            db = SessionLocal()
            db.execute(text("SELECT 1"))
            db.close()
        except Exception:
            db_ok = False

        return {
            "status": "healthy" if db_ok else "degraded",
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
            "database": "connected" if db_ok else "disconnected"
        }

    # 全局异常处理器（不泄露内部错误详情）
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """全局异常处理"""
        logger.exception(f"Global exception: {type(exc).__name__}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Internal server error",
                "detail": "An error occurred"
            }
        )

    return app


# 创建应用实例
app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.is_development
    )
