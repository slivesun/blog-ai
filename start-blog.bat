@echo off
chcp 65001 >nul

:: 从配置文件读取路径
set "CONF_FILE=%~dp0blog-start.conf"
if not exist "%CONF_FILE%" (
    echo [错误] 未找到配置文件: %CONF_FILE%
    echo 请先运行 deploy-windows.bat 生成配置
    pause
    exit /b 1
)

for /f "usebackq tokens=1,* delims==" %%a in ("%CONF_FILE%") do (
    if "%%a"=="BLOG_DIR" set "BLOG_DIR=%%b"
    if "%%a"=="NGINX_DIR" set "NGINX_DIR=%%b"
    if "%%a"=="SERVER_IP" set "SERVER_IP=%%b"
)

echo ==========================================
echo   Blog 博客系统 - 启动
echo ==========================================
echo.

echo [1] 检查后端端口占用...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8000" ^| findstr LISTENING') do (
    echo   发现端口 8000 被 PID %%p 占用，准备结束...
    taskkill /F /PID %%p >nul 2>&1
)

echo [2] 检查并重启后端服务...
tasklist | findstr /I "uvicorn.exe" >nul 2>&1
if not errorlevel 1 (
    echo   发现已有 uvicorn 进程运行，正在结束...
    taskkill /F /IM uvicorn.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
    echo   旧进程已结束，重新启动后端...
) else (
    echo   未发现运行中的后端进程，启动后端...
)
start "Blog Backend" cmd /c "%BLOG_DIR%\start-backend.bat"
timeout /t 3 /nobreak >nul

echo [3] 启动 Nginx...
taskkill /F /IM nginx.exe 2>nul
cd /d "%NGINX_DIR%"
start "Blog Nginx" nginx.exe

echo.
echo ==========================================
echo   启动完成！
echo   访问地址 = http://%SERVER_IP%
echo   API 文档 = http://%SERVER_IP%/docs
echo ==========================================
echo.
pause
