# 文章管理模块 Skill 文档

## 模块概述

文章管理模块是 blog-server 系统的核心业务模块，负责博客文章的创建、读取、更新、删除（CRUD）操作，以及文章的分类、标签管理。

## 数据模型

### Article 表结构

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键，自增 |
| title | String(300) | 文章标题 |
| slug | String(350) | URL友好标题，唯一 |
| abstract | Text | 文章摘要 |
| content | Text | 文章内容(Markdown) |
| cover_image | String(500) | 封面图片URL |
| category_id | Integer | 分类ID，外键 |
| author_id | Integer | 作者ID，外键 |
| likes | Integer | 点赞数，默认0 |
| views | Integer | 浏览数，默认0 |
| is_draft | Boolean | 是否草稿 |
| is_published | Boolean | 是否发布 |
| published_at | DateTime | 发布时间 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

### 关联关系
- `author`: User (一对多)
- `category`: Category (多对一)
- `tags`: Tag (多对多)
- `comments`: Comment (一对多)

## 核心功能

### 1. 获取文章列表 `GET /api/v1/articles`

**功能说明**: 分页获取文章列表，支持筛选和搜索

**查询参数**:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| page_size | int | 20 | 每页数量(1-100) |
| category_id | int | - | 按分类筛选 |
| tag_id | int | - | 按标签筛选 |
| author_id | int | - | 按作者筛选 |
| search | string | - | 搜索关键词 |
| sort_by | string | created_at | 排序字段 |
| sort_order | string | desc | 排序方向 |
| include_drafts | bool | false | 包含草稿 |

**响应格式**:
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": 1,
        "title": "string",
        "slug": "string",
        "abstract": "string",
        "cover_image": "string",
        "category": "string",
        "author_name": "string",
        "author_avatar": "string",
        "likes": 0,
        "comment_count": 0,
        "date": "May 24, 2024",
        "is_draft": false
      }
    ],
    "total": 100,
    "page": 1,
    "page_size": 20,
    "total_pages": 5
  }
}
```

### 2. 获取文章详情 `GET /api/v1/articles/{id}`

**功能说明**: 获取单篇文章详情，包含完整内容和评论树

**路径参数**:
- `article_id`: 文章ID

**响应格式**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "string",
    "slug": "string",
    "abstract": "string",
    "content": "string (完整内容)",
    "cover_image": "string",
    "category": { /* CategoryResponse */ },
    "tags": [ /* TagResponse[] */ ],
    "author_id": 1,
    "author_name": "string",
    "author_nickname": "string",
    "author_role": "string",
    "author_avatar": "string",
    "likes": 142,
    "views": 1000,
    "comment_count": 5,
    "comments": [
      {
        "id": 1,
        "content": "string",
        "author_id": 1,
        "author_name": "string (nickname优先)",
        "author_nickname": "string",
        "author_avatar": "string",
        "parent_id": null,
        "is_deleted": false,
        "created_at": "datetime",
        "updated_at": "datetime",
        "replies": [
          {
            "id": 2,
            "content": "string",
            "parent_id": 1,
            "replies": []
          }
        ]
      }
    ],
    "is_draft": false,
    "is_published": true,
    "published_at": "datetime",
    "created_at": "datetime",
    "updated_at": "datetime",
    "date": "May 24, 2024"
  }
}
```

**业务逻辑**:
1. 检查文章是否存在
2. 检查用户权限（草稿只能作者和管理员看）
3. 增加浏览数
4. 递归构建评论树 (排除已删除评论)
5. 返回完整文章内容 + 评论树

**业务逻辑**:
1. 检查文章是否存在
2. 检查用户权限（草稿只能作者和管理员看）
3. 增加浏览数
4. 返回完整文章内容

### 3. 创建文章 `POST /api/v1/articles`

**功能说明**: 创建新文章

**认证要求**: 需要登录

**请求参数**:
```json
{
  "title": "string",       // 必填，1-300字符
  "abstract": "string",    // 摘要
  "content": "string",     // 内容
  "cover_image": "string", // 封面图URL
  "category_id": 1,        // 分类ID
  "tag_ids": [1, 2],      // 标签ID列表
  "is_draft": false        // 是否草稿
}
```

