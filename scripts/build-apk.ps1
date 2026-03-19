# PicoClaw APK Build Script
#
# This script builds everything:
# 1. Installs dependencies (npm, go)
# 2. Builds frontend
# 3. Builds Go backend
# 4. Copies to Android
# 5. Builds APK
#
# Prerequisites: Run .\init.ps1 first to sync code
#
# Usage:
#   .\build-apk.ps1              # Build Android (default)
#   .\build-apk.ps1 -Sync        # Sync upstream then build
#   .\build-apk.ps1 -Platform both     # Build both platforms

param(
    [ValidateSet("android", "ios", "both")]
    [string]$Platform = "android",
    [switch]$Sync
)

$ErrorActionPreference = "Stop"

# Paths
$ScriptDir = Split-Path -Parent $PSCommandPath
$AppDir = Split-Path -Parent $ScriptDir
$PicoclawDir = Join-Path $AppDir "picoclaw"

function Write-Step { param([string]$Message) Write-Host "`n=== $Message ===" -ForegroundColor Cyan }
function Write-SubStep { param([string]$Message) Write-Host "  -> $Message" -ForegroundColor Yellow }
function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Error { param([string]$Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

# Sync with upstream if -Sync flag is set
if ($Sync) {
    Write-Step "Syncing with upstream"
    $InitScript = Join-Path $ScriptDir "init.ps1"
    if (Test-Path $InitScript) {
        & $InitScript
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Sync failed. Please resolve conflicts before building."
            Write-Host "Run '.\scripts\init.ps1' manually to see details." -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Error "init.ps1 not found"
        exit 1
    }
}

# Check picoclaw exists
if (-not (Test-Path $PicoclawDir)) {
    Write-Error "picoclaw not found. Run .\init.ps1 first"
    exit 1
}

# Step 1: Install Dependencies
Write-Step "Step 1: Installing Dependencies"

# Frontend deps
$FrontendDir = Join-Path $PicoclawDir "web\frontend"
Set-Location $FrontendDir
if (-not (Test-Path "node_modules")) {
    Write-SubStep "Installing npm packages..."
    npm install
    if ($LASTEXITCODE -ne 0) { exit 1 }
} else {
    Write-SubStep "npm packages already installed"
}

# Go deps
$BackendDir = Join-Path $PicoclawDir "web\backend"
Set-Location $BackendDir
Write-SubStep "Downloading Go modules..."
go mod download
Write-Success "Dependencies OK"

# Step 2: Build Frontend
Write-Step "Step 2: Building Frontend"
Set-Location $FrontendDir
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }
Write-Success "Frontend built"

# Step 3: Build Go Backend
Write-Step "Step 3: Building Go Backend"
Set-Location $BackendDir

# Build
$env:GOOS = "android"
$env:GOARCH = "arm64"
$env:CGO_ENABLED = "0"
go build -tags android -ldflags="-s -w" -o "picoclaw-web" .
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Success "Go backend built"

# Step 4: Copy to Android Assets
Write-Step "Step 4: Copying to Android"

$AssetsDir = Join-Path $AppDir "android\app\src\main\assets"
$PublicDir = Join-Path $AssetsDir "public"
$JniDir = Join-Path $AppDir "android\app\src\main\jniLibs\arm64-v8a"

# Ensure dirs
New-Item -ItemType Directory -Path $PublicDir -Force | Out-Null
New-Item -ItemType Directory -Path $JniDir -Force | Out-Null

# Copy frontend dist
$DistDir = Join-Path $BackendDir "dist"
Remove-Item "$PublicDir\*" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item "$DistDir\*" $PublicDir -Recurse -Force
Write-SubStep "Frontend assets copied"

# Copy config
$ConfigDir = Join-Path $AssetsDir "backend"
New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null
Copy-Item (Join-Path $AppDir "config.json") (Join-Path $ConfigDir "config.json") -Force
Write-SubStep "Config copied"

# Copy binary
Copy-Item (Join-Path $BackendDir "picoclaw-web") (Join-Path $JniDir "libpicoclaw-web.so") -Force
Write-SubStep "Binary copied"

# Step 5: Build APK
if ($Platform -eq "android" -or $Platform -eq "both") {
    Write-Step "Step 5: Building APK"
    $AndroidDir = Join-Path $AppDir "android"
    Set-Location $AndroidDir
    
    ./gradlew clean assembleDebug
    if ($LASTEXITCODE -ne 0) { exit 1 }
    
    $ApkPath = Join-Path $AppDir "PicoClaw-android.apk"
    Copy-Item "app\build\outputs\apk\debug\app-debug.apk" $ApkPath -Force
    
    Write-Success "Build Complete!"
    Write-Host "APK: $ApkPath" -ForegroundColor Green
    Write-Host "Size: $([math]::Round((Get-Item $ApkPath).Length/1MB,2)) MB" -ForegroundColor Green
    Write-Host "Install: adb install -r $ApkPath" -ForegroundColor Yellow
}

if ($Platform -eq "ios" -or $Platform -eq "both") {
    Write-Step "iOS build not implemented"
}
