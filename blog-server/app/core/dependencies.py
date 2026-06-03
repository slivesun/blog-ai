"""
依赖注入模块
提供 FastAPI 依赖项，如数据库会话、当前用户等
"""
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import verify_access_token


# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"/api/v1/auth/login",
    auto_error=False  # 不自动抛出错误，允许可选认证
)


def get_db() -> Generator[Session, None, None]:
    """
    获取数据库会话
    每次请求创建一个新会话，请求结束后自动关闭

    Yields:
        Session: SQLAlchemy 数据库会话
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    获取当前认证用户

    参数:
        token: OAuth2 令牌（从请求头自动提取）
        db: 数据库会话

    返回:
        Optional[User]: 当前用户，未认证返回 None
    """
    if token is None:
        return None

    user_id = verify_access_token(token)
    if user_id is None:
        return None

    user = db.query(User).filter(User.id == int(user_id)).first()
    return user


async def get_current_active_user(
    current_user: Optional[User] = Depends(get_current_user)
) -> User:
    """
    获取当前已激活的用户（必须认证）

    参数:
        current_user: 当前用户

    返回:
        User: 当前用户

    异常:
        HTTPException: 用户未认证时抛出 401 错误
    """
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


def require_admin(current_user: User = Depends(get_current_active_user)) -> User:
    """
    要求管理员权限

    参数:
        current_user: 当前用户

    返回:
        User: 当前用户

    异常:
        HTTPException: 非管理员用户抛出 403 错误
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user
