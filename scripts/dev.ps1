# PicoClaw Local Development Script
# Starts both frontend and backend for local development with hot reload
#
# Usage:
#   .\scripts\dev.ps1           # Start both frontend and backend
#   .\scripts\dev.ps1 -BackendOnly   # Start only backend
#   .\scripts\dev.ps1 -FrontendOnly  # Start only frontend

param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly
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

Write-Step "PicoClaw Local Development"
Write-Info "Working directory: $AppDir"

# Check prerequisites
if (-not (Test-Path $PicoclawDir)) {
    Write-Error "picoclaw directory not found. Run .\init.ps1 first"
    exit 1
}

# Store processes for cleanup
$global:BackendProcess = $null
$global:FrontendProcess = $null

# Cleanup function
function Cleanup {
    Write-Host "`n[INFO] Stopping servers..." -ForegroundColor Yellow
    if ($global:BackendProcess -and -not $global:BackendProcess.HasExited) {
        Stop-Process -Id $global:BackendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if ($global:FrontendProcess -and -not $global:FrontendProcess.HasExited) {
        Stop-Process -Id $global:FrontendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    # Kill any remaining node or go processes
    Get-Process | Where-Object { $_.ProcessName -in @("node","go","picoclaw-web") } | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Success "Servers stopped"
}

# Handle Ctrl+C
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Cleanup }

try {
    # Start Backend
    if (-not $FrontendOnly) {
        Write-Step "Starting Go Backend"
        Set-Location $BackendDir
        
        # Build backend
        Write-Info "Building backend..."
        go build -o picoclaw-web.exe .
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Backend build failed"
            exit 1
        }
        
        # Start backend in background
        Write-Info "Starting backend on http://localhost:18800"
        $global:BackendProcess = Start-Process -FilePath "picoclaw-web.exe" -WorkingDirectory $BackendDir -PassThru -WindowStyle Normal
        
        Write-Success "Backend started (PID: $($global:BackendProcess.Id))"
        
        # Wait for backend to be ready
        Write-Info "Waiting for backend to be ready..."
        $maxRetries = 30
        $retry = 0
        $backendReady = $false
        while ($retry -lt $maxRetries -and -not $backendReady) {
            Start-Sleep -Milliseconds 500
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:18800/api/models" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
                if ($response.StatusCode -eq 200) {
                    $backendReady = $true
                }
            } catch {}
            $retry++
        }
        
        if (-not $backendReady) {
            Write-Warning "Backend may not be fully ready yet, continuing anyway..."
        } else {
            Write-Success "Backend is ready!"
        }
    }
    
    # Start Frontend
    if (-not $BackendOnly) {
        Write-Step "Starting Frontend Dev Server"
        Set-Location $FrontendDir
        
        # Install deps if needed
        if (-not (Test-Path "node_modules")) {
            Write-Info "Installing npm dependencies..."
            npm install
            if ($LASTEXITCODE -ne 0) {
                Write-Error "npm install failed"
                exit 1
            }
        }
        
        # Start frontend dev server
        Write-Info "Starting frontend on http://localhost:5173"
        $global:FrontendProcess = Start-Process -FilePath "npm" -ArgumentList "run","dev" -WorkingDirectory $FrontendDir -PassThru -WindowStyle Normal
        
        Write-Success "Frontend started (PID: $($global:FrontendProcess.Id))"
    }
    
    # Display info
    Write-Step "Development Servers Running"
    Write-Host "`nBackend API:  http://localhost:18800" -ForegroundColor Green
    Write-Host "Frontend Dev: http://localhost:5173" -ForegroundColor Green
    Write-Host "`nHot Reload:  Frontend auto-reloads on file changes" -ForegroundColor Yellow
    Write-Host "API Proxy:    Frontend calls automatically forwarded to backend" -ForegroundColor Yellow
    Write-Host "`nPress Ctrl+C to stop all servers" -ForegroundColor Cyan
    
    # Wait for Ctrl+C
    while ($true) {
        Start-Sleep -Seconds 1
        
        # Check if processes are still running
        if ($global:BackendProcess -and $global:BackendProcess.HasExited) {
            Write-Warning "Backend process exited unexpectedly"
            break
        }
        if ($global:FrontendProcess -and $global:FrontendProcess.HasExited) {
            Write-Warning "Frontend process exited unexpectedly"
            break
        }
    }
    
} catch {
    Write-Error "Error occurred: $_"
} finally {
    Cleanup
}