**业务逻辑**:
1. 生成唯一slug（标题slug化后去重）
2. 保存文章
3. 关联标签
4. 如果不是草稿，设置发布时间

### 4. 更新文章 `PUT /api/v1/articles/{id}`

**功能说明**: 更新文章内容

**认证要求**: 作者或管理员

**请求参数**: 同创建，支持部分更新

**业务逻辑**:
1. 检查文章是否存在
2. 检查权限
3. 如果标题变更，更新slug
4. 更新标签关联
5. 处理发布状态变更

### 5. 删除文章 `DELETE /api/v1/articles/{id}`

**功能说明**: 删除文章

**认证要求**: 作者或管理员

**业务逻辑**:
1. 检查权限
2. 级联删除关联的评论
3. 删除文章

### 6. 点赞文章 `POST /api/v1/articles/{id}/like`

**功能说明**: 点赞文章，自动为文章作者创建通知

**认证要求**: 需要登录

**响应格式**:
```json
{
  "success": true,
  "data": {
    "article_id": 1,
    "likes": 143
  }
}
```

**业务逻辑**:
1. 文章 likes 计数 +1
2. 如果点赞者不是文章作者，创建通知发送给作者

## 分类管理

### 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /categories | 获取分类列表 |
| GET | /categories/{id} | 获取分类详情 |
| POST | /categories | 创建分类（需管理员） |
| PUT | /categories/{id} | 更新分类（需管理员） |
| DELETE | /categories/{id} | 删除分类（需管理员） |

### 预置分类
- Engineering (工程)
- Design (设计)
- Security (安全)
- Systems (系统)

## 标签管理

### 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /tags | 获取标签列表 |
| POST | /tags | 创建标签 |
| DELETE | /tags/{id} | 删除标签 |

### 标签关联
使用多对多关联表 `article_tags`

## 核心代码解析

### Slug 生成 `app/utils/slug.py`

```python
def slugify(text: str) -> str:
    """将文本转换为URL友好的slug"""
    # Unicode正规化
    text = unicodedata.normalize('NFKD', text)
    # 转小写，替换特殊字符为空格
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', ' ', text)
    # 空格替换为连字符
    text = re.sub(r'[\s]+', '-', text)
    return text.strip('-')
```

### 文章响应构建

```python
def build_article_response(article: Article, include_content: bool = False) -> ArticleResponse:
    """构建文章响应数据"""
    return ArticleResponse(
        id=article.id,
        title=article.title,
        slug=article.slug,
        # ... 其他字段
        content=article.content if include_content else None,
        tags=[TagResponse.model_validate(tag) for tag in article.tags],
        # ...
    )
```

## 权限控制

| 操作 | 普通用户 | 作者 | 管理员 |
|------|----------|------|--------|
| 查看已发布文章 | ✓ | ✓ | ✓ |
| 查看自己草稿 | - | ✓ | ✓ |
| 创建文章 | ✓ | ✓ | ✓ |
| 修改自己文章 | - | ✓ | ✓ |
| 删除自己文章 | - | ✓ | ✓ |
| 修改他人文章 | - | - | ✓ |
| 删除他人文章 | - | - | ✓ |

## 性能优化

### 数据库查询优化
- 使用 `joinedload` 预加载关联数据
- 使用索引加速查询
- 使用分页限制返回数量

### 缓存策略（可选）
- Redis 缓存热门文章
- 分类列表缓存
- 用户会话缓存

## 常见问题处理

### Q: 如何防止slug重复？
**A**: 生成slug时检查数据库，如已存在则添加序号后缀

### Q: 如何实现文章草稿功能？
**A**: 使用 `is_draft` 和 `is_published` 双字段控制，草稿不会出现在公开列表

### Q: 如何实现文章多对多标签？
**A**: 使用中间表 `article_tags`，SQLAlchemy 的 `secondary` 参数配置多对多关系

### Q: 如何实现搜索功能？
**A**: 使用 SQLAlchemy 的 `ilike` 方法进行模糊匹配，搜索标题和摘要字段
