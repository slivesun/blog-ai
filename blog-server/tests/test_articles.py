"""
文章模块测试
测试文章的CRUD操作
"""
import pytest
from fastapi import status


class TestArticles:
    """文章测试类"""

    def test_get_articles_empty(self, client):
        """测试获取空文章列表"""
        response = client.get("/api/v1/articles")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["data"]["articles"] == []
        assert data["data"]["total"] == 0

    def test_create_article_success(self, client, auth_headers):
        """测试创建文章"""
        response = client.post(
            "/api/v1/articles",
            headers=auth_headers,
            json={
                "title": "Test Article",
                "abstract": "Test abstract",
                "content": "Test content",
                "is_draft": False
            }
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["success"] is True
        assert data["data"]["title"] == "Test Article"
        assert data["data"]["author_name"] == "testuser"

    def test_create_article_unauthorized(self, client):
        """测试未认证创建文章"""
        response = client.post(
            "/api/v1/articles",
            json={
                "title": "Test Article",
                "content": "Test content"
            }
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_article_by_id(self, client, auth_headers):
        """测试获取单篇文章"""
        # 先创建文章
        create_response = client.post(
            "/api/v1/articles",
            headers=auth_headers,
            json={
                "title": "Test Article",
                "abstract": "Test abstract",
                "content": "Test content"
            }
        )
        article_id = create_response.json()["data"]["id"]

        # 获取文章
        response = client.get(f"/api/v1/articles/{article_id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["data"]["title"] == "Test Article"

    def test_get_article_not_found(self, client):
        """测试获取不存在的文章"""
        response = client.get("/api/v1/articles/9999")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_article_success(self, client, auth_headers):
        """测试更新文章"""
        # 先创建文章
        create_response = client.post(
            "/api/v1/articles",
            headers=auth_headers,
            json={
                "title": "Original Title",
                "content": "Original content"
            }
        )
        article_id = create_response.json()["data"]["id"]

        # 更新文章
        response = client.put(
            f"/api/v1/articles/{article_id}",
            headers=auth_headers,
            json={
                "title": "Updated Title",
                "content": "Updated content"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["data"]["title"] == "Updated Title"

    def test_delete_article_success(self, client, auth_headers):
        """测试删除文章"""
        # 先创建文章
        create_response = client.post(
            "/api/v1/articles",
            headers=auth_headers,
            json={
                "title": "To Delete",
                "content": "Will be deleted"
            }
        )
        article_id = create_response.json()["data"]["id"]

        # 删除文章
        response = client.delete(f"/api/v1/articles/{article_id}", headers=auth_headers)
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # 验证删除
        get_response = client.get(f"/api/v1/articles/{article_id}")
        assert get_response.status_code == status.HTTP_404_NOT_FOUND

    def test_like_article(self, client, auth_headers):
        """测试点赞文章"""
        # 先创建文章
        create_response = client.post(
            "/api/v1/articles",
            headers=auth_headers,
            json={
                "title": "Likeable Article",
                "content": "Please like me"
            }
        )
        article_id = create_response.json()["data"]["id"]

        # 点赞
        response = client.post(f"/api/v1/articles/{article_id}/like")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["data"]["likes"] == 1

    def test_articles_pagination(self, client, auth_headers):
        """测试文章分页"""
        # 创建多篇文章
        for i in range(5):
            client.post(
                "/api/v1/articles",
                headers=auth_headers,
                json={
                    "title": f"Article {i}",
                    "content": f"Content {i}"
                }
            )

        # 测试分页
        response = client.get("/api/v1/articles?page=1&page_size=2")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["data"]["articles"]) == 2
        assert data["data"]["total"] == 5
        assert data["data"]["total_pages"] == 3
