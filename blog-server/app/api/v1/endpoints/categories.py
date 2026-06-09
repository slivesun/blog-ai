"""
分类API端点
提供分类的CRUD操作
"""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.article import Category
from app.schemas.article import CategoryCreate, CategoryUpdate, CategoryResponse
from app.schemas.common import DataResponse
from app.core.dependencies import require_admin
from app.utils.slug import slugify


router = APIRouter()


@router.get("", response_model=DataResponse[List[CategoryResponse]])
async def get_categories(
    db: Session = Depends(get_db)
):
    """
    获取分类列表

    参数:
        db: 数据库会话

    返回:
        DataResponse: 分类列表
    """
    categories = db.query(Category).order_by(Category.sort_order, Category.name).all()

    return DataResponse(
        data=[CategoryResponse.model_validate(cat) for cat in categories]
    )


@router.get("/{category_id}", response_model=DataResponse[CategoryResponse])
async def get_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    """
    获取分类详情

    参数:
        category_id: 分类ID
        db: 数据库会话

    返回:
        DataResponse: 分类详情

    异常:
        HTTPException: 分类不存在
    """
    category = db.query(Category).filter(Category.id == category_id).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    return DataResponse(data=CategoryResponse.model_validate(category))


@router.post("", response_model=DataResponse[CategoryResponse], status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    current_user: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db)
):
    """
    创建分类

    参数:
        category_data: 分类创建数据
        db: 数据库会话
        current_user: 当前认证用户

    返回:
        DataResponse: 创建的分类

    异常:
        HTTPException: 只有管理员可以创建分类
    """
    # 生成 slug
    slug = slugify(category_data.name)

    # 检查是否已存在同名分类
    if db.query(Category).filter(Category.name == category_data.name).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists"
        )

    if db.query(Category).filter(Category.slug == slug).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this slug already exists"
        )

    # 创建分类
    category = Category(
        name=category_data.name,
        slug=slug,
        description=category_data.description,
        color=category_data.color
    )

    db.add(category)
    db.commit()
    db.refresh(category)

    return DataResponse(data=CategoryResponse.model_validate(category))


@router.put("/{category_id}", response_model=DataResponse[CategoryResponse])
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    current_user: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db)
):
    """
    更新分类

    参数:
        category_id: 分类ID
        category_data: 分类更新数据
        db: 数据库会话
        current_user: 当前认证用户

    返回:
        DataResponse: 更新后的分类

    异常:
        HTTPException: 分类不存在或无权限
    """
    category = db.query(Category).filter(Category.id == category_id).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    # 更新字段
    update_data = category_data.model_dump(exclude_unset=True)

    # 如果更新了名称，需要更新 slug
    if "name" in update_data and update_data["name"] != category.name:
        new_slug = slugify(update_data["name"])
        # 检查 slug 是否冲突
        if db.query(Category).filter(Category.slug == new_slug, Category.id != category_id).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this slug already exists"
            )
        update_data["slug"] = new_slug

    # 应用更新
    for key, value in update_data.items():
        setattr(category, key, value)

    db.commit()
    db.refresh(category)

    return DataResponse(data=CategoryResponse.model_validate(category))


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    current_user: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db)
):
    """
    删除分类

    参数:
        category_id: 分类ID
        db: 数据库会话
        current_user: 当前认证用户

    异常:
        HTTPException: 分类不存在或无权限
    """
    category = db.query(Category).filter(Category.id == category_id).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    db.delete(category)
    db.commit()
