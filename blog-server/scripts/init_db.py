"""
数据库初始化脚本
创建默认分类和标签
"""
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal, init_db
from app.models.article import Category, Tag
from app.models.user import User
from app.models.settings import UserSettings
from app.core.security import get_password_hash


def init_default_categories(db):
    """
    初始化默认分类

    参数:
        db: 数据库会话
    """
    default_categories = [
        {"name": "Engineering", "slug": "engineering", "description": "工程与技术相关文章", "color": "#06b6d4", "sort_order": 1},
        {"name": "Design", "slug": "design", "description": "设计与视觉相关文章", "color": "#d946ef", "sort_order": 2},
        {"name": "Security", "slug": "security", "description": "安全相关文章", "color": "#ef4444", "sort_order": 3},
        {"name": "Systems", "slug": "systems", "description": "系统架构相关文章", "color": "#10b981", "sort_order": 4},
    ]

    for cat_data in default_categories:
        existing = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
        if not existing:
            category = Category(**cat_data)
            db.add(category)
            print(f"Created category: {cat_data['name']}")

    db.commit()


def init_default_tags(db):
    """
    初始化默认标签

    参数:
        db: 数据库会话
    """
    default_tags = [
        {"name": "Python", "slug": "python"},
        {"name": "FastAPI", "slug": "fastapi"},
        {"name": "React", "slug": "react"},
        {"name": "TypeScript", "slug": "typescript"},
        {"name": "DevOps", "slug": "devops"},
        {"name": "Database", "slug": "database"},
        {"name": "Architecture", "slug": "architecture"},
        {"name": "Tutorial", "slug": "tutorial"},
    ]

    for tag_data in default_tags:
        existing = db.query(Tag).filter(Tag.slug == tag_data["slug"]).first()
        if not existing:
            tag = Tag(**tag_data)
            db.add(tag)
            print(f"Created tag: {tag_data['name']}")

    db.commit()


