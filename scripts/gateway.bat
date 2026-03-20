@echo off
chcp 65001 >nul
set "ORG_DIR=%CD%"

REM PicoClaw Gateway Development Script
REM Starts the PicoClaw Gateway service on http://localhost:18790

echo ========================================
echo PicoClaw Gateway Service
echo ========================================
echo.

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "APP_DIR=%SCRIPT_DIR%.."
set "PICOCLAW_DIR=%APP_DIR%\picoclaw"
set "GATEWAY_DIR=%PICOCLAW_DIR%\cmd\picoclaw"

REM Check directories exist
if not exist "%PICOCLAW_DIR%" (
    echo [ERROR] picoclaw directory not found
    echo Please run init.ps1 first
    exit /b 1
)

if not exist "%GATEWAY_DIR%" (
    echo [ERROR] Gateway directory not found: %GATEWAY_DIR%
    exit /b 1
)

REM Set environment variables
set "PICOCLAW_CONFIG=%APP_DIR%\config.json"
set "PICOCLAW_HOME=%APP_DIR%"
set "PICOCLAW_LOG_DIR=%APP_DIR%\logs"

REM Ensure log directory exists
if not exist "%PICOCLAW_LOG_DIR%" mkdir "%PICOCLAW_LOG_DIR%"

echo [INFO] Working directory: %APP_DIR%
echo [INFO] Gateway will start on: http://localhost:18790
echo.

REM Start Gateway from source
echo === Starting Gateway (from source) ===
cd /d "%PICOCLAW_DIR%"

echo [INFO] Starting gateway from source...
echo [INFO] Gateway URL: http://localhost:18790
echo [INFO] Health check URL: http://localhost:18790/health
echo.
echo Press Ctrl+C to stop
echo.

REM Set log directory environment variable and start gateway from source with config file
set "PICOCLAW_LOG_DIR=%APP_DIR%\logs"
set "PICOCLAW_CONFIG=%PICOCLAW_CONFIG_PATH%"
go run ./cmd/picoclaw gateway -E
set GO_EXIT_CODE=%errorlevel%
if %GO_EXIT_CODE% neq 0 (
    echo [ERROR] Gateway failed with exit code: %GO_EXIT_CODE%
    exit /b %GO_EXIT_CODE%
) else (
    echo [INFO] Gateway started successfully
)

REM Restore original directory
cd /d "%ORG_DIR%"