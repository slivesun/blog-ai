@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ============================================
:: 博客系统 Windows Server 一键部署脚本
:: 用法: deploy-windows.bat [--skip-deps] [--skip-backup] [--skip-init] [--init]
:: ============================================

:: 解析命令行参数
set "SKIP_DEPS=0"
set "SKIP_BACKUP=0"
set "SKIP_INIT=0"
set "FORCE_INIT=0"

:parse_args
if "%~1"=="" goto :args_done
if /i "%~1"=="--skip-deps" set "SKIP_DEPS=1"
if /i "%~1"=="--skip-backup" set "SKIP_BACKUP=1"
if /i "%~1"=="--skip-init" set "SKIP_INIT=1"
if /i "%~1"=="--init" set "FORCE_INIT=1"
shift
goto :parse_args
:args_done

:: ============================================
:: 颜色输出 (使用 ANSI 转义码, Windows 10+)
:: ============================================
set "ESC="
set "RED=%ESC%[91m"
set "GREEN=%ESC%[92m"
set "YELLOW=%ESC%[93m"
set "BLUE=%ESC%[94m"
set "CYAN=%ESC%[96m"
set "RESET=%ESC%[0m"

:: ============================================
:: 配置项 (根据实际环境修改)
:: ============================================
set "PROJECT_DIR=C:\Users\Administrator\Desktop\blog-ai"
set "NGINX_DIR=C:\Users\Administrator\nginx-1.30.2"
set "BACKEND_PORT=8000"
set "PYTHON_VENV=%PROJECT_DIR%\blog-server\venv"

:: ============================================
:: 开始部署
:: ============================================
echo.
echo %CYAN%╔════════════════════════════════════════════════╗%RESET%
echo %CYAN%║        博客系统 Windows Server 部署脚本        ║%RESET%
echo %CYAN%╚════════════════════════════════════════════════╝%RESET%
echo.
echo %BLUE%[信息]%RESET% 项目目录: %PROJECT_DIR%
echo %BLUE%[信息]%RESET% Nginx 目录: %NGINX_DIR%
echo %BLUE%[信息]%RESET% 后端端口: %BACKEND_PORT%
echo.

:: ============================================
:: 0. 检测是否在 Git 仓库中
:: ============================================
echo %BLUE%[步骤 0/8]%RESET% 检测项目目录...
cd /d "%PROJECT_DIR%" 2>nul
if errorlevel 1 (
    echo %RED%[错误]%RESET% 项目目录不存在: %PROJECT_DIR%
    echo 请修改脚本顶部的 PROJECT_DIR 配置
    pause
    exit /b 1
)

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo %RED%[错误]%RESET% 项目目录不是 Git 仓库
    pause
    exit /b 1
)
echo %GREEN%[完成]%RESET% 项目目录检测通过

:: ============================================
:: 1. Git 拉取最新代码
:: ============================================
echo.
echo %BLUE%[步骤 1/8]%RESET% 拉取最新代码...
git pull
if errorlevel 1 (
    echo %RED%[错误]%RESET% Git 拉取失败，请检查网络连接
    set "PULL_OK=0"
    echo %YELLOW%[警告]%RESET% 将使用本地现有代码继续部署
) else (
    set "PULL_OK=1"
    echo %GREEN%[完成]%RESET% 代码更新成功
)

:: ============================================
:: 2. 询问是否重新初始化数据库
:: ============================================
echo.
set "DO_INIT=0"

if "%FORCE_INIT%"=="1" (
    set "DO_INIT=1"
    echo %YELLOW%[数据库]%RESET% 通过 --init 参数强制初始化数据库
    goto :init_decided
)

if "%SKIP_INIT%"=="1" (
    set "DO_INIT=0"
    echo %YELLOW%[数据库]%RESET% 通过 --skip-init 参数跳过数据库初始化
    goto :init_decided
)

echo %YELLOW%[数据库]%RESET% 是否需要重新初始化数据库？
echo   仅在以下情况需要:
echo     - 首次部署
echo     - 数据库结构有变更（新增表或字段）
echo     - 数据库文件损坏或丢失
echo.
choice /c YN /m "输入 Y 重新初始化数据库，N 跳过（默认 N）"
if errorlevel 2 set "DO_INIT=0"
if errorlevel 1 set "DO_INIT=1"

:init_decided
if "%DO_INIT%"=="1" (
    echo %BLUE%[信息]%RESET% 将在后续步骤中执行数据库初始化
) else (
    echo %BLUE%[信息]%RESET% 将跳过数据库初始化
)

