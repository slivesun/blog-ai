"""
通知模型
定义系统通知数据结构，用于用户通知消息
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.utils.datetime import utcnow


class Notification(Base):
    """
    通知模型
    存储用户通知消息，如安全更新、同步状态、互动通知等
    """
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="用户ID")
    title = Column(String(300), nullable=False, comment="通知标题")
    description = Column(Text, nullable=True, comment="通知描述")
    notification_type = Column(String(50), default="system", comment="通知类型: security/sync/interaction/system")
    link_to_id = Column(String(100), nullable=True, comment="关联ID(如文章ID)")
    is_read = Column(Boolean, default=False, comment="是否已读")
    created_at = Column(DateTime, default=utcnow, comment="创建时间")

    # 关联关系
    user = relationship("User", back_populates="notifications")

    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, user_id={self.user_id}, type='{self.notification_type}')>"
