"""
笔记模式
定义笔记的请求和响应数据结构
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class NoteBase(BaseModel):
    """笔记基础模式"""
    title: str = Field(..., min_length=1, max_length=300, description="笔记标题")
    content: str = Field(..., description="笔记内容")
    category: str = Field(default="General", max_length=100, description="笔记分类")
    tags: Optional[str] = Field(None, max_length=500, description="标签，逗号分隔")


class NoteCreate(NoteBase):
    """笔记创建模式"""
    pass


class NoteUpdate(BaseModel):
    """笔记更新模式"""
    title: Optional[str] = Field(None, min_length=1, max_length=300)
    content: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    tags: Optional[str] = Field(None, max_length=500)


class NoteResponse(NoteBase):
    """笔记响应模式"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    author_id: int
    author_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class NoteListResponse(BaseModel):
    """笔记列表响应"""
    notes: List[NoteResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
