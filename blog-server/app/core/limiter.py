"""
限流器模块
提供全局共享的速率限制器实例
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

# 全局限流器：基于客户端 IP，默认 100次/分钟
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
