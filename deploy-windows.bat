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
:: 自动获取脚本所在目录（即项目根目录）
set "BLOG_DIR=%~dp0"
:: 去掉末尾的反斜杠
if "%BLOG_DIR:~-1%"=="\" set "BLOG_DIR=%BLOG_DIR:~0,-1%"
set "NGINX_DIR=C:\Users\Administrator\nginx-1.30.2"
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
    set "INSTALL_OK=0"

    :: 方式1: npm install
    call npm install >nul 2>&1
    if not errorlevel 1 (
        set "INSTALL_OK=1"
        echo   [方式1] npm install 成功
    )

    :: 方式2: npm.cmd install（解决 call npm 路径问题）
    if "%INSTALL_OK%"=="0" (
        echo   [方式1] 失败，尝试 npm.cmd...
        call npm.cmd install >nul 2>&1
        if not errorlevel 1 (
            set "INSTALL_OK=1"
            echo   [方式2] npm.cmd install 成功
        )
    )

    :: 方式3: node + npm-cli.js 直接执行
    if "%INSTALL_OK%"=="0" (
        echo   [方式2] 失败，尝试 node 直接执行 npm...
        for /f "tokens=*" %%p in ('where npm 2^>nul') do set "NPM_PATH=%%p"
        if defined NPM_PATH (
            call node "%NPM_PATH%" install
            if not errorlevel 1 (
                set "INSTALL_OK=1"
                echo   [方式3] node npm install 成功
            )
        )
    )

    if "%INSTALL_OK%"=="0" (
        echo [错误] npm install 失败，所有方式均尝试过
        pause
        exit /b 1
    )
    echo   依赖安装完成
)

echo   构建前端项目...
set "BUILD_OK=0"

:: 方式1: npm run build
call npm run build 2>nul
if not errorlevel 1 (
    set "BUILD_OK=1"
    echo   [方式1] npm run build 成功
)

:: 方式2: npx vite build
if "%BUILD_OK%"=="0" (
    echo   [方式1] npm run build 失败，尝试 npx...
    call npx vite build 2>nul
    if not errorlevel 1 (
        set "BUILD_OK=1"
        echo   [方式2] npx vite build 成功
    )
)

:: 方式3: 直接调用 node 执行 vite.js
if "%BUILD_OK%"=="0" (
    echo   [方式2] npx 失败，尝试 node 直接执行...
    call node "%BLOG_DIR%\blog-ui\node_modules\vite\bin\vite.js" build
    if not errorlevel 1 (
        set "BUILD_OK=1"
        echo   [方式3] node vite.js build 成功
    )
)

:: 方式4: 直接调用 vite.cmd
if "%BUILD_OK%"=="0" (
    echo   [方式3] node 执行失败，尝试 vite.cmd...
    call "%BLOG_DIR%\blog-ui\node_modules\.bin\vite.cmd" build
    if not errorlevel 1 (
        set "BUILD_OK=1"
        echo   [方式4] vite.cmd build 成功
    )
)

if "%BUILD_OK%"=="0" (
    echo [错误] 前端构建失败，所有方式均尝试过
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
    if errorlevel 1 (
        echo [错误] 创建虚拟环境失败
        pause
        exit /b 1
    )
)

:: 设置 venv 中 python/pip 的完整路径（避免依赖 activate）
set "VENV_PYTHON=%BLOG_DIR%\blog-server\venv\Scripts\python.exe"
set "VENV_PIP=%BLOG_DIR%\blog-server\venv\Scripts\pip.exe"

:: 验证 venv 可用
"%VENV_PYTHON%" --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 虚拟环境 Python 不可用，删除重建...
    rmdir /s /q venv
    python -m venv venv
)

echo   安装后端依赖...
set "PIP_OK=0"

:: 方式1: 直接用 venv pip.exe 完整路径（最可靠）
"%VENV_PIP%" install -r requirements.txt -q
if not errorlevel 1 (
    set "PIP_OK=1"
    echo   [方式1] venv pip.exe 成功
)

:: 方式2: 用 venv python -m pip
if "%PIP_OK%"=="0" (
    echo   [方式1] 失败，尝试 python -m pip...
    "%VENV_PYTHON%" -m pip install -r requirements.txt -q
    if not errorlevel 1 (
        set "PIP_OK=1"
        echo   [方式2] python -m pip 成功
    )
)

:: 方式3: 先升级 pip 再重试
if "%PIP_OK%"=="0" (
    echo   [方式2] 失败，升级 pip 后重试...
    "%VENV_PYTHON%" -m pip install --upgrade pip >nul 2>&1
    "%VENV_PIP%" install -r requirements.txt -q
    if not errorlevel 1 (
        set "PIP_OK=1"
        echo   [方式3] 升级 pip 后成功
    )
)

:: 方式4: 用全局 python 的 pip（最后兜底）
if "%PIP_OK%"=="0" (
    echo   [方式3] 失败，尝试全局 pip...
    pip install -r requirements.txt -q
    if not errorlevel 1 (
        set "PIP_OK=1"
        echo   [方式4] 全局 pip 成功
    )
)

if "%PIP_OK%"=="0" (
    echo.
    echo [错误] pip install 失败，所有方式均尝试过
    echo   请手动执行以下命令查看详细错误:
    echo   cd %BLOG_DIR%\blog-server
    echo   venv\Scripts\pip.exe install -r requirements.txt
    pause
    exit /b 1
)
echo   后端依赖安装完成

:: 创建数据目录
if not exist "data" mkdir data

:: 生成 .env 文件
if not exist ".env" (
    echo   生成环境配置...

    :: 生成随机 SECRET_KEY（带兜底）
    set "SECRET_KEY="
    for /f "tokens=*" %%i in ('python -c "import secrets; print(secrets.token_hex(32))" 2^>nul') do set "SECRET_KEY=%%i"
    if not defined SECRET_KEY (
        echo   [警告] python 生成密钥失败，使用备用方式...
        for /f "tokens=*" %%i in ('python3 -c "import secrets; print(secrets.token_hex(32))" 2^>nul') do set "SECRET_KEY=%%i"
    )
    if not defined SECRET_KEY (
        :: 最终兜底：用 PowerShell 生成随机字符串
        for /f "tokens=*" %%i in ('powershell -Command "[System.BitConverter]::ToString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).Replace('-','').ToLower()" 2^>nul') do set "SECRET_KEY=%%i"
    )

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
if errorlevel 1 (
    echo   [警告] python 初始化失败，尝试 python3...
    python3 scripts\init_db.py 2>nul
)
echo   数据库初始化完成

:: ============================================
:: 第五步：配置 Nginx
:: ============================================
echo.
echo [5/6] 配置 Nginx...

if not exist "%NGINX_DIR%\nginx.exe" (
    echo.
    echo   [提示] 未找到 Nginx，请确认路径: %NGINX_DIR%
    echo   如已安装在其他位置，请修改脚本顶部的 NGINX_DIR 变量
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
