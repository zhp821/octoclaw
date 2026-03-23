# PicoClaw Local Development Script
#
# This script builds frontend then starts backend only
# Frontend + Backend both served on http://localhost:18800
#
# Usage:
#   .\scripts\dev.ps1           # Build frontend and start backend
#   .\scripts\dev.ps1 -back     # Start backend only (no rebuild)
#   .\scripts\dev.ps1 -dev     # Dev mode with Vite HMR (fast hot reload)

param(
    [switch]$back,
    [switch]$dev
)

$ErrorActionPreference = "Stop"

function Write-Step { param([string]$Message) Write-Host "`n=== $Message ===" -ForegroundColor Cyan }
function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Gray }
function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Error { param([string]$Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

$ScriptDir = Split-Path -Parent $PSCommandPath
$AppDir = Split-Path -Parent $ScriptDir
$PicoclawDir = Join-Path $AppDir "picoclaw"
$FrontendDir = Join-Path $PicoclawDir "web\frontend"
$BackendDir = Join-Path $PicoclawDir "web\backend"

$env:PICOCLAW_CONFIG = Join-Path $AppDir "config.json"
$env:PICOCLAW_HOME = $AppDir
$env:PICOCLAW_LOG_DIR = Join-Path $AppDir "logs"

Write-Step "PicoClaw Local Development"
Write-Info "Working directory: $AppDir"

if (-not (Test-Path $PicoclawDir)) {
    Write-Error "picoclaw directory not found. Run .\init.ps1 first"
    exit 1
}

if (-not (Test-Path $env:PICOCLAW_LOG_DIR)) {
    New-Item -ItemType Directory -Path $env:PICOCLAW_LOG_DIR -Force | Out-Null
}

if ($dev) {
    # Dev mode: start Vite dev server and backend concurrently
    Write-Step "Dev Mode: Vite HMR + Backend"
    Write-Info "Frontend: http://localhost:5173 (hot reload enabled)"
    Write-Info "API: Proxied to http://localhost:18800"
    Write-Info "Backend: http://localhost:18800"
    Write-Host "`nPress Ctrl+C to stop all services" -ForegroundColor Cyan

    # Install deps if needed
    if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
        Write-Info "Installing npm dependencies..."
        Set-Location $FrontendDir
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "npm install failed"
            exit 1
        }
        Set-Location $AppDir
    }

    # Start Vite dev server in background
    Write-Info "Starting Vite dev server..."
    $viteProc = Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory $FrontendDir -PassThru -NoNewWindow

    # Start backend
    Set-Location $BackendDir
    $env:PICOCLAW_LOG_DIR = $env:PICOCLAW_HOME
    try {
        go run . -console $env:PICOCLAW_CONFIG
    } finally {
        # Clean up Vite process on exit
        if (-not $viteProc.HasExited) {
            Stop-Process -Id $viteProc.Id -Force -ErrorAction SilentlyContinue
        }
        Set-Location $AppDir
    }

} elseif (-not $back) {
    # Build mode
    Write-Step "Step 1: Building Frontend"
    $originalDir = Get-Location
    try {
        Set-Location $FrontendDir

        if (-not (Test-Path "node_modules")) {
            Write-Info "Installing npm dependencies..."
            npm install
            if ($LASTEXITCODE -ne 0) {
                Write-Error "npm install failed"
                exit 1
            }
        }

        Write-Info "Building frontend to backend/dist..."
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Frontend build failed"
            exit 1
        }

        $FrontendDist = Join-Path $FrontendDir "dist"
        $BackendDist = Join-Path $BackendDir "dist"
        if (Test-Path $BackendDist) {
            Remove-Item "$BackendDist\*" -Recurse -Force -ErrorAction SilentlyContinue
        }
        Copy-Item "$FrontendDist\*" $BackendDist -Recurse -Force
        Write-Success "Frontend built and copied"
    } finally {
        Set-Location $originalDir
    }

    # Start backend
    Write-Step "Step 2: Starting Backend"
    $env:PICOCLAW_LOG_DIR = $env:PICOCLAW_HOME
    Write-Host "Backend: http://localhost:18800" -ForegroundColor Green
    Write-Host "Frontend: http://localhost:18800/" -ForegroundColor Gray
    Write-Host "`nPress Ctrl+C to stop" -ForegroundColor Cyan

    $originalDir = Get-Location
    try {
        Set-Location $BackendDir
        go run . -console $env:PICOCLAW_CONFIG
    } catch {
        Write-Error "Backend failed: $_"
        exit 1
    } finally {
        Set-Location $originalDir
    }

} else {
    # Backend only
    Write-Step "Starting Backend Only"
    $env:PICOCLAW_LOG_DIR = $env:PICOCLAW_HOME
    Write-Host "Backend: http://localhost:18800" -ForegroundColor Green
    Write-Host "`nPress Ctrl+C to stop" -ForegroundColor Cyan

    $originalDir = Get-Location
    try {
        Set-Location $BackendDir
        go run . -console $env:PICOCLAW_CONFIG
    } catch {
        Write-Error "Backend failed: $_"
        exit 1
    } finally {
        Set-Location $originalDir
    }
}
