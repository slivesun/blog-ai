"""
标签API端点
提供标签的CRUD操作
"""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.article import Tag
from app.schemas.article import TagCreate, TagResponse
from app.schemas.common import DataResponse
from app.core.dependencies import require_admin
from app.utils.slug import slugify


router = APIRouter()


@router.get("", response_model=DataResponse[List[TagResponse]])
async def get_tags(
    db: Session = Depends(get_db)
):
    """
    获取标签列表

    参数:
        db: 数据库会话

    返回:
        DataResponse: 标签列表
    """
    tags = db.query(Tag).order_by(Tag.name).all()

    return DataResponse(
        data=[TagResponse.model_validate(tag) for tag in tags]
    )


@router.post("", response_model=DataResponse[TagResponse], status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag_data: TagCreate,
    current_user: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db)
):
    """
    创建标签

    参数:
        tag_data: 标签创建数据
        db: 数据库会话
        current_user: 当前认证用户

    返回:
        DataResponse: 创建的标签
    """
    # 生成 slug
    slug = slugify(tag_data.name)

    # 检查是否已存在同名标签
    if db.query(Tag).filter(Tag.name == tag_data.name).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag with this name already exists"
        )

    if db.query(Tag).filter(Tag.slug == slug).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag with this slug already exists"
        )

    # 创建标签
    tag = Tag(
        name=tag_data.name,
        slug=slug
    )

    db.add(tag)
    db.commit()
    db.refresh(tag)

    return DataResponse(data=TagResponse.model_validate(tag))


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: int,
    current_user: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db)
):
    """
    删除标签

    参数:
        tag_id: 标签ID
        db: 数据库会话
        current_user: 当前认证用户

    异常:
        HTTPException: 标签不存在或无权限
    """
    tag = db.query(Tag).filter(Tag.id == tag_id).first()

    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )

    db.delete(tag)
    db.commit()
