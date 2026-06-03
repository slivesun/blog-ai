"""
文章模型
定义文章数据结构，包括文章内容、分类、标签和关联关系
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.db.session import Base


# 文章-标签关联表
article_tags = Table(
    "article_tags",
    Base.metadata,
    Column("article_id", Integer, ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
)


class Category(Base):
    """
    分类模型
    用于对文章进行分类，如 Engineering、Design、Security、Systems
    """
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True, comment="分类名称")
    slug = Column(String(100), unique=True, nullable=False, index=True, comment="URL友好名称")
    description = Column(Text, nullable=True, comment="分类描述")
    color = Column(String(20), default="#6366f1", comment="分类颜色")
    sort_order = Column(Integer, default=0, comment="排序顺序")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")

    # 关联关系
    articles = relationship("Article", back_populates="category")

    def __repr__(self) -> str:
        return f"<Category(id={self.id}, name='{self.name}')>"


class Tag(Base):
    """
    标签模型
    用于对文章打标签，支持多对多关联
    """
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False, index=True, comment="标签名称")
    slug = Column(String(50), unique=True, nullable=False, index=True, comment="URL友好名称")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")

    # 关联关系
    articles = relationship("Article", secondary=article_tags, back_populates="tags")

    def __repr__(self) -> str:
        return f"<Tag(id={self.id}, name='{self.name}')>"


class Article(Base):
    """
    文章模型
    存储博客文章内容、摘要、封面图等信息
    """
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(300), nullable=False, index=True, comment="文章标题")
    slug = Column(String(350), unique=True, nullable=False, index=True, comment="URL友好标题")
    abstract = Column(Text, nullable=True, comment="文章摘要")
    content = Column(Text, nullable=True, comment="文章内容(Markdown)")
    cover_image = Column(String(500), nullable=True, comment="封面图片URL")
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, comment="分类ID")
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="作者ID")
    likes = Column(Integer, default=0, comment="点赞数")
    views = Column(Integer, default=0, comment="浏览数")
    is_draft = Column(Boolean, default=False, comment="是否为草稿")
    is_published = Column(Boolean, default=True, comment="是否发布")
    published_at = Column(DateTime, nullable=True, comment="发布时间")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")

    # 关联关系
    author = relationship("User", back_populates="articles")
    category = relationship("Category", back_populates="articles")
    tags = relationship("Tag", secondary=article_tags, back_populates="articles")
    comments = relationship("Comment", back_populates="article", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Article(id={self.id}, title='{self.title[:30]}...')>"
