"""
通知API端点
提供通知的CRUD操作
"""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
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


@router.post("", response_model=DataResponse[NotificationResponse], status_code=status.HTTP_201_CREATED)
async def create_notification(
    notification_data: NotificationCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    创建通知（管理员/系统使用）

    参数:
        notification_data: 通知创建数据
        current_user: 当前认证用户
        db: 数据库会话

    返回:
        DataResponse: 创建的通知

    异常:
        HTTPException: 非管理员无权限
    """
    # 仅管理员可创建通知
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can create notifications"
        )

    notification = Notification(
        user_id=notification_data.user_id,
        title=notification_data.title,
        description=notification_data.description,
        notification_type=notification_data.notification_type,
        link_to_id=notification_data.link_to_id,
        is_read=notification_data.is_read
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return DataResponse(data=NotificationResponse.model_validate(notification))


@router.get("", response_model=DataResponse[NotificationListResponse])
async def get_notifications(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量")
):
    """
    获取当前用户的通知列表（分页）

    参数:
        current_user: 当前认证用户
        db: 数据库会话
        page: 页码（默认1）
        page_size: 每页数量（默认20，最大100）

    返回:
        DataResponse: 通知列表
    """
    query = db.query(Notification).filter(
        Notification.user_id == current_user.id
    )

    # 总数和未读数
    total = query.count()
    unread_count = query.filter(Notification.is_read == False).count()

    # 分页查询
    notifications = query.order_by(
        Notification.created_at.desc()
    ).offset((page - 1) * page_size).limit(page_size).all()

    return DataResponse(
        data=NotificationListResponse(
            notifications=[NotificationResponse.model_validate(n) for n in notifications],
            total=total,
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
