@echo off
chcp 65001 >nul
set "ORG_DIR=%CD%"

REM PicoClaw Local Development Script (Single Port)
REM Builds frontend then starts backend from source on http://localhost:18800

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
    echo [ERROR] picoclaw directory not found
    echo Please run init.ps1 first
    exit /b 1
)

echo [INFO] Working directory: %APP_DIR%
echo [INFO] All services on: http://localhost:18800
echo.

REM Set environment variables
set "PICOCLAW_CONFIG=%APP_DIR%\config.json"
set "PICOCLAW_HOME=%APP_DIR%"
set "PICOCLAW_LOG_DIR=%APP_DIR%\logs"

REM Ensure log directory exists
if not exist "%PICOCLAW_LOG_DIR%" mkdir "%PICOCLAW_LOG_DIR%"

REM Step 1: Build Frontend
echo === Step 1: Building Frontend ===
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

echo [INFO] Building frontend to backend/dist...
call npm run build
if errorlevel 1 (
    echo [ERROR] Frontend build failed
    exit /b 1
)

REM Return to app directory before proceeding to backend
cd /d "%APP_DIR%"

REM Copy dist to backend  
cd /d "%FRONTEND_DIR%"
if exist "%BACKEND_DIR%\dist" rmdir /S /Q "%BACKEND_DIR%\dist"
xcopy /E /I /Y "%FRONTEND_DIR%\dist\*" "%BACKEND_DIR%\dist\"
echo [SUCCESS] Frontend built and copied
echo.

REM Step 2: Start Backend from Source - with config file and logs directory
echo === Step 2: Starting Backend (from source) ===
echo.
echo [ENVIRONMENT] PICOCLAW_CONFIG: %PICOCLAW_CONFIG_PATH%
echo [ENVIRONMENT] PICOCLAW_LOG_DIR: %PICOCLAW_LOG_DIR%
echo.
echo [INFO] Starting backend from source...
echo [INFO] URL: http://localhost:18800
echo [INFO] Features:
echo   - Frontend: http://localhost:18800/
echo   - API:      http://localhost:18800/api/...
echo   - Backend:  Code changes reflect immediately
echo.
echo Press Ctrl+C to stop
echo.

REM Start backend from source in the backend directory
cd /d "%BACKEND_DIR%"
go run . -console %PICOCLAW_CONFIG_PATH%

REM Restore original directory after go run is done
cd /d "%ORG_DIR%"