:: ============================================
:: 3. 检查并安装依赖（如果跳过则直接到步骤 4）
:: ============================================
if "%SKIP_DEPS%"=="1" (
    echo.
    echo %BLUE%[步骤 2/8]%RESET% 跳过依赖检查（--skip-deps）
    goto :skip_deps_section
)

echo.
echo %BLUE%[步骤 2/8]%RESET% 检查并安装依赖...

:: 检查 Python 虚拟环境
if not exist "%PYTHON_VENV%\Scripts\python.exe" (
    echo %YELLOW%[警告]%RESET% Python 虚拟环境不存在，正在创建...
    python -m venv "%PYTHON_VENV%"
    if errorlevel 1 (
        echo %RED%[错误]%RESET% 创建虚拟环境失败
        pause
        exit /b 1
    )
    echo %GREEN%[完成]%RESET% 虚拟环境创建成功
)

:: 安装 Python 依赖
echo %BLUE%[信息]%RESET% 安装 Python 依赖...
"%PYTHON_VENV%\Scripts\pip.exe" install -r "%PROJECT_DIR%\blog-server\requirements.txt" --quiet --disable-pip-version-check 2>nul
if errorlevel 1 (
    echo %YELLOW%[警告]%RESET% pip 安装出现问题，尝试使用国内镜像源...
    "%PYTHON_VENV%\Scripts\pip.exe" install -r "%PROJECT_DIR%\blog-server\requirements.txt" -i https://pypi.tuna.tsinghua.edu.cn/simple --quiet --disable-pip-version-check
)
echo %GREEN%[完成]%RESET% Python 依赖安装完成

:: 检查 Node.js 依赖
if not exist "%PROJECT_DIR%\blog-ui\node_modules" (
    echo %YELLOW%[警告]%RESET% Node.js 依赖未安装，正在安装...
    cd /d "%PROJECT_DIR%\blog-ui"
    npm install --registry https://registry.npmmirror.com
    if errorlevel 1 (
        echo %RED%[错误]%RESET% npm install 失败
        pause
        exit /b 1
    )
    echo %GREEN%[完成]%RESET% Node.js 依赖安装完成
) else (
    echo %GREEN%[完成]%RESET% 依赖检查通过
)

:skip_deps_section

:: ============================================
:: 4. 检测并处理 8000 端口占用
:: ============================================
echo.
echo %BLUE%[步骤 3/8]%RESET% 检测端口 %BACKEND_PORT% 占用...
set "PORT_PID="
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%BACKEND_PORT%" ^| findstr "LISTENING"') do (
    set "PORT_PID=%%a"
)

if defined PORT_PID (
    echo %YELLOW%[警告]%RESET% 端口 %BACKEND_PORT% 被进程 %PORT_PID% 占用
    echo %BLUE%[信息]%RESET% 正在停止旧进程...
    taskkill /PID %PORT_PID% /F >nul 2>&1
    if errorlevel 1 (
        echo %YELLOW%[警告]%RESET% 无法停止进程，可能需要管理员权限
    ) else (
        echo %GREEN%[完成]%RESET% 旧进程已停止
        :: 等待端口释放
        timeout /t 2 /nobreak >nul
    )
) else (
    echo %GREEN%[完成]%RESET% 端口 %BACKEND_PORT% 可用
)

:: ============================================
:: 5. 构建前端
:: ============================================
echo.
echo %BLUE%[步骤 4/8]%RESET% 构建前端项目...
cd /d "%PROJECT_DIR%\blog-ui"

:: 删除旧的构建文件
if exist "dist" (
    echo %BLUE%[信息]%RESET% 清理旧的构建文件...
    rd /s /q "dist"
)

:: 尝试多种方式构建
set "BUILD_OK=0"

:: 方式 1: npm run build
echo %BLUE%[信息]%RESET% 尝试 npm run build...
call npm run build >nul 2>&1
if not errorlevel 1 (
    set "BUILD_OK=1"
    goto :build_done
)

:: 方式 2: npx vite build
echo %YELLOW%[警告]%RESET% npm run build 失败，尝试 npx vite build...
call npx vite build >nul 2>&1
if not errorlevel 1 (
    set "BUILD_OK=1"
    goto :build_done
)

:: 方式 3: 直接调用 vite.js
echo %YELLOW%[警告]%RESET% npx 失败，尝试直接调用 vite...
if exist "node_modules\.bin\vite.js" (
    node node_modules\.bin\vite.js build >nul 2>&1
    if not errorlevel 1 (
        set "BUILD_OK=1"
        goto :build_done
    )
)

