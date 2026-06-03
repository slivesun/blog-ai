"""
文章API端点
提供文章的CRUD操作、分页、搜索等功能
"""
from datetime import datetime
from typing import Optional, List, Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc

from app.db.session import get_db
from app.models.user import User
from app.models.article import Article, Category, Tag
from app.models.comment import Comment
from app.schemas.article import (
    ArticleCreate, ArticleUpdate, ArticleResponse, ArticleBriefResponse,
    ArticleListResponse, ArticleLikeResponse, CategoryResponse, TagResponse
)
from app.schemas.common import DataResponse, PaginatedResponse
from app.core.dependencies import get_current_user, get_current_active_user
from app.core.config import settings
from app.utils.slug import slugify


router = APIRouter()


def build_article_response(article: Article, include_content: bool = False) -> ArticleResponse:
    """构建文章响应数据"""
    # 获取分类信息
    category_data = None
    if article.category:
        category_data = CategoryResponse(
            id=article.category.id,
            name=article.category.name,
            slug=article.category.slug,
            description=article.category.description,
            color=article.category.color,
            sort_order=article.category.sort_order,
            created_at=article.category.created_at
        )

    # 获取标签信息
    tags_data = [
        TagResponse(
            id=tag.id,
            name=tag.name,
            slug=tag.slug,
            created_at=tag.created_at
        )
        for tag in article.tags
    ]

    # 格式化日期
    date_str = article.published_at.strftime("%b %d, %Y") if article.published_at else article.created_at.strftime("%b %d, %Y")

    return ArticleResponse(
        id=article.id,
        title=article.title,
        slug=article.slug,
        abstract=article.abstract,
        content=article.content if include_content else None,
        cover_image=article.cover_image,
        category_id=article.category_id,
        tag_ids=[tag.id for tag in article.tags],
        author_id=article.author_id,
        author_name=article.author.username if article.author else "Unknown",
        author_role=article.author.role if article.author else None,
        author_avatar=article.author.avatar_url if article.author else None,
        category=category_data,
        tags=tags_data,
        likes=article.likes,
        views=article.views,
        comment_count=len(article.comments),
        is_draft=article.is_draft,
        is_published=article.is_published,
        published_at=article.published_at,
        created_at=article.created_at,
        updated_at=article.updated_at,
        date=date_str
    )


def build_brief_response(article: Article) -> ArticleBriefResponse:
    """构建文章简要响应数据"""
    date_str = article.published_at.strftime("%b %d, %Y") if article.published_at else article.created_at.strftime("%b %d, %Y")

    return ArticleBriefResponse(
        id=article.id,
        title=article.title,
        slug=article.slug,
        abstract=article.abstract,
        cover_image=article.cover_image,
        category=article.category.name if article.category else None,
        author_name=article.author.username if article.author else "Unknown",
        author_avatar=article.author.avatar_url if article.author else None,
        likes=article.likes,
        comment_count=len(article.comments),
        date=date_str,
        is_draft=article.is_draft
    )


