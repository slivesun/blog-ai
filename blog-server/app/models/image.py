"""
图片记录模型
用于图片去重，记录已上传图片的 hash 和 URL
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from app.db.session import Base


class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    hash = Column(String(64), unique=True, index=True, nullable=False)
    url = Column(String(500), nullable=False)
    filename = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
