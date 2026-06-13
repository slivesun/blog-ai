"""
认证API端点
提供用户注册、登录、登出等认证功能
"""
from datetime import datetime, timezone
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.db.session import get_db
from app.models.user import User
from app.models.settings import UserSettings
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, AuthResponse
from app.schemas.user import UserResponse, UserSettingsResponse
from app.schemas.common import DataResponse
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    verify_access_token
)
from app.core.dependencies import get_current_user, get_current_active_user
from app.core.config import settings

# 登录接口限流器
limiter = Limiter(key_func=get_remote_address)


router = APIRouter()


@router.post("/register", response_model=DataResponse[AuthResponse], status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def register(
    request: Request,
    register_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    用户注册

    参数:
        request: 注册请求参数
        db: 数据库会话

    返回:
        DataResponse: 包含用户信息和令牌

    异常:
        HTTPException: 用户名或邮箱已存在
    """
    # 检查用户名是否存在
    if db.query(User).filter(User.username == register_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    # 检查邮箱是否存在
    if db.query(User).filter(User.email == register_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # 创建用户
    hashed_password = get_password_hash(register_data.password)
    user = User(
        username=register_data.username,
        nickname=register_data.username,
        email=register_data.email,
        hashed_password=hashed_password,
        full_name=request.username,
        role="user",
        is_active=True,
        is_admin=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 创建用户默认设置
    user_settings = UserSettings(user_id=user.id)
    db.add(user_settings)
    db.commit()

    # 生成访问令牌
    access_token = create_access_token(subject=str(user.id))

    # 构建响应
    user_response = UserResponse.model_validate(user)
    token_response = TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    return DataResponse(
        data=AuthResponse(user=user_response, token=token_response)
    )


@router.post("/login", response_model=DataResponse[AuthResponse])
@limiter.limit("5/minute")
async def login(
    request: Request,
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    用户登录

    参数:
        request: 登录请求参数
        db: 数据库会话

    返回:
        DataResponse: 包含用户信息和令牌

    异常:
        HTTPException: 用户名或密码错误
    """
    # 查找用户（支持用户名或邮箱）
    user = db.query(User).filter(
        (User.username == login_data.username) | (User.email == login_data.username)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 验证密码
    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 检查用户是否激活
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )

    # 更新最后登录时间
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    # 生成访问令牌
    access_token = create_access_token(subject=str(user.id))

    # 构建响应
    user_response = UserResponse.model_validate(user)
    token_response = TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    return DataResponse(
        data=AuthResponse(user=user_response, token=token_response)
    )


@router.post("/login/form", response_model=DataResponse[AuthResponse])
@limiter.limit("5/minute")
async def login_form(
    request: Request,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db)
):
    """
    OAuth2 密码表单登录

    参数:
        form_data: OAuth2 密码表单
        db: 数据库会话

    返回:
        DataResponse: 包含用户信息和令牌
    """
    # 查找用户
    user = db.query(User).filter(
        (User.username == form_data.username) | (User.email == form_data.username)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 验证密码
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 检查用户是否激活
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )

    # 更新最后登录时间
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    # 生成访问令牌
    access_token = create_access_token(subject=str(user.id))

    # 构建响应
    user_response = UserResponse.model_validate(user)
    token_response = TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    return DataResponse(
        data=AuthResponse(user=user_response, token=token_response)
    )


@router.post("/logout", response_model=DataResponse)
async def logout(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """
    用户登出

    参数:
        current_user: 当前认证用户

    返回:
        DataResponse: 登出成功响应
    """
    # JWT 无状态登出，前端直接删除 token 即可
    # 这里可以做 token 黑名单等额外处理
    return DataResponse(message="Logged out successfully")


@router.get("/me", response_model=DataResponse[UserResponse])
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """
    获取当前用户信息

    参数:
        current_user: 当前认证用户

    返回:
        DataResponse: 当前用户信息
    """
    user_response = UserResponse.model_validate(current_user)
    return DataResponse(data=user_response)


@router.get("/settings", response_model=DataResponse[UserSettingsResponse])
async def get_user_settings(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    获取当前用户设置

    参数:
        current_user: 当前认证用户
        db: 数据库会话

    返回:
        DataResponse: 用户设置信息
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