@router.get("", response_model=DataResponse[ArticleListResponse])
async def get_articles(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    category_id: Optional[int] = Query(None, description="分类ID"),
    tag_id: Optional[int] = Query(None, description="标签ID"),
    author_id: Optional[int] = Query(None, description="作者ID"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    sort_by: str = Query("created_at", pattern="^(created_at|published_at|likes|views)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    include_drafts: bool = Query(False, description="包含草稿"),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    获取文章列表

    参数:
        db: 数据库会话
        page: 页码
        page_size: 每页数量
        category_id: 分类ID筛选
        tag_id: 标签ID筛选
        author_id: 作者ID筛选
        search: 搜索关键词
        sort_by: 排序字段
        sort_order: 排序方向
        include_drafts: 是否包含草稿
        current_user: 当前用户（可选）

    返回:
        DataResponse: 文章列表响应
    """
    query = db.query(Article)

    # 过滤已发布的文章
    if not include_drafts or not current_user:
        query = query.filter(Article.is_published == True)
    elif current_user and not current_user.is_admin:
        # 非管理员只能看自己的草稿
        query = query.filter(
            (Article.is_published == True) |
            ((Article.is_draft == True) & (Article.author_id == current_user.id))
        )

    # 应用筛选条件
    if category_id:
        query = query.filter(Article.category_id == category_id)

    if tag_id:
        query = query.filter(Article.tags.any(Tag.id == tag_id))

    if author_id:
        query = query.filter(Article.author_id == author_id)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Article.title.ilike(search_pattern)) |
            (Article.abstract.ilike(search_pattern))
        )

    # 排序
    sort_column = getattr(Article, sort_by)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    # 计算总数
    total = query.count()

    # 分页
    offset = (page - 1) * page_size
    articles = query.offset(offset).limit(page_size).all()

    # 计算总页数
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    # 构建响应
    article_list = [build_brief_response(article) for article in articles]

    return DataResponse(
        data=ArticleListResponse(
            articles=article_list,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    )


@router.get("/{article_id}", response_model=DataResponse[ArticleResponse])
async def get_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    获取文章详情

    参数:
        article_id: 文章ID
        db: 数据库会话
        current_user: 当前用户（可选）

    返回:
        DataResponse: 文章详情

    异常:
        HTTPException: 文章不存在或无权限访问
    """
    article = db.query(Article).filter(Article.id == article_id).first()

    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )

    # 检查权限
    if article.is_draft and article.is_published == False:
        if not current_user or (current_user.id != article.author_id and not current_user.is_admin):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Article not found"
            )

    # 增加浏览数
    article.views += 1
    db.commit()

    return DataResponse(data=build_article_response(article, include_content=True))


@router.post("", response_model=DataResponse[ArticleResponse], status_code=status.HTTP_201_CREATED)
async def create_article(
    article_data: ArticleCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    创建文章

    参数:
        article_data: 文章创建数据
        db: 数据库会话
        current_user: 当前认证用户

    返回:
        DataResponse: 创建的文章
    """
    # 生成唯一 slug
    base_slug = slugify(article_data.title)
    slug = base_slug
    counter = 1
    while db.query(Article).filter(Article.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    # 创建文章
    article = Article(
        title=article_data.title,
        slug=slug,
        abstract=article_data.abstract,
        content=article_data.content,
        cover_image=article_data.cover_image,
        category_id=article_data.category_id,
        author_id=current_user.id,
        is_draft=article_data.is_draft,
        is_published=not article_data.is_draft,
        published_at=datetime.utcnow() if not article_data.is_draft else None
    )

    # 添加标签
    if article_data.tag_ids:
        tags = db.query(Tag).filter(Tag.id.in_(article_data.tag_ids)).all()
        article.tags = tags

    db.add(article)
    db.commit()
    db.refresh(article)

    return DataResponse(data=build_article_response(article, include_content=True))


@router.put("/{article_id}", response_model=DataResponse[ArticleResponse])
async def update_article(
    article_id: int,
    article_data: ArticleUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    更新文章

    参数:
        article_id: 文章ID
        article_data: 文章更新数据
        db: 数据库会话
        current_user: 当前认证用户

    返回:
        DataResponse: 更新后的文章

    异常:
        HTTPException: 文章不存在或无权限
    """
    article = db.query(Article).filter(Article.id == article_id).first()

    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )

    # 检查权限
    if article.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this article"
        )

    # 更新字段
    update_data = article_data.model_dump(exclude_unset=True)

    # 如果更新了标题，需要更新 slug
    if "title" in update_data and update_data["title"] != article.title:
        base_slug = slugify(update_data["title"])
        slug = base_slug
        counter = 1
        while db.query(Article).filter(Article.slug == slug, Article.id != article_id).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        update_data["slug"] = slug

    # 处理标签更新
    if "tag_ids" in update_data:
        tag_ids = update_data.pop("tag_ids")
        if tag_ids is not None:
            tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
            article.tags = tags

    # 处理发布状态变更
    if "is_draft" in update_data or "is_published" in update_data:
        is_published = update_data.get("is_published", article.is_published)
        is_draft = update_data.get("is_draft", article.is_draft)
        if not is_draft and is_published and article.published_at is None:
            update_data["published_at"] = datetime.utcnow()

    # 应用更新
    for key, value in update_data.items():
        if key != "tag_ids":
            setattr(article, key, value)

    db.commit()
    db.refresh(article)

    return DataResponse(data=build_article_response(article, include_content=True))


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    article_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    删除文章

    参数:
        article_id: 文章ID
        db: 数据库会话
        current_user: 当前认证用户

    异常:
        HTTPException: 文章不存在或无权限
    """
    article = db.query(Article).filter(Article.id == article_id).first()

    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )

    # 检查权限
    if article.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this article"
        )

    db.delete(article)
    db.commit()


@router.post("/{article_id}/like", response_model=DataResponse[ArticleLikeResponse])
async def like_article(
    article_id: int,
    db: Session = Depends(get_db)
):
    """
    点赞文章

    参数:
        article_id: 文章ID
        db: 数据库会话

    返回:
        DataResponse: 点赞后的文章点赞数

    异常:
        HTTPException: 文章不存在
    """
    article = db.query(Article).filter(Article.id == article_id).first()

    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )

    article.likes += 1
    db.commit()

    return DataResponse(
        data=ArticleLikeResponse(article_id=article.id, likes=article.likes)
    )
