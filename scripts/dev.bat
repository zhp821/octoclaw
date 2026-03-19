@echo off
chcp 65001

REM PicoClaw Local Development Script
REM This script starts both frontend and backend for local development

echo ========================================
echo PicoClaw Local Development
echo ========================================
echo.

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "APP_DIR=%SCRIPT_DIR%.."
set "PICOCLAW_DIR=%APP_DIR%\picoclaw"
set "FRONTEND_DIR=%PICOCLAW_DIR%\web\frontend"
set "BACKEND_DIR=%PICOCLAW_DIR%\web\backend"

REM Check directories exist
if not exist "%PICOCLAW_DIR%" (
    echo [ERROR] picoclaw directory not found: %PICOCLAW_DIR%
    echo Please run init.ps1 first
    exit /b 1
)

echo [INFO] Working directory: %APP_DIR%
echo [INFO] Frontend: %FRONTEND_DIR%
echo [INFO] Backend: %BACKEND_DIR%
echo.

REM Step 1: Start Backend
echo === Starting Go Backend ===
cd /d "%BACKEND_DIR%"

REM Build and run backend
echo [INFO] Building backend...
go build -o picoclaw-web.exe .
if errorlevel 1 (
    echo [ERROR] Backend build failed
    exit /b 1
)

echo [INFO] Starting backend on http://localhost:18800
echo [INFO] API docs: http://localhost:18800/api
echo.
start "PicoClaw Backend" cmd /k "cd /d %BACKEND_DIR% && picoclaw-web.exe"

REM Wait for backend to start
timeout /t 3 /nobreak > nul

REM Step 2: Start Frontend Dev Server
echo === Starting Frontend Dev Server ===
cd /d "%FRONTEND_DIR%"

REM Check node_modules
if not exist "node_modules" (
    echo [INFO] Installing npm dependencies...
    npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed
        exit /b 1
    )
)

echo [INFO] Starting frontend dev server on http://localhost:5173
echo [INFO] Frontend will auto-reload on code changes
echo.
start "PicoClaw Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"

echo.
echo ========================================
echo [SUCCESS] Development servers started!
echo ========================================
echo.
echo Backend:  http://localhost:18800
echo Frontend: http://localhost:5173
echo.
echo API Endpoints:
echo   - http://localhost:18800/api/models
echo   - http://localhost:18800/api/config
echo   - http://localhost:18800/api/gateway/status
echo.
echo Frontend Dev Features:
echo   - Hot reload: Changes appear instantly
echo   - Source maps: Debug in browser
echo   - Proxy: API calls auto-forwarded to backend
echo.
echo Press any key to stop all servers...
pause > nul

REM Stop servers
taskkill /F /IM picoclaw-web.exe 2>nul
taskkill /F /IM node.exe 2>nul

echo.
echo [INFO] Servers stopped
echo.
