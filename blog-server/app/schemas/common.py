"""
通用响应模式
定义标准的 API 响应格式
"""
from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel, Field


T = TypeVar("T")


class ResponseBase(BaseModel):
    """基础响应模型"""
    success: bool = True
    message: str = "Success"


class DataResponse(ResponseBase, Generic[T]):
    """
    带数据的响应模型

    参数:
        success: 是否成功
        message: 响应消息
        data: 数据内容
    """
    data: Optional[T] = None


class ErrorResponse(ResponseBase):
    """
    错误响应模型

    参数:
        success: 是否成功(固定为False)
        message: 错误消息
        error_code: 错误代码(可选)
        detail: 详细错误信息(可选)
    """
    success: bool = False
    error_code: Optional[str] = None
    detail: Optional[str] = None


class PaginatedResponse(ResponseBase, Generic[T]):
    """
    分页响应模型

    参数:
        success: 是否成功
        message: 响应消息
        data: 数据列表
        total: 总数
        page: 当前页
        page_size: 每页大小
        total_pages: 总页数
    """
    data: list[T] = []
    total: int = 0
    page: int = 1
    page_size: int = 20
    total_pages: int = 0


class TokenResponse(BaseModel):
    """
    令牌响应模型

    参数:
        access_token: 访问令牌
        refresh_token: 刷新令牌(可选)
        token_type: 令牌类型
        expires_in: 过期时间(秒)
    """
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int
