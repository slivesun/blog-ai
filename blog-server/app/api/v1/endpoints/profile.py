"""
用户资料API端点
提供用户资料和设置的CRUD操作
"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.settings import UserSettings
from app.schemas.user import (
    UserResponse, UserUpdate, UserPasswordUpdate, UserSettingsResponse, UserSettingsUpdate
)
from app.schemas.common import DataResponse
from app.core.dependencies import get_current_active_user
from app.core.security import verify_password, get_password_hash


router = APIRouter()


@router.get("", response_model=DataResponse[UserResponse])
async def get_profile(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """
    获取当前用户资料

    参数:
        current_user: 当前认证用户

    返回:
        DataResponse: 用户资料
    """
    return DataResponse(data=UserResponse.model_validate(current_user))


@router.put("", response_model=DataResponse[UserResponse])
async def update_profile(
    profile_data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    更新当前用户资料

    参数:
        profile_data: 资料更新数据
        db: 数据库会话
        current_user: 当前认证用户

    返回:
        DataResponse: 更新后的用户资料
    """
    # 更新字段
    update_data = profile_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)

    return DataResponse(data=UserResponse.model_validate(current_user))


@router.put("/password", response_model=DataResponse)
async def change_password(
    password_data: UserPasswordUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    修改密码

    参数:
        password_data: 密码修改数据
        db: 数据库会话
        current_user: 当前认证用户

    返回:
        DataResponse: 操作成功响应

    异常:
        HTTPException: 旧密码不正确
    """
    # 验证旧密码
    if not verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )

    # 更新密码
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()

    return DataResponse(message="Password changed successfully")


@router.get("/settings", response_model=DataResponse[UserSettingsResponse])
async def get_settings(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    获取用户设置

    参数:
        db: 数据库会话
        current_user: 当前认证用户

    返回:
        DataResponse: 用户设置
    """
    settings_obj = db.query(UserSettings).filter(
        UserSettings.user_id == current_user.id
    ).first()

    if not settings_obj:
        # 如果没有设置，创建默认设置
        settings_obj = UserSettings(user_id=current_user.id)
        db.add(settings_obj)
        db.commit()
        db.refresh(settings_obj)

    return DataResponse(data=UserSettingsResponse.model_validate(settings_obj))


@router.put("/settings", response_model=DataResponse[UserSettingsResponse])
async def update_settings(
    settings_data: UserSettingsUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    更新用户设置

    参数:
        settings_data: 设置更新数据
        db: 数据库会话
        current_user: 当前认证用户

    返回:
        DataResponse: 更新后的用户设置
    """
    settings_obj = db.query(UserSettings).filter(
        UserSettings.user_id == current_user.id
    ).first()

    if not settings_obj:
        # 如果没有设置，创建新设置
        settings_obj = UserSettings(user_id=current_user.id)
        db.add(settings_obj)

    # 更新字段
    update_data = settings_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings_obj, key, value)

    db.commit()
    db.refresh(settings_obj)

    return DataResponse(data=UserSettingsResponse.model_validate(settings_obj))
