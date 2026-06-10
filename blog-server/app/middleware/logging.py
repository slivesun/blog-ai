"""
日志中间件
配置请求日志记录
"""
import time
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    请求日志中间件
    记录每个HTTP请求的详细信息，包括耗时、状态码等
    """

    async def dispatch(self, request: Request, call_next):
        """
        处理请求并记录日志

        参数:
            request: HTTP请求对象
            call_next: 下一个处理函数

        返回:
            Response: HTTP响应对象
        """
        # 生成请求唯一标识
        request_id = str(uuid.uuid4())[:8]

        # 记录请求开始
        start_time = time.time()

        # 记录请求信息
        logger.info(
            f"[{request_id}] {request.method} {request.url.path} - "
            f"Client: {request.client.host if request.client else 'Unknown'}"
        )

        # 处理请求
        try:
            response = await call_next(request)

            # 计算耗时
            duration = time.time() - start_time

            # 记录响应信息
            logger.info(
                f"[{request_id}] {request.method} {request.url.path} - "
                f"Status: {response.status_code} - "
                f"Duration: {duration:.3f}s"
            )

            # 添加请求ID到响应头
            response.headers["X-Request-ID"] = request_id

            return response

        except Exception as e:
            # 计算耗时
            duration = time.time() - start_time

            # 记录错误信息
            logger.error(
                f"[{request_id}] {request.method} {request.url.path} - "
                f"Error: {str(e)} - "
                f"Duration: {duration:.3f}s"
            )
            raise


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """
    错误处理中间件
    统一处理未捕获的异常
    """

    async def dispatch(self, request: Request, call_next):
        """
        处理请求，捕获异常

        参数:
            request: HTTP请求对象
            call_next: 下一个处理函数

        返回:
            Response: HTTP响应对象
        """
        try:
            return await call_next(request)
        except Exception as e:
            # 记录异常
            logger.exception(f"Unhandled exception: {str(e)}")

            # 返回500错误响应（生产环境隐藏内部错误细节）
            from fastapi.responses import JSONResponse
            from app.core.config import settings as app_settings
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": "Internal server error",
                    "detail": str(e) if app_settings.is_development else "An error occurred"
                }
            )
