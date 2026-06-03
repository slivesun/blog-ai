# 数据库设计模块 Skill 文档

## 模块概述

数据库设计模块定义了 blog-server 系统的所有数据模型，采用 SQLAlchemy ORM 进行数据库操作，支持 SQLite（开发环境）和 PostgreSQL（生产环境）。

## 技术选型

### ORM: SQLAlchemy 2.0+

**优势**:
- 成熟的 ORM 解决方案
- 强大的查询构建器
- 良好的性能
- 支持异步操作

### 数据库对比

| 特性 | SQLite | PostgreSQL |
|------|--------|------------|
| 适用场景 | 开发/小规模 | 生产环境 |
| 并发支持 | 弱 | 强 |
| 数据量 | <100万 | 无限制 |
| 部署复杂度 | 低 | 中 |
| JSON支持 | 弱 | 强 |
| 全文搜索 | 需扩展 | 内置 |

## 数据模型设计

### 模型关系图

```
User (1) ──────< (N) Article
  │                 │
  │                 │
  ├────< (N) Comment          Category (1) ──────< (N) Article
  │                                 │
  ├────< (N) Note                      │
  │                            Article < N > N Tag (M:N)
  ├────< (N) Notification              │
  │                                 │
  └────< (1) UserSettings        Article (1) ──────< (N) Comment
```

## 核心模型

### 1. User 模型

```python
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    github_url = Column(String(500), nullable=True)
    role = Column(String(50), default="user")
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # 关联
    articles = relationship("Article", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="author", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    user_settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
```

### 2. Article 模型

```python
class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(300), nullable=False, index=True)
    slug = Column(String(350), unique=True, nullable=False, index=True)
    abstract = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    cover_image = Column(String(500), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    likes = Column(Integer, default=0)
    views = Column(Integer, default=0)
    is_draft = Column(Boolean, default=False)
    is_published = Column(Boolean, default=True)
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关联
    author = relationship("User", back_populates="articles")
    category = relationship("Category", back_populates="articles")
    tags = relationship("Tag", secondary=article_tags, back_populates="articles")
    comments = relationship("Comment", back_populates="article", cascade="all, delete-orphan")
```

### 3. Category 模型

```python
class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    color = Column(String(20), default="#6366f1")
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    articles = relationship("Article", back_populates="category")
```

### 4. Tag 模型 (多对多关联)

```python
# 关联表定义
article_tags = Table(
    "article_tags",
    Base.metadata,
    Column("article_id", Integer, ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
)

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    slug = Column(String(50), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    articles = relationship("Article", secondary=article_tags, back_populates="tags")
```

### 5. Comment 模型 (自关联嵌套)

```python
class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    content = Column(Text, nullable=False)
    article_id = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    article = relationship("Article", back_populates="comments")
    author = relationship("User", back_populates="comments")
    parent = relationship("Comment", remote_side=[id], backref="replies")
```

### 6. Note 模型

```python
class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(300), nullable=False, index=True)
    slug = Column(String(350), unique=True, nullable=False, index=True)
    content = Column(Text, nullable=False)
    category = Column(String(100), default="General")
    tags = Column(String(500), nullable=True)  # 逗号分隔
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    author = relationship("User", back_populates="notes")
```

### 7. Notification 模型

```python
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    notification_type = Column(String(50), default="system")
    link_to_id = Column(String(100), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
```

### 8. UserSettings 模型

```python
class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    allow_notifications = Column(Boolean, default=True)
    allow_comments = Column(Boolean, default=True)
    theme_accent = Column(String(20), default="cyan")
    high_density_layout = Column(Boolean, default=False)
    language = Column(String(10), default="zh")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="user_settings")
```

## 数据库初始化

### 创建表

```python
from app.db.session import init_db

init_db()  # 创建所有表
```

### 初始化脚本 `scripts/init_db.py`

```python
def init_default_categories(db):
    """初始化默认分类"""
    categories = [
        {"name": "Engineering", "slug": "engineering", ...},
        {"name": "Design", "slug": "design", ...},
        {"name": "Security", "slug": "security", ...},
        {"name": "Systems", "slug": "systems", ...},
    ]
    for cat_data in categories:
        category = Category(**cat_data)
        db.add(category)
    db.commit()
```

## 索引设计

| 表名 | 字段 | 类型 | 说明 |
|------|------|------|------|
| users | username | Unique | 登录查询 |
| users | email | Unique | 邮箱查询 |
| articles | title | Index | 搜索 |
| articles | slug | Unique | 详情查询 |
| articles | category_id | ForeignKey | 分类筛选 |
| articles | author_id | ForeignKey | 作者筛选 |
| articles | created_at | Index | 排序 |
| comments | article_id | ForeignKey | 文章评论查询 |
| categories | slug | Unique | 分类查询 |

## 数据库迁移

使用 Alembic 进行数据库迁移管理：

```bash
# 初始化 Alembic
alembic init alembic

# 生成迁移脚本
alembic revision --autogenerate -m "add articles"

# 执行迁移
alembic upgrade head

# 回滚
alembic downgrade -1
```

## 性能优化建议

1. **索引优化**: 为常用查询字段添加索引
2. **预加载**: 使用 `joinedload` 预加载关联数据
3. **分页**: 大量数据时使用分页查询
4. **缓存**: Redis 缓存热点数据
5. **连接池**: 合理配置连接池大小

## 常见问题处理

### Q: 如何添加新字段？
**A**: 在模型中添加字段定义，执行 Alembic 迁移

### Q: 如何处理多对多关系？
**A**: 使用 `Table` 定义关联表，通过 `relationship` 的 `secondary` 参数关联

### Q: 如何实现软删除？
**A**: 添加 `is_deleted` 字段，查询时过滤，所有删除操作改为更新该字段

### Q: 如何切换数据库？
**A**: 修改环境变量 `DATABASE_URL`，如 `postgresql://user:pass@localhost/blog`
