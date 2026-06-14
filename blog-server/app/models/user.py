"""
用户模型
定义用户数据结构，包括用户基本信息、认证字段和关联关系
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.utils.datetime import utcnow


class User(Base):
    """
    用户模型
    存储用户账号信息、认证信息和个人资料
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False, comment="用户名")
    nickname = Column(String(100), nullable=True, comment="昵称")
    email = Column(String(255), unique=True, index=True, nullable=False, comment="邮箱")
    hashed_password = Column(String(255), nullable=False, comment="哈希密码")
    full_name = Column(String(100), nullable=True, comment="真实姓名")
    bio = Column(Text, nullable=True, comment="个人简介")
    avatar_url = Column(String(500), nullable=True, comment="头像URL")
    github_url = Column(String(500), nullable=True, comment="GitHub主页")
    role = Column(String(50), default="user", comment="角色: user/admin")
    is_active = Column(Boolean, default=True, comment="是否激活")
    is_admin = Column(Boolean, default=False, comment="是否管理员")
    created_at = Column(DateTime, default=utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, comment="更新时间")
    last_login = Column(DateTime, nullable=True, comment="最后登录时间")

    # 关联关系
    articles = relationship("Article", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="author", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    user_settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}')>"
