"""
核心配置模块
负责应用程序的配置管理，包括环境变量、数据库、JWT等配置
"""
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from functools import lru_cache


class Settings(BaseSettings):
    """
    应用程序配置类
    使用 Pydantic Settings 进行配置管理，自动从环境变量或 .env 文件加载
    """
    # API 配置
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # 项目信息
    PROJECT_NAME: str = "Blog Server"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False

    # 数据库配置
    DATABASE_URL: str = "sqlite:///./blog.db"

    # JWT 配置
    SECRET_KEY: str = "change-this-to-a-secure-random-string-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS 配置
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        """将 CORS_ORIGINS 字符串转换为列表"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # 环境配置
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    LOG_FILE: Optional[str] = "logs/blog-server.log"
    CREATE_DEFAULT_ADMIN: bool = False

    # 数据库配置项
    @property
    def db_engine(self) -> str:
        """获取数据库引擎类型"""
        if "postgresql" in self.DATABASE_URL:
            return "postgresql"
        elif "mysql" in self.DATABASE_URL:
            return "mysql"
        return "sqlite"

    @property
    def is_development(self) -> bool:
        """是否为开发环境"""
        return self.ENVIRONMENT == "development"

    @property
    def is_production(self) -> bool:
        """是否为生产环境"""
        return self.ENVIRONMENT == "production"

    @model_validator(mode="after")
    def validate_production_settings(self):
        if self.is_production:
            weak_secret_keys = {
                "",
                "change-this-to-a-secure-random-string",
                "change-this-to-a-secure-random-string-in-production",
            }
            if self.SECRET_KEY in weak_secret_keys:
                raise ValueError("SECRET_KEY must be set to a strong value in production")
        return self


@lru_cache()
def get_settings() -> Settings:
    """
    获取配置单例
    使用 lru_cache 缓存配置实例，避免重复读取环境变量
    """
    return Settings()


# 全局配置实例
settings = get_settings()
