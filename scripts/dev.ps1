# PicoClaw Local Development Script (Single Port)
#
# This script builds frontend then starts backend only
# Frontend + Backend both served on http://localhost:18800
#
# Usage:
#   .\scripts\dev.ps1           # Build frontend and start backend
#   .\scripts\dev.ps1 -back     # Start backend only (no rebuild)
#   .\scripts\dev.ps1 -watch    # Watch mode (rebuild on changes)

param(
    [switch]$back,
    [switch]$watch
)

$ErrorActionPreference = "Stop"

# Colors
function Write-Step { param([string]$Message) Write-Host "`n=== $Message ===" -ForegroundColor Cyan }
function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Gray }
function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Error { param([string]$Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

# Paths
$ScriptDir = Split-Path -Parent $PSCommandPath
$AppDir = Split-Path -Parent $ScriptDir
$PicoclawDir = Join-Path $AppDir "picoclaw"
$FrontendDir = Join-Path $PicoclawDir "web\frontend"
$BackendDir = Join-Path $PicoclawDir "web\backend"

# Set environment variables
$env:PICOCLAW_CONFIG = Join-Path $AppDir "config.json"
$env:PICOCLAW_LOG_DIR = Join-Path $AppDir "logs"

Write-Step "PicoClaw Local Development (Single Port: 18800)"
Write-Info "Working directory: $AppDir"

# Check prerequisites
if (-not (Test-Path $PicoclawDir)) {
    Write-Error "picoclaw directory not found. Run .\init.ps1 first"
    exit 1
}

# Ensure log directory exists
if (-not (Test-Path $env:PICOCLAW_HOME)) {
    New-Item -ItemType Directory -Path $env:PICOCLAW_HOME -Force | Out-Null
}

# Step 1: Build Frontend (unless -back only)
if (-not $back) {
    Write-Step "Step 1: Building Frontend"
    $originalDir = Get-Location  # Save current directory
    try {
        Set-Location $FrontendDir  # Change to frontend directory
        
        # Install deps if needed
        if (-not (Test-Path "node_modules")) {
            Write-Info "Installing npm dependencies..."
            npm install
            if ($LASTEXITCODE -ne 0) {
                Write-Error "npm install failed"
                exit 1
            }
        }
        
        # Build frontend
        Write-Info "Building frontend to backend/dist..."
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Frontend build failed"
            exit 1
        }
        
        # Copy dist to backend
        $FrontendDist = Join-Path $FrontendDir "dist"
        $BackendDist = Join-Path $BackendDir "dist"
        if (Test-Path $BackendDist) {
            Remove-Item "$BackendDist\*" -Recurse -Force -ErrorAction SilentlyContinue
        }
        Copy-Item "$FrontendDist\*" $BackendDist -Recurse -Force
        Write-Success "Frontend built and copied"
    } finally {
        Set-Location $originalDir  # Restore original directory
    }
}

# Step 2: Start Backend from source
Write-Step "Step 2: Starting Backend (from source)"
$env:PICOCLAW_LOG_DIR = $env:PICOCLAW_HOME

Write-Host "Starting backend from source on http://localhost:18800" -ForegroundColor Green
Write-Host "Go code changes will be reflected immediately" -ForegroundColor Yellow
Write-Host "`nFeatures:" -ForegroundColor Yellow
Write-Host "  - Frontend: http://localhost:18800/" -ForegroundColor Gray
Write-Host "  - API:      http://localhost:18800/api/..." -ForegroundColor Gray
Write-Host "  - Backend:  Auto-restart on code changes (with -watch)" -ForegroundColor Gray
Write-Host "`nEnvironment:" -ForegroundColor Yellow
Write-Host "  - PICOCLAW_CONFIG: $env:PICOCLAW_CONFIG" -ForegroundColor Gray
Write-Host "  - PICOCLAW_LOG_DIR: $env:PICOCLAW_LOG_DIR" -ForegroundColor Gray
Write-Host "`nPress Ctrl+C to stop" -ForegroundColor Cyan

# Start backend from source
$originalDir = Get-Location  # Save current directory
try {
    Set-Location $BackendDir  # Change to backend directory
    if ($watch) {
        Write-Info "Watch mode: Using 'air' for auto-restart (install: go install github.com/cosmtrek/air@latest)"
        # Start backend passing the config as argument
        go run . $env:PICOCLAW_CONFIG -console-logs
    } else {
        # Start backend passing the config as argument  
        go run . $env:PICOCLAW_CONFIG -console-logs
    }
} catch {
    Write-Error "Backend failed: $_"
    exit 1
} finally {
    Set-Location $originalDir  # Restore original directory
}
