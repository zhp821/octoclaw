# PicoClaw Gateway Development Script
#
# This script starts the PicoClaw Gateway service
# Gateway serves on http://localhost:18790

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
$GatewayDir = Join-Path $PicoclawDir "cmd\picoclaw"

Write-Step "PicoClaw Gateway Service"
Write-Info "Working directory: $AppDir"

# Check prerequisites
if (-not (Test-Path $PicoclawDir)) {
    Write-Error "picoclaw directory not found. Run .\init.ps1 first"
    exit 1
}

if (-not (Test-Path $GatewayDir)) {
    Write-Error "Gateway directory not found: $GatewayDir"
    exit 1
}

# Set environment variables
$env:PICOCLAW_CONFIG = Join-Path $AppDir "config.json"
$env:PICOCLAW_HOME = $AppDir
$env:PICOCLAW_LOG_DIR = Join-Path $AppDir "logs"

# Ensure log directory exists
if (-not (Test-Path $env:PICOCLAW_LOG_DIR)) {
    New-Item -ItemType Directory -Path $env:PICOCLAW_LOG_DIR -Force | Out-Null
}

# Start Gateway from source
Write-Step "Starting Gateway (from source)"
$OriginalDir = Get-Location  # Save current directory
Set-Location $PicoclawDir

Write-Host "Starting gateway from source on http://localhost:18790" -ForegroundColor Green
Write-Host "Go code changes will be reflected immediately" -ForegroundColor Yellow
Write-Host "`nServices:" -ForegroundColor Yellow
Write-Host "  - Gateway: http://localhost:18790/" -ForegroundColor Gray
Write-Host "  - Health check: http://localhost:18790/health" -ForegroundColor Gray
Write-Host "`nPress Ctrl+C to stop" -ForegroundColor Cyan

# Set log directory environment variable and start gateway
$env:PICOCLAW_LOG_DIR = Join-Path $AppDir "logs"
$env:PICOCLAW_CONFIG = $env:PICOCLAW_CONFIG_PATH

# Start gateway from source
$originalDir = Get-Location  # Save current directory
try {
    Set-Location $PicoclawDir  # Change to picoclaw root directory (needed for embed FS)
    if ($watch) {
        Write-Info "Watch mode: Using 'air' for auto-restart (install with: go install github.com/cosmtrek/air@latest)"
        go run ./cmd/picoclaw gateway -E
    } else {
        go run ./cmd/picoclaw gateway -E
    }
    $LASTEXITCODE = $LASTEXITCODE  # Preserve exit code
} catch {
    Write-Error "Gateway failed: $_"
    exit 1
} finally {
    Set-Location $originalDir  # Restore original directory
}