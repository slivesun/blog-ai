"""
认证模式
定义认证相关的请求和响应数据结构
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    """
    登录请求模式

    参数:
        username: 用户名或邮箱
        password: 密码
    """
    username: str = Field(..., description="用户名或邮箱")
    password: str = Field(..., description="密码")


class RegisterRequest(BaseModel):
    """
    注册请求模式

    参数:
        username: 用户名
        email: 邮箱
        password: 密码
    """
    username: str = Field(..., min_length=3, max_length=50, description="用户名")
    email: EmailStr = Field(..., description="邮箱")
    password: str = Field(..., min_length=6, max_length=100, description="密码")


class TokenResponse(BaseModel):
    """
    令牌响应模式

    参数:
        access_token: 访问令牌
        token_type: 令牌类型
        expires_in: 过期时间
    """
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class AuthResponse(BaseModel):
    """
    认证响应模式

    参数:
        user: 用户信息
        token: 令牌信息
    """
    user: UserResponse
    token: TokenResponse


class RefreshTokenRequest(BaseModel):
    """刷新令牌请求"""
    refresh_token: str


class PasswordResetRequest(BaseModel):
    """密码重置请求"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """密码重置确认"""
    token: str
    new_password: str = Field(..., min_length=6, max_length=100)
