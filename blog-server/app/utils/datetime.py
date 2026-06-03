"""
日期时间工具函数
提供日期时间格式化和解析功能
"""
from datetime import datetime, timezone
from typing import Optional


def utcnow() -> datetime:
    """
    获取当前UTC时间（带时区信息）

    返回:
        datetime: 当前UTC时间
    """
    return datetime.now(timezone.utc)


def format_datetime(dt: datetime, format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
    """
    格式化日期时间为字符串

    参数:
        dt: 日期时间对象
        format_str: 格式字符串

    返回:
        str: 格式化后的日期时间字符串
    """
    if dt is None:
        return ""
    return dt.strftime(format_str)


def format_date(dt: datetime) -> str:
    """
    格式化日期为友好格式

    参数:
        dt: 日期时间对象

    返回:
        str: 格式化后的日期字符串

    示例:
        >>> from datetime import datetime
        >>> format_date(datetime(2024, 5, 24))
        'May 24, 2024'
    """
    if dt is None:
        return ""
    return dt.strftime("%b %d, %Y")


def parse_datetime(dt_str: str, format_str: str = "%Y-%m-%d %H:%M:%S") -> Optional[datetime]:
    """
    解析日期时间字符串

    参数:
        dt_str: 日期时间字符串
        format_str: 格式字符串

    返回:
        Optional[datetime]: 解析后的日期时间对象，解析失败返回None
    """
    try:
        return datetime.strptime(dt_str, format_str)
    except (ValueError, TypeError):
        return None
