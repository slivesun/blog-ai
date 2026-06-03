"""
通知API端点
提供通知的CRUD操作
"""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import (
    NotificationCreate, NotificationResponse, NotificationListResponse, NotificationUpdate
)
from app.schemas.common import DataResponse
from app.core.dependencies import get_current_active_user


router = APIRouter()


@router.get("", response_model=DataResponse[NotificationListResponse])
async def get_notifications(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    获取当前用户的通知列表

    参数:
        db: 数据库会话
        current_user: 当前认证用户

    返回:
        DataResponse: 通知列表
    """
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()

    unread_count = sum(1 for n in notifications if not n.is_read)

    return DataResponse(
        data=NotificationListResponse(
            notifications=[NotificationResponse.model_validate(n) for n in notifications],
            total=len(notifications),
            unread_count=unread_count
        )
    )


@router.put("/{notification_id}/read", response_model=DataResponse[NotificationResponse])
async def mark_notification_read(
    notification_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    标记通知为已读

    参数:
        notification_id: 通知ID
        db: 数据库会话
        current_user: 当前认证用户

    返回:
        DataResponse: 更新后的通知

    异常:
        HTTPException: 通知不存在或无权限
    """
    notification = db.query(Notification).filter(Notification.id == notification_id).first()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    # 检查权限
    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this notification"
        )

    notification.is_read = True
    db.commit()
    db.refresh(notification)

    return DataResponse(data=NotificationResponse.model_validate(notification))


@router.put("/read-all", response_model=DataResponse)
async def mark_all_notifications_read(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    标记所有通知为已读

    参数:
        db: 数据库会话
        current_user: 当前认证用户

    返回:
        DataResponse: 操作成功响应
    """
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()

    return DataResponse(message="All notifications marked as read")


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    删除通知

    参数:
        notification_id: 通知ID
        db: 数据库会话
        current_user: 当前认证用户

    异常:
        HTTPException: 通知不存在或无权限
    """
    notification = db.query(Notification).filter(Notification.id == notification_id).first()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    # 检查权限
    if notification.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this notification"
        )

    db.delete(notification)
    db.commit()
