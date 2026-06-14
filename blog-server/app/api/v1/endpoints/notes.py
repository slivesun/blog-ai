"""
笔记API端点
提供笔记的CRUD操作
"""
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse, NoteListResponse
from app.schemas.common import DataResponse
from app.core.dependencies import get_current_user, get_current_active_user
from app.core.limiter import limiter
from app.utils.slug import slugify


router = APIRouter()


def build_note_response(note: Note) -> NoteResponse:
    """构建笔记响应数据"""
    return NoteResponse(
        id=note.id,
        title=note.title,
        slug=note.slug,
        content=note.content,
        category=note.category,
        tags=note.tags,
        author_id=note.author_id,
        author_name=(note.author.nickname or note.author.username) if note.author else None,
        created_at=note.created_at,
        updated_at=note.updated_at
    )


@router.get("", response_model=DataResponse[NoteListResponse])
async def get_notes(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    category: Optional[str] = Query(None, description="分类筛选"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取当前用户的笔记列表

    参数:
        db: 数据库会话
        page: 页码
        page_size: 每页数量
        category: 分类筛选
        search: 搜索关键词
        current_user: 当前认证用户

    返回:
        DataResponse: 笔记列表
    """
    # 只查询当前用户的笔记
    query = db.query(Note).filter(Note.author_id == current_user.id)

    # 分类筛选
    if category:
        query = query.filter(Note.category == category)

    # 搜索（转义 LIKE 通配符）
    if search:
        escaped = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        search_pattern = f"%{escaped}%"
        query = query.filter(
            (Note.title.ilike(search_pattern)) |
            (Note.content.ilike(search_pattern))
        )

    # 排序
    query = query.order_by(Note.updated_at.desc())

    # 计算总数
    total = query.count()

    # 分页
    offset = (page - 1) * page_size
    notes = query.offset(offset).limit(page_size).all()

    # 计算总页数
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return DataResponse(
        data=NoteListResponse(
            notes=[build_note_response(note) for note in notes],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    )


@router.get("/{note_id}", response_model=DataResponse[NoteResponse])
async def get_note(
    note_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    获取笔记详情（仅限笔记所有者或管理员）

    参数:
        note_id: 笔记ID
        db: 数据库会话
        current_user: 当前认证用户

    返回:
        DataResponse: 笔记详情

    异常:
        HTTPException: 笔记不存在或无权限
    """
    note = db.query(Note).filter(Note.id == note_id).first()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )

    # 权限校验：仅笔记所有者或管理员可查看
    if note.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )

    return DataResponse(data=build_note_response(note))


@router.post("", response_model=DataResponse[NoteResponse], status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def create_note(
    note_data: NoteCreate,
    request: Request,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    创建笔记

    参数:
        note_data: 笔记创建数据
        db: 数据库会话
        current_user: 当前认证用户

    返回:
        DataResponse: 创建的笔记
    """
    # 生成唯一 slug
    base_slug = slugify(note_data.title)
    slug = base_slug
    counter = 1
    while db.query(Note).filter(Note.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    # 创建笔记
    note = Note(
        title=note_data.title,
        slug=slug,
        content=note_data.content,
        category=note_data.category,
        tags=note_data.tags,
        author_id=current_user.id
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    return DataResponse(data=build_note_response(note))


@router.put("/{note_id}", response_model=DataResponse[NoteResponse])
async def update_note(
    note_id: int,
    note_data: NoteUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    更新笔记

    参数:
        note_id: 笔记ID
        note_data: 笔记更新数据
        db: 数据库会话
        current_user: 当前认证用户

    返回:
        DataResponse: 更新后的笔记

    异常:
        HTTPException: 笔记不存在或无权限
    """
    note = db.query(Note).filter(Note.id == note_id).first()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )

    # 检查权限
    if note.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this note"
        )

    # 更新字段
    update_data = note_data.model_dump(exclude_unset=True)

    # 如果更新了标题，需要更新 slug
    if "title" in update_data and update_data["title"] != note.title:
        base_slug = slugify(update_data["title"])
        slug = base_slug
        counter = 1
        while db.query(Note).filter(Note.slug == slug, Note.id != note_id).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        update_data["slug"] = slug

    # 应用更新
    for key, value in update_data.items():
        setattr(note, key, value)

    db.commit()
    db.refresh(note)

    return DataResponse(data=build_note_response(note))


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    删除笔记

    参数:
        note_id: 笔记ID
        db: 数据库会话
        current_user: 当前认证用户

    异常:
        HTTPException: 笔记不存在或无权限
    """
    note = db.query(Note).filter(Note.id == note_id).first()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )

    # 检查权限
    if note.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this note"
        )

    db.delete(note)
    db.commit()
