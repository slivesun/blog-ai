@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ==========================================
echo   Blog 博客系统 - Windows 部署脚本
echo ==========================================
echo.

:: ============================================
:: 配置区域（按需修改）
:: ============================================
set "BLOG_DIR=C:\blog"
set "NGINX_DIR=C:\nginx"
set "SERVER_IP=120.26.209.105"

:: ============================================
:: 第一步：检查依赖
:: ============================================
echo [1/6] 检查依赖...

python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Python，请先安装 Python 3.11
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js LTS
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo   Python: OK
echo   Node.js: OK

:: ============================================
:: 第二步：构建前端
:: ============================================
echo.
echo [2/6] 构建前端...

cd /d "%BLOG_DIR%\blog-ui"

if not exist "node_modules" (
    echo   安装前端依赖...
    call npm install
    if errorlevel 1 (
        echo [错误] npm install 失败
        pause
        exit /b 1
    )
)

echo   构建前端项目...
call npm run build
if errorlevel 1 (
    echo [错误] 前端构建失败
    pause
    exit /b 1
)
echo   前端构建完成: dist\

:: ============================================
:: 第三步：配置后端
:: ============================================
echo.
echo [3/6] 配置后端...

cd /d "%BLOG_DIR%\blog-server"

:: 创建虚拟环境
if not exist "venv" (
    echo   创建 Python 虚拟环境...
    python -m venv venv
)

:: 激活虚拟环境并安装依赖
call venv\Scripts\activate.bat
echo   安装后端依赖...
pip install -r requirements.txt -q
if errorlevel 1 (
    echo [错误] pip install 失败
    pause
    exit /b 1
)

:: 创建数据目录
if not exist "data" mkdir data

:: 生成 .env 文件
if not exist ".env" (
    echo   生成环境配置...

    :: 生成随机 SECRET_KEY
    for /f "tokens=*" %%i in ('python -c "import secrets; print(secrets.token_hex(32))"') do set "SECRET_KEY=%%i"

    (
        echo SECRET_KEY=!SECRET_KEY!
        echo CORS_ORIGINS=http://%SERVER_IP%
        echo VITE_API_BASE_URL=/api/v1
        echo DATABASE_URL=sqlite:///./data/blog.db
        echo ENVIRONMENT=production
        echo DEBUG=false
        echo CREATE_DEFAULT_ADMIN=false
    ) > .env

    echo   .env 已生成
) else (
    echo   .env 已存在，跳过
)

:: ============================================
:: 第四步：初始化数据库
:: ============================================
echo.
echo [4/6] 初始化数据库...

python scripts\init_db.py 2>nul
echo   数据库初始化完成

:: ============================================
:: 第五步：配置 Nginx
:: ============================================
echo.
echo [5/6] 配置 Nginx...

if not exist "%NGINX_DIR%" (
    echo.
    echo   [提示] 请手动安装 Nginx for Windows:
    echo   1. 下载: http://nginx.org/en/download.html （选 Stable 版本）
    echo   2. 解压到 %NGINX_DIR%
    echo   3. 重新运行此脚本
    echo.
    pause
    exit /b 1
)

:: 复制前端文件到 nginx html 目录
if exist "%NGINX_DIR%\html" rmdir /s /q "%NGINX_DIR%\html"
xcopy /E /I /Q "%BLOG_DIR%\blog-ui\dist\*" "%NGINX_DIR%\html\" >nul

:: 复制 nginx 配置
copy /Y "%BLOG_DIR%\nginx-windows.conf" "%NGINX_DIR%\conf\nginx.conf" >nul
echo   Nginx 配置完成

:: ============================================
:: 第六步：创建启动脚本
:: ============================================
echo.
echo [6/6] 创建启动脚本...

:: 创建后端启动脚本
(
    echo @echo off
    echo chcp 65001 ^>nul
    echo cd /d "%BLOG_DIR%\blog-server"
    echo call venv\Scripts\activate.bat
    echo echo 启动 Blog 后端服务...
    echo uvicorn app.main:app --host 0.0.0.0 --port 8000
    echo pause
) > "%BLOG_DIR%\start-backend.bat"

:: 创建一键启动脚本
(
    echo @echo off
    echo chcp 65001 ^>nul
    echo echo ==========================================
    echo echo   Blog 博客系统 - 启动
    echo echo ==========================================
    echo echo.
    echo.
    echo echo [1] 启动后端服务...
    echo start "Blog Backend" cmd /c "%BLOG_DIR%\start-backend.bat"
    echo timeout /t 3 /nobreak ^>nul
    echo.
    echo echo [2] 启动 Nginx...
    echo cd /d "%NGINX_DIR%"
    echo start "Blog Nginx" nginx.exe
    echo.
    echo echo ==========================================
    echo echo   启动完成！
    echo echo   访问地址: http://%SERVER_IP%
    echo echo   API 文档: http://%SERVER_IP%/docs
    echo echo ==========================================
    echo echo.
    echo pause
) > "%BLOG_DIR%\start-blog.bat"

echo   启动脚本已创建

:: ============================================
:: 完成
:: ============================================
echo.
echo ==========================================
echo   部署准备完成！
echo ==========================================
echo.
echo   后续步骤:
echo   1. 下载安装 Nginx: http://nginx.org/en/download.html
echo      解压到 %NGINX_DIR%
echo   2. 运行 %BLOG_DIR%\start-blog.bat 启动服务
echo   3. 阿里云安全组开放 80 端口
echo   4. 访问 http://%SERVER_IP%
echo.
echo   文件位置:
echo     项目目录: %BLOG_DIR%
echo     后端:     %BLOG_DIR%\blog-server
echo     前端构建: %BLOG_DIR%\blog-ui\dist
echo     Nginx:    %NGINX_DIR%
echo.
pause
