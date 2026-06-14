"""
评论模型
定义评论数据结构，包括评论内容、嵌套回复和关联关系
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.utils.datetime import utcnow


class Comment(Base):
    """
    评论模型
    支持嵌套回复，存储文章评论信息
    """
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    content = Column(Text, nullable=False, comment="评论内容")
    article_id = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"), nullable=False, comment="文章ID")
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="评论者ID")
    parent_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True, comment="父评论ID(用于嵌套)")
    is_deleted = Column(Boolean, default=False, comment="是否删除(软删除)")
    created_at = Column(DateTime, default=utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, comment="更新时间")

    # 关联关系
    article = relationship("Article", back_populates="comments")
    author = relationship("User", back_populates="comments")
    parent = relationship("Comment", remote_side=[id], backref="replies")  # 自关联用于嵌套评论

    def __repr__(self) -> str:
        return f"<Comment(id={self.id}, article_id={self.article_id})>"
