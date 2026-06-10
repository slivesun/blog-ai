# 认证模块 Skill 文档

## 模块概述

认证模块是 blog-server 后端系统的核心模块之一，负责处理用户注册、登录、登出等认证功能。基于 JWT (JSON Web Token) 实现无状态认证机制。

## 核心功能

### 1. 用户注册 `POST /api/v1/auth/register`

**功能说明**: 创建新用户账号

**请求参数**:
```json
{
  "username": "string",    // 用户名，3-50字符
  "email": "string",       // 邮箱地址
  "password": "string"     // 密码，6-100字符
}
```

**响应格式**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "string",
      "email": "string",
      "full_name": "string",
      "nickname": "string",
      "role": "user",
      "is_active": true,
      "is_admin": false
    },
    "token": {
      "access_token": "string",
      "token_type": "bearer",
      "expires_in": 1800
    }
  }
}
```

**业务逻辑**:
1. 验证用户名唯一性
2. 验证邮箱唯一性
3. 密码使用 bcrypt 哈希存储
4. 自动创建用户默认设置
5. 自动设置 nickname = username
6. 生成 JWT 访问令牌

### 2. 用户登录 `POST /api/v1/auth/login`

**功能说明**: 用户登录获取访问令牌

**请求参数**:
```json
{
  "username": "string",    // 用户名或邮箱
  "password": "string"    // 密码
}
```

**响应格式**: 同注册接口

**业务逻辑**:
1. 支持用户名或邮箱登录
2. 验证密码强度
3. 检查用户账号是否激活
4. 更新最后登录时间
5. 生成 JWT 访问令牌

### 3. 用户登出 `POST /api/v1/auth/logout`

**功能说明**: 登出当前用户（前端删除token即可）

**认证要求**: 需要登录

### 4. 获取当前用户 `GET /api/v1/auth/me`

**功能说明**: 获取当前登录用户信息

**认证要求**: 需要登录

**响应格式**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "string",
    "email": "string",
    "full_name": "string",
    "nickname": "string",
    "bio": "string",
    "avatar_url": "string",
    "github_url": "string",
    "role": "string",
    "is_active": true,
    "is_admin": false,
    "created_at": "datetime",
    "last_login": "datetime"
  }
}
```

## 安全机制

### 密码安全
- 使用 bcrypt 进行密码哈希
- 密码最少6位字符
- 永不返回明文密码

### JWT 配置
- 默认过期时间: 30分钟
- 使用 HS256 算法签名
- 密钥通过环境变量配置

### 权限控制
- 普通用户: 访问自己的数据和公开资源
- 管理员: 访问所有资源

## 核心代码解析

### 安全模块 `app/core/security.py`

```python
# 密码哈希
def get_password_hash(password: str) -> str:
    """使用bcrypt对密码进行哈希"""
    return pwd_context.hash(password)

# 密码验证
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证明文密码与哈希密码是否匹配"""
    return pwd_context.verify(plain_password, hashed_password)

# 创建访问令牌
def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """创建JWT访问令牌"""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

# 验证令牌
def verify_access_token(token: str) -> Optional[str]:
    """验证JWT令牌并返回用户ID"""
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        return None
    return payload.get("sub")
```

### 依赖注入 `app/core/dependencies.py`

```python
# 获取当前用户（可选认证）
async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """从token中解析用户信息"""
    if token is None:
        return None
    user_id = verify_access_token(token)
    if user_id is None:
        return None
    return db.query(User).filter(User.id == int(user_id)).first()

# 获取当前用户（强制认证）
async def get_current_active_user(
    current_user: Optional[User] = Depends(get_current_user)
) -> User:
    """必须登录才能访问"""
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return current_user
```

## 接口设计说明

### RESTful 规范
- 使用 `POST` 进行资源创建
- 使用 `GET` 进行资源读取
- 使用 `PUT` 进行资源更新
- 使用 `DELETE` 进行资源删除

### 认证方式
- 采用 OAuth2 Password Grant 模式
- Bearer Token 认证
- Token 通过 `Authorization` 头传递

### 错误响应格式
```json
{
  "success": false,
  "message": "错误描述",
  "detail": "详细错误信息"
}
```

## 常见问题处理

### Q: 注册时提示用户名已存在
**A**: 检查数据库中是否已存在同名用户，或用户名包含非法字符

### Q: 登录后token过期
**A**: 前端需要在token过期前刷新token，或重新登录

### Q: 如何修改JWT过期时间
**A**: 修改环境变量 `ACCESS_TOKEN_EXPIRE_MINUTES`

### Q: 如何实现token黑名单
**A**: 可使用 Redis 存储已撤销的 token，然后在 `verify_access_token` 中检查

## 测试用例

```python
def test_register_success(client):
    """测试成功注册"""
    response = client.post("/api/v1/auth/register", json={
        "username": "newuser",
        "email": "new@example.com",
        "password": "password123"
    })
    assert response.status_code == 201

def test_login_wrong_password(client, test_user):
    """测试密码错误"""
    response = client.post("/api/v1/auth/login", json={
        "username": "testuser",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
```