:: 方式 4: 使用 vite.cmd
if exist "node_modules\.bin\vite.cmd" (
    call node_modules\.bin\vite.cmd build >nul 2>&1
    if not errorlevel 1 (
        set "BUILD_OK=1"
        goto :build_done
    )
)

:build_done
if "%BUILD_OK%"=="0" (
    echo %RED%[错误]%RESET% 前端构建失败
    echo 请检查 Node.js 版本和依赖是否正确安装
    pause
    exit /b 1
)
echo %GREEN%[完成]%RESET% 前端构建成功

:: ============================================
:: 6. 复制前端文件到 Nginx
:: ============================================
echo.
echo %BLUE%[步骤 5/8]%RESET% 复制前端文件到 Nginx...
cd /d "%PROJECT_DIR%"

:: 检查构建产物
if not exist "blog-ui\dist\index.html" (
    echo %RED%[错误]%RESET% 前端构建产物不存在
    pause
    exit /b 1
)

:: 创建 uploads 目录
if not exist "%NGINX_DIR%\html\uploads\images" (
    mkdir "%NGINX_DIR%\html\uploads\images"
)

:: 复制前端文件（不覆盖 uploads）
echo %BLUE%[信息]%RESET% 正在复制文件...
:: 先复制 index.html
copy /y "blog-ui\dist\index.html" "%NGINX_DIR%\html\index.html" >nul 2>&1

:: 复制 assets 目录（JS、CSS 等）
if exist "blog-ui\dist\assets" (
    if not exist "%NGINX_DIR%\html\assets" mkdir "%NGINX_DIR%\html\assets"
    xcopy /y /e /i "blog-ui\dist\assets\*" "%NGINX_DIR%\html\assets\" >nul 2>&1
)

:: 复制其他静态文件（如 favicon.ico, images 等）
for %%f in (blog-ui\dist\*) do (
    if /i not "%%~nxf"=="index.html" (
        copy /y "%%f" "%NGINX_DIR%\html\" >nul 2>&1
    )
)

:: 复制子目录（排除 assets，已单独处理）
for /d %%d in (blog-ui\dist\*) do (
    if /i not "%%~nxd"=="assets" (
        xcopy /y /e /i "%%d\*" "%NGINX_DIR%\html\%%~nxd\" >nul 2>&1
    )
)

echo %GREEN%[完成]%RESET% 前端文件复制完成

:: ============================================
:: 7. 更新 Nginx 配置
:: ============================================
echo.
echo %BLUE%[步骤 6/8]%RESET% 更新 Nginx 配置...

:: 检查 nginx-windows.conf 是否更新
fc /b "nginx-windows.conf" "%NGINX_DIR%\conf\nginx.conf" >nul 2>&1
if errorlevel 1 (
    echo %BLUE%[信息]%RESET% 检测到 Nginx 配置变更，正在更新...
    copy /y "nginx-windows.conf" "%NGINX_DIR%\conf\nginx.conf" >nul 2>&1
    if errorlevel 1 (
        echo %YELLOW%[警告]%RESET% Nginx 配置复制失败（可能需要管理员权限）
    ) else (
        echo %GREEN%[完成]%RESET% Nginx 配置已更新
    )
) else (
    echo %GREEN%[完成]%RESET% Nginx 配置无变化，跳过更新
)

:: 复制前端文件到 Nginx HTML 目录
xcopy /y /e "%PROJECT_DIR%\blog-ui\dist\*" "%NGINX_DIR%\html\" >nul 2>&1
echo %GREEN%[完成]%RESET% 前端文件已复制到 Nginx

:: 创建 uploads 目录
if not exist "%NGINX_DIR%\html\uploads\images" (
    mkdir "%NGINX_DIR%\html\uploads\images"
)

:: ============================================
:: 8. 初始化/迁移数据库
:: ============================================
echo.
echo %BLUE%[步骤 7/8]%RESET% 数据库操作...
cd /d "%PROJECT_DIR%\blog-server"

if "%DO_INIT%"=="1" (
    :: 使用 Python 初始化数据库
    echo %BLUE%[信息]%RESET% 正在初始化数据库...
    "%PYTHON_VENV%\Scripts\python.exe" "%PROJECT_DIR%\blog-server\scripts\init_db.py"
    if errorlevel 1 (
        echo %RED%[错误]%RESET% 数据库初始化失败
        pause
        exit /b 1
    )
    echo %GREEN%[完成]%RESET% 数据库初始化成功
) else (
    echo %BLUE%[信息]%RESET% 跳过数据库初始化（未选择重新初始化）
)

