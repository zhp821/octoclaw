@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM PicoClaw App Initialization Script (Batch)
REM Usage: init.bat [force] [skipsync]

set FORCE=
set SKIPSYNC=

if "%1"=="force" set FORCE=1
if "%1"=="-force" set FORCE=1
if "%1"=="-Force" set FORCE=1
if "%2"=="force" set FORCE=1
if "%2"=="-force" set FORCE=1
if "%2"=="-Force" set FORCE=1

if "%1"=="skipsync" set SKIPSYNC=1
if "%1"=="-skipsync" set SKIPSYNC=1
if "%1"=="-SkipSync" set SKIPSYNC=1
if "%2"=="skipsync" set SKIPSYNC=1
if "%2"=="-skipsync" set SKIPSYNC=1
if "%2"=="-SkipSync" set SKIPSYNC=1

echo.
echo === PicoClaw App - Code Sync ===
echo.

REM Check Git
echo === Checking Git ===
where git >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git not found. Download: https://git-scm.com/downloads
    exit /b 1
)
echo [SUCCESS] Git OK
echo.

REM Init/Update Submodule
echo === Initializing Submodule ===
cd /d "%~dp0.."
set AppDir=%CD%
set PicoclawDir=%AppDir%\picoclaw

if defined FORCE (
    if exist "%PicoclawDir%" (
        echo [WARNING] Force mode: removing old submodule...
        rmdir /s /q "%PicoclawDir%"
    )
)

if not exist "%PicoclawDir%" (
    echo [INFO] Cloning submodule...
    git submodule update --init --recursive
    if errorlevel 1 (
        echo [ERROR] Failed to clone submodule
        exit /b 1
    )
) else (
    echo [INFO] Submodule exists, updating...
    git submodule update --recursive --remote
)
echo [SUCCESS] Submodule OK
echo.

REM Configure Upstream
echo === Configuring Upstream Remote ===
cd /d "%PicoclawDir%"
set UpstreamUrl=https://github.com/sipeed/picoclaw.git

git remote get-url upstream >nul 2>&1
if errorlevel 1 (
    echo [INFO] Adding upstream remote...
    git remote add upstream %UpstreamUrl%
) else (
    echo [INFO] Upstream remote exists
)
echo [SUCCESS] Upstream configured
echo.

REM Merge Upstream
if not defined SKIPSYNC (
    echo === Merging Upstream Latest ===
    git fetch upstream
    if errorlevel 1 (
        echo [WARNING] Failed to fetch upstream
    ) else (
        echo [INFO] Stashing local changes...
        git stash push -u -q --include-untracked 2>nul
        if errorlevel 1 (
            echo [INFO] No local changes to stash
        )
        git checkout main
        git merge upstream/main --no-edit --quiet
        if errorlevel 1 (
            echo [WARNING] Merge conflicts detected. Restoring local changes...
            git merge --abort
            git stash pop -q 2>nul
        ) else (
            echo [SUCCESS] Merged upstream latest
            echo [INFO] Restoring local changes...
            git stash pop -q 2>nul
        )
    )
    echo.
)

echo === Initialization Complete ===
echo.
if defined SKIPSYNC (
    echo [INFO] Skipped upstream sync (use without -SkipSync to sync)
) else (
    echo [INFO] Run with -SkipSync to skip upstream sync
)
echo.
