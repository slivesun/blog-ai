"""
评论API端点
提供评论的CRUD操作
"""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.article import Article
from app.models.comment import Comment
from app.schemas.article import CommentCreate, CommentUpdate, CommentResponse
from app.schemas.common import DataResponse, PaginatedResponse
from app.core.dependencies import get_current_user, get_current_active_user


router = APIRouter()


def build_comment_response(comment: Comment, include_replies: bool = False) -> CommentResponse:
    """构建评论响应数据"""
    replies = []
    if include_replies and comment.replies:
        replies = [build_comment_response(reply, include_replies=True) for reply in comment.replies if not reply.is_deleted]

    return CommentResponse(
        id=comment.id,
        content=comment.content,
        article_id=comment.article_id,
        author_id=comment.author_id,
        author_name=comment.author.username if comment.author else "Unknown",
        author_avatar=comment.author.avatar_url if comment.author else None,
        parent_id=comment.parent_id,
        is_deleted=comment.is_deleted,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        replies=replies
    )


@router.get("/article/{article_id}", response_model=DataResponse[List[CommentResponse]])
async def get_article_comments(
    article_id: int,
    db: Session = Depends(get_db),
    include_replies: bool = Query(True, description="包含嵌套回复")
):
    """
    获取文章的评论列表

    参数:
        article_id: 文章ID
        db: 数据库会话
        include_replies: 是否包含嵌套回复

    返回:
        DataResponse: 评论列表
    """
    # 检查文章是否存在
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )

    # 获取顶级评论（没有父评论的评论）
    comments = db.query(Comment).filter(
        Comment.article_id == article_id,
        Comment.parent_id == None,
        Comment.is_deleted == False
    ).order_by(Comment.created_at.desc()).all()

    return DataResponse(
        data=[build_comment_response(comment, include_replies=include_replies) for comment in comments]
    )


@router.post("/article/{article_id}", response_model=DataResponse[CommentResponse], status_code=status.HTTP_201_CREATED)
async def create_comment(
    article_id: int,
    comment_data: CommentCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    创建评论

    参数:
        article_id: 文章ID
        comment_data: 评论创建数据
        db: 数据库会话
        current_user: 当前认证用户

    返回:
        DataResponse: 创建的评论

    异常:
        HTTPException: 文章不存在或无权限
    """
    # 检查文章是否存在
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )

    # 检查父评论是否存在
    if comment_data.parent_id:
        parent_comment = db.query(Comment).filter(
            Comment.id == comment_data.parent_id,
            Comment.article_id == article_id
        ).first()
        if not parent_comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent comment not found"
            )

    # 创建评论
    comment = Comment(
        content=comment_data.content,
        article_id=article_id,
        author_id=current_user.id,
        parent_id=comment_data.parent_id
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    return DataResponse(data=build_comment_response(comment))


@router.put("/{comment_id}", response_model=DataResponse[CommentResponse])
async def update_comment(
    comment_id: int,
    comment_data: CommentUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    更新评论

    参数:
        comment_id: 评论ID
        comment_data: 评论更新数据
        db: 数据库会话
        current_user: 当前认证用户

    返回:
        DataResponse: 更新后的评论

    异常:
        HTTPException: 评论不存在或无权限
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    # 检查权限
    if comment.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this comment"
        )

    # 更新评论内容
    comment.content = comment_data.content
    db.commit()
    db.refresh(comment)

    return DataResponse(data=build_comment_response(comment))


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    删除评论（软删除）

    参数:
        comment_id: 评论ID
        db: 数据库会话
        current_user: 当前认证用户

    异常:
        HTTPException: 评论不存在或无权限
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    # 检查权限
    if comment.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment"
        )

    # 软删除
    comment.is_deleted = True
    db.commit()
