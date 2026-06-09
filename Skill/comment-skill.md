# 评论系统模块 Skill 文档

## 模块概述

评论系统模块负责处理用户对文章的评论功能，支持嵌套评论（回复功能），采用软删除机制保证数据完整性。

## 数据模型

### Comment 表结构

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键，自增 |
| content | Text | 评论内容 |
| article_id | Integer | 文章ID，外键 |
| author_id | Integer | 评论者ID，外键 |
| parent_id | Integer | 父评论ID（用于嵌套），外键 |
| is_deleted | Boolean | 是否删除（软删除） |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

### 关联关系
- `article`: Article (多对一)
- `author`: User (多对一)
- `parent`: Comment (自关联)
- `replies`: Comment[] (子评论列表)

## 核心功能

### 1. 获取文章评论 `GET /api/v1/comments/article/{article_id}`

**功能说明**: 获取指定文章的评论列表

**路径参数**:
- `article_id`: 文章ID

**查询参数**:
- `include_replies`: boolean, 是否包含嵌套回复，默认true

**响应格式**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "content": "string",
      "article_id": 1,
      "author_id": 1,
      "author_name": "string",
      "author_avatar": "string",
      "parent_id": null,
      "is_deleted": false,
      "created_at": "datetime",
      "updated_at": "datetime",
      "replies": [
        {
          "id": 2,
          "content": "string",
          "author_name": "string",
          "parent_id": 1,
          "replies": []
        }
      ]
    }
  ]
}
```

**业务逻辑**:
1. 检查文章是否存在
2. 只获取顶级评论（parent_id为null）
3. 递归获取子回复
4. 排除已软删除的评论

### 2. 创建评论 `POST /api/v1/comments/article/{article_id}`

**功能说明**: 对文章发表评论或回复

**认证要求**: 需要登录

**路径参数**:
- `article_id`: 文章ID

**请求参数**:
```json
{
  "content": "string",    // 必填，评论内容
  "parent_id": null       // 可选，父评论ID（用于回复）
}
```

**业务逻辑**:
1. 检查文章是否存在
2. 如果有parent_id，检查父评论是否存在且属于同一文章
3. 创建评论
4. 自动关联作者

### 3. 更新评论 `PUT /api/v1/comments/{comment_id}`

**功能说明**: 更新评论内容

**认证要求**: 评论作者或管理员

**请求参数**:
```json
{
  "content": "string"     // 新评论内容
}
```

**业务逻辑**:
1. 检查评论是否存在
2. 检查权限（作者或管理员）
3. 更新评论内容
4. 更新时间戳

### 4. 删除评论 `DELETE /api/v1/comments/{comment_id}`

**功能说明**: 删除评论（软删除）

**认证要求**: 评论作者或管理员

**业务逻辑**:
1. 检查评论是否存在
2. 检查权限
3. 执行软删除（is_deleted=true）
4. 保留评论数据用于数据恢复

## 嵌套评论设计

### 结构说明
- 顶级评论: parent_id = null
- 子回复: parent_id = 父评论ID
- 理论上支持无限嵌套，实际建议限制3层

### 查询策略
```python
# 获取顶级评论
comments = db.query(Comment).filter(
    Comment.article_id == article_id,
    Comment.parent_id == None,
    Comment.is_deleted == False
).all()

# 递归构建回复树
def build_comment_tree(comment, include_replies=True):
    replies = []
    if include_replies and comment.replies:
        replies = [build_comment_tree(reply) for reply in comment.replies if not reply.is_deleted]
    return CommentResponse(..., replies=replies)
```

## 软删除机制

### 实现方式
```python
class Comment(Base):
    is_deleted = Column(Boolean, default=False)
```

### 查询过滤
```python
# 所有查询都需要排除已删除评论
db.query(Comment).filter(Comment.is_deleted == False)
```

### 数据保留
- 评论内容保留，界面显示"[已删除]"
- 保留回复关系
- 可用于数据分析或恢复

## 权限控制

| 操作 | 游客 | 普通用户 | 评论作者 | 管理员 |
|------|------|----------|----------|--------|
| 查看评论 | ✓ | ✓ | ✓ | ✓ |
| 发表评论 | - | ✓ | ✓ | ✓ |
| 回复评论 | - | ✓ | ✓ | ✓ |
| 修改自己评论 | - | - | ✓ | ✓ |
| 删除自己评论 | - | - | ✓ | ✓ |
| 删除他人评论 | - | - | - | ✓ |

## 核心代码解析

### 评论响应构建

```python
def build_comment_response(comment: Comment, include_replies: bool = False) -> CommentResponse:
    """构建评论响应数据"""
    replies = []
    if include_replies and comment.replies:
        # 递归构建回复树，排除已删除的回复
        replies = [
            build_comment_response(reply, include_replies=True)
            for reply in comment.replies
            if not reply.is_deleted
        ]

    return CommentResponse(
        id=comment.id,
        content=comment.content if not comment.is_deleted else "[已删除]",
        author_name=comment.author.username if comment.author else "Unknown",
        # ... 其他字段
        replies=replies
    )
```

### 权限检查

```python
async def check_comment_permission(comment_id: int, current_user: User, db: Session):
    """检查用户是否有权限操作评论"""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return comment
```

## 安全考虑

### XSS 防护
- 评论内容在前端渲染时需要转义
- 后端不存储原始HTML

### 内容审核
- 可扩展敏感词过滤
- 可增加评论审核功能

### 频率限制
- 可限制单用户每分钟评论数
- 防止刷屏

## 常见问题处理

### Q: 如何实现@提及功能？
**A**: 在评论内容中解析@用户名，存储被提及用户ID列表，发送通知

### Q: 如何实现评论置顶？
**A**: 添加 `is_pinned` 字段，查询时优先排序

### Q: 如何实现评论点赞？
**A**: 创建独立表 `comment_likes`，记录 user_id 和 comment_id

### Q: 如何实现评论富文本？
**A**: 使用 Markdown 或限制性HTML，后端需要XSS过滤
