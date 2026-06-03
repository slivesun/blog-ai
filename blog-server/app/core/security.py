"""
安全模块
负责密码哈希、JWT令牌等安全相关功能
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from .config import settings


# 密码哈希上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    验证密码是否正确

    参数:
        plain_password: 明文密码
        hashed_password: 哈希后的密码

    返回:
        bool: 密码是否匹配
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    对密码进行哈希

    参数:
        password: 明文密码

    返回:
        str: 哈希后的密码
    """
    return pwd_context.hash(password)


def create_access_token(
    subject: str,
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[dict] = None
) -> str:
    """
    创建访问令牌

    参数:
        subject: 令牌主题（通常是用户ID）
        expires_delta: 过期时间增量
        extra_claims: 额外的声明

    返回:
        str: 编码后的 JWT 令牌
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access"
    }
    if extra_claims:
        to_encode.update(extra_claims)

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(
    subject: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    创建刷新令牌

    参数:
        subject: 令牌主题（通常是用户ID）
        expires_delta: 过期时间增量

    返回:
        str: 编码后的刷新令牌
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh"
    }

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> Optional[dict[str, Any]]:
    """
    解码并验证令牌

    参数:
        token: JWT 令牌字符串

    返回:
        Optional[dict]: 解码后的 payload，失败返回 None
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def verify_access_token(token: str) -> Optional[str]:
    """
    验证访问令牌并返回主题

    参数:
        token: JWT 令牌字符串

    返回:
        Optional[str]: 用户ID，失败返回 None
    """
    payload = decode_token(token)
    if payload is None:
        return None
    if payload.get("type") != "access":
        return None
    return payload.get("sub")
