"""
用户模式
定义用户的请求和响应数据结构
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class UserBase(BaseModel):
    """用户基础模式"""
    username: str = Field(..., min_length=3, max_length=50, description="用户名")
    nickname: Optional[str] = Field(None, max_length=100, description="昵称")
    email: str = Field(..., description="邮箱地址")
    full_name: Optional[str] = Field(None, max_length=100, description="真实姓名")
    bio: Optional[str] = Field(None, description="个人简介")
    avatar_url: Optional[str] = Field(None, max_length=500, description="头像URL")
    github_url: Optional[str] = Field(None, max_length=500, description="GitHub主页")


class UserCreate(UserBase):
    """用户创建模式"""
    password: str = Field(..., min_length=6, max_length=100, description="密码")


class UserUpdate(BaseModel):
    """用户更新模式"""
    nickname: Optional[str] = Field(None, max_length=100, description="昵称")
    full_name: Optional[str] = Field(None, max_length=100, description="真实姓名")
    bio: Optional[str] = Field(None, description="个人简介")
    avatar_url: Optional[str] = Field(None, max_length=500, description="头像URL")
    github_url: Optional[str] = Field(None, max_length=500, description="GitHub主页")


class UserPasswordUpdate(BaseModel):
    """密码更新模式"""
    old_password: str = Field(..., description="旧密码")
    new_password: str = Field(..., min_length=6, max_length=100, description="新密码")


class UserResponse(UserBase):
    """用户响应模式"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    is_active: bool
    is_admin: bool
    created_at: datetime
    last_login: Optional[datetime] = None


class UserBriefResponse(BaseModel):
    """用户简要信息响应"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    nickname: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str


class UserListResponse(BaseModel):
    """用户列表响应"""
    users: List[UserResponse]
    total: int


class UserSettingsBase(BaseModel):
    """用户设置基础模式"""
    allow_notifications: bool = True
    allow_comments: bool = True
    theme_accent: str = Field(default="cyan", pattern="^(cyan|violet|amber|emerald)$")
    high_density_layout: bool = False
    language: str = Field(default="zh", pattern="^(zh|en)$")


class UserSettingsUpdate(UserSettingsBase):
    """用户设置更新模式"""
    pass


class UserSettingsResponse(UserSettingsBase):
    """用户设置响应模式"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
