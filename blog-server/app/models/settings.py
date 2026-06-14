"""
用户设置模型
定义用户个人设置数据结构
"""
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.utils.datetime import utcnow


class UserSettings(Base):
    """
    用户设置模型
    存储用户的个性化设置，如主题、通知偏好等
    """
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, comment="用户ID")
    allow_notifications = Column(Boolean, default=True, comment="允许通知")
    allow_comments = Column(Boolean, default=True, comment="允许评论")
    theme_accent = Column(String(20), default="cyan", comment="主题色: cyan/violet/amber/emerald")
    high_density_layout = Column(Boolean, default=False, comment="高密度布局")
    language = Column(String(10), default="zh", comment="语言: zh/en")
    skin = Column(String(10), default="dark", comment="皮肤: dark/light")
    created_at = Column(DateTime, default=utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, comment="更新时间")

    # 关联关系
    user = relationship("User", back_populates="user_settings")

    def __repr__(self) -> str:
        return f"<UserSettings(id={self.id}, user_id={self.user_id})>"
