"""
认证模块测试
测试用户注册、登录、登出等功能
"""
import pytest
from fastapi import status


class TestAuth:
    """认证测试类"""

    def test_register_success(self, client):
        """测试成功注册"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["success"] is True
        assert data["data"]["user"]["username"] == "newuser"
        assert "token" in data["data"]

    def test_register_duplicate_username(self, client, test_user):
        """测试用户名已存在"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "testuser",
                "email": "another@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already exists" in response.json()["detail"]

    def test_register_duplicate_email(self, client, test_user):
        """测试邮箱已注册"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "anotheruser",
                "email": "test@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already registered" in response.json()["detail"]

    def test_login_success(self, client, test_user):
        """测试成功登录"""
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "testuser", "password": "testpassword"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["data"]["user"]["username"] == "testuser"
        assert "token" in data["data"]

    def test_login_with_email(self, client, test_user):
        """测试使用邮箱登录"""
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "test@example.com", "password": "testpassword"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True

    def test_login_wrong_password(self, client, test_user):
        """测试密码错误"""
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "testuser", "password": "wrongpassword"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, client):
        """测试用户不存在"""
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "nonexistent", "password": "password123"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_current_user(self, client, auth_headers, test_user):
        """测试获取当前用户"""
        response = client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["data"]["username"] == "testuser"

    def test_get_current_user_unauthorized(self, client):
        """测试未认证访问"""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_logout(self, client, auth_headers):
        """测试登出"""
        response = client.post("/api/v1/auth/logout", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["success"] is True
