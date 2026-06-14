"""
数据库备份脚本
用法: python backup_db.py [备份目录]
默认备份到 ./backups/ 目录，保留最近30份备份
"""
import shutil
import os
import sys
from datetime import datetime
from pathlib import Path


def backup_database(backup_dir: str = "backups", keep_count: int = 30):
    """备份 SQLite 数据库文件"""
    # 数据库文件路径
    db_file = Path("blog.db")
    if not db_file.exists():
        print(f"[ERROR] Database file not found: {db_file.absolute()}")
        return False

    # 创建备份目录
    backup_path = Path(backup_dir)
    backup_path.mkdir(parents=True, exist_ok=True)

    # 生成备份文件名
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = backup_path / f"blog_{timestamp}.db"

    # 执行备份
    try:
        shutil.copy2(str(db_file), str(backup_file))
        size_mb = backup_file.stat().st_size / (1024 * 1024)
        print(f"[OK] Backup created: {backup_file} ({size_mb:.2f} MB)")
    except Exception as e:
        print(f"[ERROR] Backup failed: {e}")
        return False

    # 清理旧备份，保留最近 keep_count 份
    backups = sorted(backup_path.glob("blog_*.db"), key=lambda f: f.stat().st_mtime)
    if len(backups) > keep_count:
        for old in backups[:-keep_count]:
            old.unlink()
            print(f"[CLEAN] Removed old backup: {old.name}")

    return True


if __name__ == "__main__":
    backup_dir = sys.argv[1] if len(sys.argv) > 1 else "backups"
    success = backup_database(backup_dir)
    sys.exit(0 if success else 1)
