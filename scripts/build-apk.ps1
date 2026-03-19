# PicoClaw APK Build Script
#
# This script builds the PicoClaw Android APK
# Note: Run .\scripts\init.ps1 first to sync with upstream and install dependencies
#
# Usage:
#   .\scripts\build-apk.ps1              # Build Android (default)
#   .\scripts\build-apk.ps1 -Platform both     # Build both platforms

param(
    [ValidateSet("android", "ios", "both")]
    [string]$Platform = "android"
)

# Calculate paths based on script location
$ScriptDir = Split-Path -Parent $PSCommandPath
$AppDir = Split-Path -Parent $ScriptDir
$PicoclawDir = Join-Path $AppDir "picoclaw"

$ErrorActionPreference = "Stop"

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Write-Step {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Write-SubStep {
    param([string]$Message)
    Write-Host "  -> $Message" -ForegroundColor Yellow
}

# Verify picoclaw exists
if (-not (Test-Path $PicoclawDir)) {
    Write-Host "[ERROR] picoclaw directory not found at: $PicoclawDir" -ForegroundColor Red
    Write-Host "Please run .\scripts\init.ps1 first to initialize the project." -ForegroundColor Yellow
    exit 1
}

# Step 1: Build picoclaw frontend
Write-Step "Step 1: Building picoclaw frontend"

$PicoclawFrontendDir = Join-Path $PicoclawDir "web\frontend"
Set-Location $PicoclawFrontendDir
npm install
npm run build
Write-SubStep "Picoclaw frontend built"

# Step 2: Copy picoclaw-app dist to picoclaw backend dist (merge)
Write-Step "Step 2: Merging picoclaw-app frontend"

$PicoclawBackendDistDir = Join-Path $PicoclawDir "web\backend\dist"
$PicoclawAppDistDir = Join-Path $AppDir "dist"

if (Test-Path $PicoclawAppDistDir) {
    if (-not (Test-Path $PicoclawBackendDistDir)) {
        New-Item -ItemType Directory -Path $PicoclawBackendDistDir -Force | Out-Null
    }
    Get-ChildItem -Path $PicoclawAppDistDir -Recurse | ForEach-Object {
        if (-not $_.PSIsContainer) {
            $RelativePath = $_.FullName.Substring($PicoclawAppDistDir.Length + 1)
            $DestPath = Join-Path $PicoclawBackendDistDir $RelativePath
            $DestDir = Split-Path $DestPath -Parent
            if (-not (Test-Path $DestDir)) {
                New-Item -ItemType Directory -Path $DestDir -Force | Out-Null
            }
            Copy-Item -Path $_.FullName -Destination $DestPath -Force
        }
    }
    Write-SubStep "picoclaw-app frontend merged to backend dist"
} else {
    Write-SubStep "No picoclaw-app dist, using picoclaw only"
}

# Step 3: Build picoclaw Go backend (CGO disabled for Android)
Write-Step "Step 3: Building picoclaw Go backend"

$PicoclawBackendDir = Join-Path $PicoclawDir "web\backend"
Set-Location $PicoclawBackendDir

# Copy Android stub file with build tag for systray
$TrayAndroidSource = Join-Path $AppDir "tray_android.go"
$TrayAndroidDest = Join-Path $PicoclawBackendDir "tray_android.go"
if (Test-Path $TrayAndroidSource) {
    Copy-Item -Path $TrayAndroidSource -Destination $TrayAndroidDest -Force
    
    # Rename systray.go to avoid conflict (it has build tag that matches android)
    $SystrayFile = Join-Path $PicoclawBackendDir "systray.go"
    $SystrayBak = Join-Path $PicoclawBackendDir "systray.go.bak"
    if (Test-Path $SystrayBak) {
        Remove-Item -Path $SystrayBak -Force
    }
    if (Test-Path $SystrayFile) {
        Rename-Item -Path $SystrayFile -NewName "systray.go.bak" -Force
    }
    Write-SubStep "Android tray stub copied, systray.go temporarily renamed"
}

$env:GOOS = "android"
$env:GOARCH = "arm64"
$env:CGO_ENABLED = "0"
go build -tags android -ldflags="-s -w" -o "picoclaw-web" .

# Restore systray.go after build
if (Test-Path $TrayAndroidSource) {
    $SystrayBak = Join-Path $PicoclawBackendDir "systray.go.bak"
    $SystrayFile = Join-Path $PicoclawBackendDir "systray.go"
    if (Test-Path $SystrayBak) {
        Rename-Item -Path $SystrayBak -NewName "systray.go" -Force
    }
    # Remove copied tray_android.go
    if (Test-Path $TrayAndroidDest) {
        Remove-Item -Path $TrayAndroidDest -Force
    }
}
Write-SubStep "Go backend built for Android ARM64"

# Step 4: Copy to Android assets
Write-Step "Step 4: Copying to Android assets"

$AndroidAssetsDir = Join-Path $AppDir "android\app\src\main\assets"
$AndroidPublicDir = Join-Path $AndroidAssetsDir "public"
$AndroidJniLibsDir = Join-Path $AppDir "android\app\src\main\jniLibs\arm64-v8a"

# Ensure directories exist
if (-not (Test-Path $AndroidPublicDir)) {
    New-Item -ItemType Directory -Path $AndroidPublicDir -Force | Out-Null
}
if (-not (Test-Path $AndroidJniLibsDir)) {
    New-Item -ItemType Directory -Path $AndroidJniLibsDir -Force | Out-Null
}

# Copy frontend dist to assets
$SourceDist = Join-Path $PicoclawDir "web\backend\dist"
if (Test-Path $SourceDist) {
    Remove-Item -Path "$AndroidPublicDir\*" -Recurse -Force -ErrorAction SilentlyContinue
    Copy-Item -Path "$SourceDist\*" -Destination $AndroidPublicDir -Recurse -Force
    Write-SubStep "Frontend dist copied to Android assets"
}

# Copy config.json
$ConfigSource = Join-Path $AppDir "config.json"
$ConfigDest = Join-Path $AndroidAssetsDir "backend\config.json"
if (-not (Test-Path (Split-Path $ConfigDest -Parent))) {
    New-Item -ItemType Directory -Path (Split-Path $ConfigDest -Parent) -Force | Out-Null
}
Copy-Item -Path $ConfigSource -Destination $ConfigDest -Force
Write-SubStep "Config file copied"

# Copy Go binary to jniLibs as a shared library
$SourceBinary = Join-Path $PicoclawDir "web\backend\picoclaw-web"
$DestBinary = Join-Path $AndroidJniLibsDir "libpicoclaw-web.so"
Copy-Item -Path $SourceBinary -Destination $DestBinary -Force
Write-SubStep "Go binary copied to jniLibs"

# Step 5: Build Android APK
if ($Platform -eq "android" -or $Platform -eq "both") {
    Write-Step "Step 5: Building Android APK"
    
    $AndroidDir = Join-Path $AppDir "android"
    Set-Location $AndroidDir
    
    # Clean and build
    if (Test-Path "app\build\outputs\apk\debug\app-debug.apk") {
        Remove-Item -Path "app\build\outputs\apk\debug\app-debug.apk" -Force -ErrorAction SilentlyContinue
    }
    
    ./gradlew clean assembleDebug
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Android build failed" -ForegroundColor Red
        exit 1
    }
    
    # Copy APK to root
    $ApkSource = "app\build\outputs\apk\debug\app-debug.apk"
    $ApkDest = Join-Path $AppDir "PicoClaw-android.apk"
    Copy-Item -Path $ApkSource -Destination $ApkDest -Force
    Write-SubStep "APK copied to $ApkDest"
}

# Step 6: Build iOS app
if ($Platform -eq "ios" -or $Platform -eq "both") {
    Write-Step "Step 6: Building iOS app (not implemented)"
    Write-SubStep "iOS build not yet implemented"
}

Write-Step "Build Complete!"
Write-Host "Output: $ApkDest" -ForegroundColor Green
Write-Host "Size: $([math]::Round((Get-Item $ApkDest).Length/1MB,2)) MB" -ForegroundColor Green
Write-Host "`nTo install: adb install -r $ApkDest" -ForegroundColor Yellow
