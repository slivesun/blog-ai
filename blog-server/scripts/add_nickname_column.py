"""
数据库迁移脚本
为 users 表添加 nickname 列
"""
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, inspect
from app.db.session import SessionLocal, engine


def add_nickname_column():
    """
    为 users 表添加 nickname 列
    如果列已存在则跳过
    """
    db = SessionLocal()
    try:
        # 检查列是否已存在
        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "nickname" in columns:
            print("nickname 列已存在，跳过迁移")
            return

        # 添加 nickname 列
        db.execute(text("ALTER TABLE users ADD COLUMN nickname VARCHAR(100)"))
        db.commit()

        # 将现有用户的 nickname 设置为 username
        db.execute(text("UPDATE users SET nickname = username WHERE nickname IS NULL"))
        db.commit()

        print("成功添加 nickname 列到 users 表")
        print("已将现有用户的 nickname 设置为 username")

    except Exception as e:
        print(f"迁移失败: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("开始迁移: 添加 nickname 列...")
    add_nickname_column()
    print("迁移完成")