:: ============================================
:: 9. 重启后端服务
:: ============================================
echo.
echo %BLUE%[步骤 8/8]%RESET% 重启后端服务...
cd /d "%PROJECT_DIR%\blog-server"

:: 再次检查端口（可能被其他进程占用）
set "PORT_PID2="
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%BACKEND_PORT%" ^| findstr "LISTENING"') do (
    set "PORT_PID2=%%a"
)

if defined PORT_PID2 (
    echo %BLUE%[信息]%RESET% 停止现有后端进程 %PORT_PID2%...
    taskkill /PID %PORT_PID2% /F >nul 2>&1
    timeout /t 2 /nobreak >nul
)

:: 启动新的后端服务
echo %BLUE%[信息]%RESET% 启动后端服务...
start "Blog Server" /min "%PYTHON_VENV%\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port %BACKEND_PORT%

:: 等待后端启动
echo %BLUE%[信息]%RESET% 等待后端服务启动...
timeout /t 3 /nobreak >nul

:: 检查后端是否启动成功
set "HEALTH_OK=0"
for /L %%i in (1,1,5) (
    curl -s -f http://127.0.0.1:%BACKEND_PORT%/health >nul 2>&1
    if not errorlevel 1 (
        set "HEALTH_OK=1"
        goto :health_done
    )
    timeout /t 2 /nobreak >nul
)

:health_done
if "%HEALTH_OK%"=="1" (
    echo %GREEN%[完成]%RESET% 后端服务启动成功
) else (
    echo %YELLOW%[警告]%RESET% 后端服务可能未完全启动，请手动检查
)

:: ============================================
:: 10. 重载 Nginx
:: ============================================
echo.
echo %BLUE%[信息]%RESET% 重载 Nginx 配置...
"%NGINX_DIR%\nginx.exe" -t >nul 2>&1
if errorlevel 1 (
    echo %RED%[错误]%RESET% Nginx 配置检查失败
    "%NGINX_DIR%\nginx.exe" -t
    pause
    exit /b 1
)

:: 检查 Nginx 是否已运行
tasklist /fi "imagename eq nginx.exe" 2>nul | find /i "nginx.exe" >nul
if errorlevel 1 (
    echo %BLUE%[信息]%RESET% Nginx 未运行，正在启动...
    cd /d "%NGINX_DIR%"
    start "Nginx" nginx.exe
) else (
    "%NGINX_DIR%\nginx.exe" -s reload
)
if errorlevel 1 (
    echo %YELLOW%[警告]%RESET% Nginx 重载失败，尝试重启...
    "%NGINX_DIR%\nginx.exe" -s stop >nul 2>&1
    timeout /t 2 /nobreak >nul
    cd /d "%NGINX_DIR%"
    start "Nginx" nginx.exe
)
echo %GREEN%[完成]%RESET% Nginx 已重载

:: ============================================
:: 11. 验证部署
:: ============================================
echo.
echo %BLUE%[信息]%RESET% 验证部署...
timeout /t 2 /nobreak >nul

:: 检查后端健康状态
curl -s -f http://127.0.0.1:%BACKEND_PORT%/health >nul 2>&1
if not errorlevel 1 (
    echo %GREEN%[完成]%RESET% 后端服务: 正常
) else (
    echo %RED%[错误]%RESET% 后端服务: 异常
)

:: 检查 Nginx
curl -s -f http://127.0.0.1 >nul 2>&1
if not errorlevel 1 (
    echo %GREEN%[完成]%RESET% Nginx 服务: 正常
) else (
    echo %YELLOW%[警告]%RESET% Nginx 服务: 异常（可能未配置 localhost）
)

:: ============================================
:: 部署完成
:: ============================================
echo.
echo %CYAN%╔════════════════════════════════════════════════╗%RESET%
echo %CYAN%║              部署完成！                         ║%RESET%
echo %CYAN%╚════════════════════════════════════════════════╝%RESET%
echo.
echo %GREEN%[✓]%RESET% 后端地址: http://127.0.0.1:%BACKEND_PORT%
echo %GREEN%[✓]%RESET% 前端地址: http://whzzzhy.xyz
echo %GREEN%[✓]%RESET% 健康检查: http://127.0.0.1:%BACKEND_PORT%/health
echo.
echo %BLUE%[提示]%RESET% 后端日志窗口已最小化，点击任务栏可查看
echo %BLUE%[提示]%RESET% 如需停止后端，关闭日志窗口或运行:
echo         taskkill /FI "WINDOWTITLE eq Blog Server*" /F
echo.
pause
