"""
笔记模型
定义系统笔记数据结构，用于存储开发文档、技术备忘等
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.utils.datetime import utcnow


class Note(Base):
    """
    笔记模型
    存储系统架构文档、设计原则、代码片段等
    """
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(300), nullable=False, index=True, comment="笔记标题")
    slug = Column(String(350), unique=True, nullable=False, index=True, comment="URL友好标题")
    content = Column(Text, nullable=False, comment="笔记内容(Markdown)")
    category = Column(String(100), default="General", comment="笔记分类")
    tags = Column(String(500), nullable=True, comment="标签，逗号分隔")
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="作者ID")
    created_at = Column(DateTime, default=utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, comment="更新时间")

    # 关联关系
    author = relationship("User", back_populates="notes")

    def __repr__(self) -> str:
        return f"<Note(id={self.id}, title='{self.title[:30]}...')>"
