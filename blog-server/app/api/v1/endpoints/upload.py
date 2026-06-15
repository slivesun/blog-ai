"""
文件上传API端点
提供图片上传功能（含服务端压缩）
"""
import io
import os
import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, status
from PIL import Image

from app.models.user import User
from app.core.dependencies import get_current_active_user
from app.core.limiter import limiter
from app.schemas.common import DataResponse

router = APIRouter()

# 上传配置（与 main.py 的 StaticFiles 挂载路径一致）
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "uploads", "images")
UPLOAD_DIR = os.path.normpath(UPLOAD_DIR)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB（压缩前）
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}

# 压缩配置
MAX_DIMENSION = 1920       # 长边最大像素
JPEG_QUALITY = 80          # JPEG 压缩质量


def compress_image(content: bytes, content_type: str) -> tuple[bytes, str]:
    """
    压缩图片：缩放 + 降低质量

    返回:
        (压缩后的字节, 文件扩展名)
    """
    img = Image.open(io.BytesIO(content))

    # GIF 保持原样（可能带动画）
    if content_type == "image/gif":
        return content, ".gif"

    # 去掉透明通道（转为 RGB，体积更小）
    has_transparency = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)
    if has_transparency:
        # 保留 PNG 格式以保留透明度
        img = img.convert("RGBA")
    else:
        img = img.convert("RGB")

    # 缩放：长边超过 MAX_DIMENSION 时等比缩小
    w, h = img.size
    if max(w, h) > MAX_DIMENSION:
        ratio = MAX_DIMENSION / max(w, h)
        new_size = (int(w * ratio), int(h * ratio))
        img = img.resize(new_size, Image.LANCZOS)

    # 输出
    buf = io.BytesIO()
    if has_transparency:
        img.save(buf, format="PNG", optimize=True)
        return buf.getvalue(), ".png"
    else:
        img.save(buf, format="JPEG", quality=JPEG_QUALITY, optimize=True)
        return buf.getvalue(), ".jpg"


@router.post("/image", response_model=DataResponse)
@limiter.limit("10/minute")
async def upload_image(
    request: Request,
    current_user: Annotated[User, Depends(get_current_active_user)],
    file: UploadFile = File(...),
):
    """
    上传图片（自动压缩）

    参数:
        file: 图片文件（jpg/png/gif/webp，最大10MB）

    返回:
        DataResponse: 包含图片访问URL
    """
    # 验证文件类型
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, PNG, GIF, WEBP images are allowed"
        )

    # 读取文件内容
    content = await file.read()

    # 验证文件大小
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10MB limit"
        )

    # 压缩图片
    compressed, ext = compress_image(content, file.content_type)

    # 生成文件路径：uploads/images/2026/06/uuid.jpg
    now = datetime.now()
    date_dir = os.path.join(UPLOAD_DIR, str(now.year), f"{now.month:02d}")
    os.makedirs(date_dir, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(date_dir, filename)

    # 保存压缩后的文件
    with open(filepath, "wb") as f:
        f.write(compressed)

    # 返回相对URL路径
    relative_path = f"/uploads/images/{now.year}/{now.month:02d}/{filename}"

    return DataResponse(
        message="Image uploaded successfully",
        data={"url": relative_path}
    )
