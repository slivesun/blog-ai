"""
Slug工具函数
提供URL友好的slug生成功能
"""
import re
import unicodedata


def slugify(text: str) -> str:
    """
    将文本转换为URL友好的slug

    参数:
        text: 输入文本

    返回:
        str: slug格式的字符串

    示例:
        >>> slugify("Hello World!")
        'hello-world'
        >>> slugify("Python 3.8+ 新特性")
        'python-38-新特性'
    """
    # 将文本转换为Unicode NFKD normalized form
    text = unicodedata.normalize('NFKD', text)

    # 移除重音符号
    text = ''.join(c for c in text if not unicodedata.combining(c))

    # 转换为小写
    text = text.lower()

    # 替换非字母数字字符为空格
    text = re.sub(r'[^a-z0-9\s-]', ' ', text)

    # 将多个空格替换为单个连字符
    text = re.sub(r'[\s]+', '-', text)

    # 移除首尾的连字符
    text = text.strip('-')

    # 移除连续的连字符
    text = re.sub(r'-+', '-', text)

    return text


def validate_slug(slug: str) -> bool:
    """
    验证slug格式是否合法

    参数:
        slug: slug字符串

    返回:
        bool: 是否合法
    """
    if not slug:
        return False

    # 只允许字母、数字和连字符
    pattern = r'^[a-z0-9]+(?:-[a-z0-9]+)*$'
    return bool(re.match(pattern, slug))
