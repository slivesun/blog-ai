"""
测试配置和夹具
提供测试所需的数据库会话、客户端等
"""
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db, engine as app_engine, SessionLocal
from app.models.user import User
from app.models.settings import UserSettings
from app.core.security import get_password_hash


@pytest.fixture(scope="function")
def db():
    """创建测试数据库会话 - 使用应用数据库"""
    # 创建表
    Base.metadata.create_all(bind=app_engine)

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        # 清理测试数据（删除所有数据但保留表结构）
        with app_engine.connect() as conn:
            for table in reversed(Base.metadata.sorted_tables):
                conn.execute(text(f"DELETE FROM {table.name}"))
            conn.commit()


@pytest.fixture(scope="function")
def client(db):
    """创建测试客户端"""

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db):
    """创建测试用户"""
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=get_password_hash("testpassword"),
        full_name="Test User",
        role="user",
        is_active=True,
        is_admin=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 创建用户设置
    settings = UserSettings(user_id=user.id)
    db.add(settings)
    db.commit()

    return user


@pytest.fixture
def admin_user(db):
    """创建管理员用户"""
    admin = User(
        username="admin",
        email="admin@example.com",
        hashed_password=get_password_hash("adminpassword"),
        full_name="Admin User",
        role="admin",
        is_active=True,
        is_admin=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    # 创建管理员设置
    settings = UserSettings(user_id=admin.id)
    db.add(settings)
    db.commit()

    return admin


@pytest.fixture
def auth_headers(client, test_user):
    """获取认证头"""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "testuser", "password": "testpassword"}
    )
    token = response.json()["data"]["token"]["access_token"]
    return {"Authorization": f"Bearer {token}"}
