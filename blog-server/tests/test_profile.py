"""
用户资料模块测试
测试用户资料和设置获取、更新
"""
import pytest
from fastapi import status


class TestProfile:
    """用户资料测试类"""

    def test_get_profile(self, client, auth_headers, test_user):
        """测试获取个人资料"""
        response = client.get("/api/v1/profile", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["data"]["username"] == "testuser"

    def test_update_profile(self, client, auth_headers, test_user):
        """测试更新个人资料"""
        response = client.put(
            "/api/v1/profile",
            headers=auth_headers,
            json={
                "full_name": "Updated Name",
                "bio": "New bio"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["data"]["full_name"] == "Updated Name"

    def test_change_password(self, client, auth_headers, test_user):
        """测试修改密码"""
        response = client.put(
            "/api/v1/profile/password",
            headers=auth_headers,
            json={
                "old_password": "testpassword",
                "new_password": "newpassword123"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["success"] is True

    def test_change_password_wrong_old(self, client, auth_headers, test_user):
        """测试旧密码错误"""
        response = client.put(
            "/api/v1/profile/password",
            headers=auth_headers,
            json={
                "old_password": "wrongpassword",
                "new_password": "newpassword123"
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_settings(self, client, auth_headers, test_user):
        """测试获取设置"""
        response = client.get("/api/v1/profile/settings", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert "theme_accent" in data["data"]

    def test_update_settings(self, client, auth_headers, test_user):
        """测试更新设置"""
        response = client.put(
            "/api/v1/profile/settings",
            headers=auth_headers,
            json={
                "theme_accent": "violet",
                "high_density_layout": True
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["data"]["theme_accent"] == "violet"
        assert data["data"]["high_density_layout"] is True