def init_default_admin(db):
    """
    初始化默认管理员账号

    参数:
        db: 数据库会话
    """
    existing_admin = db.query(User).filter(User.username == "admin").first()
    if not existing_admin:
        admin = User(
            username="admin",
            email="admin@blog.local",
            hashed_password=get_password_hash("admin123"),
            full_name="Administrator",
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

        print("Created default admin user: admin / admin123")
    else:
        print("Admin user already exists")


def init_sample_articles(db):
    """
    初始化示例文章

    参数:
        db: 数据库会话
    """
    from app.models.article import Article
    from app.models.comment import Comment
    from datetime import datetime

    # 检查是否已有文章
    if db.query(Article).first():
        print("Articles already exist, skipping...")
        return

    # 获取默认分类和用户
    engineering_cat = db.query(Category).filter(Category.slug == "engineering").first()
    design_cat = db.query(Category).filter(Category.slug == "design").first()
    security_cat = db.query(Category).filter(Category.slug == "security").first()
    admin = db.query(User).filter(User.username == "admin").first()

    if not all([engineering_cat, design_cat, security_cat, admin]):
        print("Required categories or users not found, skipping sample articles...")
        return

    sample_articles = [
        {
            "title": "Architecting for Scale: Microservices in 2024",
            "slug": "architecting-for-scale-microservices-in-2024",
            "abstract": "Deep dives into modern distributed systems, tracing state consistency, high density network flows, and API gateway routing topologies.",
            "content": """In the context of modern distributed workloads, keeping data coherent demands a deep understanding of physical grid limits and routing nodes. High deployment speed often risks data consistency, rendering single microservice nodes susceptible to telemetry timeouts.

To avoid failures, modern orchestrators utilize container mesh frameworks which separate incoming client tokens from data pipelines. By enforcing single port ingress proxies (specifically port 3000), external metrics requests are isolated, which keeps API keys concealed from untrusted clients.

As systems grow, simple state triggers can be managed locally in browser persistence blocks (such as client-side localStorage), providing robust fallback options during network events. Maintaining structured boundaries ensures developers get maximum clarity.""",
            "cover_image": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop",
            "category_id": engineering_cat.id,
            "author_id": admin.id,
            "is_draft": False,
            "is_published": True,
            "published_at": datetime(2024, 5, 24),
            "views": 142,
            "likes": 142
        },
        {
            "title": "Precision Minimalism in Modern UI",
            "slug": "precision-minimalism-in-modern-ui",
            "abstract": "Why strict visual hierarchies, intentional gray colorways, and precise typographic details outperform complex gradients.",
            "content": """Minimalism in UI design isn't about removing elements—it's about intentional reduction. Every pixel should serve a purpose.

The key principles include:
1. Clear visual hierarchy with deliberate spacing
2. Restricted color palette with purposeful accents
3. Typography as the primary communication tool
4. Generous whitespace for visual breathing room

By enforcing strict constraints, designers create interfaces that feel both sophisticated and highly functional.""",
            "cover_image": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop",
            "category_id": design_cat.id,
            "author_id": admin.id,
            "is_draft": False,
            "is_published": True,
            "published_at": datetime(2024, 6, 2),
            "views": 98,
            "likes": 98
        },
        {
            "title": "Zero-Trust Architectures for 2025",
            "slug": "zero-trust-architectures-for-2025",
            "abstract": "Revisiting security boundaries inside the service mesh. Implementing granular identity attributes and ephemeral access tokens.",
            "content": """Zero Trust is not a product—it's a security philosophy. Every request must be verified, regardless of its origin.

Key implementation strategies:
- Implement microsegmentation in network layers
- Use ephemeral, short-lived access tokens
- Enforce continuous authentication and authorization
- Apply the principle of least privilege at every level

In 2025, we see organizations moving away from perimeter-based security toward identity-first architectures.""",
            "cover_image": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop",
            "category_id": security_cat.id,
            "author_id": admin.id,
            "is_draft": False,
            "is_published": True,
            "published_at": datetime(2024, 7, 15),
            "views": 184,
            "likes": 184
        }
    ]

    for article_data in sample_articles:
        article = Article(**article_data)
        db.add(article)
        print(f"Created article: {article_data['title']}")

    db.commit()
    print("Sample articles created successfully")


def migrate_missing_columns(engine):
    """
    自动检测并添加缺失的列（轻量迁移，无需 Alembic）
    对比模型定义与实际表结构，自动 ALTER TABLE ADD COLUMN
    """
    from sqlalchemy import inspect, text

    inspector = inspect(engine)

    # 定义需要检查的表和列：(表名, 列名, 列类型, 默认值)
    # 以后新增字段只需在此追加一行
    expected_columns = [
        ("user_settings", "skin", "VARCHAR(10)", "'dark'"),
    ]

    for table_name, col_name, col_type, default_val in expected_columns:
        if table_name not in inspector.get_table_names():
            continue  # 表还没创建，create_all 会处理
        existing_cols = [c["name"] for c in inspector.get_columns(table_name)]
        if col_name not in existing_cols:
            try:
                with engine.begin() as conn:
                    conn.execute(text(
                        f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type} DEFAULT {default_val}"
                    ))
                print(f"  迁移: {table_name}.{col_name} 列已添加")
            except Exception as e:
                print(f"  [警告] 添加 {table_name}.{col_name} 列失败: {e}")


def main():
    """主函数"""
    print("Initializing database...")

    # 初始化数据库表（只创建不存在的表）
    init_db()
    print("Database tables created")

    # 自动迁移：添加模型新增但表中缺失的列
    from app.db.session import engine
    migrate_missing_columns(engine)

    # 创建会话
    db = SessionLocal()
    try:
        # 初始化默认分类
        init_default_categories(db)

        # 初始化默认标签
        init_default_tags(db)

        # 初始化默认管理员
        init_default_admin(db)

        # 初始化示例文章
        init_sample_articles(db)

        print("\nDatabase initialization completed successfully!")

    except Exception as e:
        print(f"Error during initialization: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
