"""
文章模式
定义文章的请求和响应数据结构
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class TagBase(BaseModel):
    """标签基础模式"""
    name: str = Field(..., min_length=1, max_length=50, description="标签名称")


class TagCreate(TagBase):
    """标签创建模式"""
    pass


class TagResponse(TagBase):
    """标签响应模式"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    created_at: datetime


class CategoryBase(BaseModel):
    """分类基础模式"""
    name: str = Field(..., min_length=1, max_length=100, description="分类名称")
    description: Optional[str] = None
    color: Optional[str] = Field("#6366f1", max_length=20)


class CategoryCreate(CategoryBase):
    """分类创建模式"""
    pass


class CategoryUpdate(BaseModel):
    """分类更新模式"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    color: Optional[str] = Field(None, max_length=20)
    sort_order: Optional[int] = None


class CategoryResponse(CategoryBase):
    """分类响应模式"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    sort_order: int
    created_at: datetime


class CommentBase(BaseModel):
    """评论基础模式"""
    content: str = Field(..., min_length=1, description="评论内容")


class CommentCreate(CommentBase):
    """评论创建模式"""
    parent_id: Optional[int] = None


class CommentResponse(CommentBase):
    """评论响应模式"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    article_id: int
    author_id: int
    author_name: str
    author_avatar: Optional[str] = None
    parent_id: Optional[int] = None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    replies: List["CommentResponse"] = []


class CommentUpdate(BaseModel):
    """评论更新模式"""
    content: str = Field(..., min_length=1)


class ArticleBase(BaseModel):
    """文章基础模式"""
    title: str = Field(..., min_length=1, max_length=300, description="文章标题")
    abstract: Optional[str] = Field(None, description="文章摘要")
    content: Optional[str] = Field(None, description="文章内容")
    cover_image: Optional[str] = Field(None, max_length=500, description="封面图片URL")
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = []
    is_draft: bool = False


class ArticleCreate(ArticleBase):
    """文章创建模式"""
    pass


class ArticleUpdate(BaseModel):
    """文章更新模式"""
    title: Optional[str] = Field(None, min_length=1, max_length=300)
    abstract: Optional[str] = None
    content: Optional[str] = None
    cover_image: Optional[str] = Field(None, max_length=500)
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = None
    is_draft: Optional[bool] = None
    is_published: Optional[bool] = None


class ArticleResponse(ArticleBase):
    """文章响应模式"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    author_id: int
    author_name: str
    author_role: Optional[str] = None
    author_avatar: Optional[str] = None
    category: Optional[CategoryResponse] = None
    tags: List[TagResponse] = []
    likes: int
    views: int
    comment_count: int = 0
    is_draft: bool
    is_published: bool
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class ArticleBriefResponse(BaseModel):
    """文章简要信息响应"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    abstract: Optional[str] = None
    cover_image: Optional[str] = None
    category: Optional[str] = None
    author_name: str
    author_avatar: Optional[str] = None
    likes: int
    comment_count: int = 0
    date: str
    is_draft: bool


class ArticleListResponse(BaseModel):
    """文章列表响应"""
    articles: List[ArticleBriefResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ArticleLikeResponse(BaseModel):
    """文章点赞响应"""
    article_id: int
    likes: int


# 解决前向引用
CommentResponse.model_rebuild()
