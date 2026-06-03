"""
通知模式
定义通知的请求和响应数据结构
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class NotificationBase(BaseModel):
    """通知基础模式"""
    title: str = Field(..., max_length=300, description="通知标题")
    description: Optional[str] = Field(None, description="通知描述")
    notification_type: str = Field(default="system", pattern="^(security|sync|interaction|system)$")
    link_to_id: Optional[str] = Field(None, max_length=100, description="关联ID")


class NotificationCreate(NotificationBase):
    """通知创建模式"""
    user_id: int
    is_read: bool = False


class NotificationResponse(NotificationBase):
    """通知响应模式"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    is_read: bool
    created_at: datetime


class NotificationListResponse(BaseModel):
    """通知列表响应"""
    notifications: List[NotificationResponse]
    total: int
    unread_count: int


class NotificationUpdate(BaseModel):
    """通知更新模式"""
    is_read: bool
