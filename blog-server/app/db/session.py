"""
数据库会话模块
负责数据库引擎创建和会话管理
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings


# 创建数据库引擎
if "sqlite" in settings.DATABASE_URL:
    # SQLite 配置
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},  # SQLite 特定配置
        echo=settings.DEBUG,  # 是否打印 SQL 语句
        pool_pre_ping=True  # 连接前检查连接是否有效
    )

    # 启用 WAL 模式，提升并发读写性能
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.close()
else:
    # PostgreSQL / MySQL 配置
    engine = create_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )


# 创建会话工厂
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


class Base(DeclarativeBase):
    """SQLAlchemy 声明性基类"""
    pass


def get_db():
    """
    获取数据库会话
    作为 FastAPI 依赖项使用
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    初始化数据库
    创建所有表结构
    """
    from app.models import user, article, comment, category, tag, note, notification, settings as user_settings, image
    Base.metadata.create_all(bind=engine)
