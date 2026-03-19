# PicoClaw APK Build Script
#
# This script:
# 1. Syncs picoclaw with remote (git fetch + reset --hard)
# 2. Builds picoclaw frontend
# 3. Copies picoclaw-app dist to picoclaw backend dist (merge)
# 4. Builds picoclaw Go backend (embeds frontend)
# 5. Copies to Android assets
# 6. Builds APK
#
# Usage:
#   .\scripts\build-apk.ps1              # Build Android (default)
#   .\scripts\build-apk.ps1 -Platform both     # Build both platforms

# Calculate default paths based on script location
$ScriptDir = Split-Path -Parent $PSCommandPath
$DefaultAppDir = Split-Path -Parent $ScriptDir
$DefaultPicoclawDir = Join-Path $DefaultAppDir "picoclaw"

param(
    [string]$PicoclawDir = $DefaultPicoclawDir,
    [string]$AppDir = $DefaultAppDir,
    [string]$RemoteUrl = "https://github.com/zhp821/picoclaw.git",
    [string]$Branch = "main",
    [ValidateSet("android", "ios", "both")]
    [string]$Platform = "android"
)

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

# Step 1: Sync picoclaw with remote - ensures clean state
Write-Step "Step 1: Syncing picoclaw with remote"

if (-not (Test-Path $PicoclawDir)) {
    Write-SubStep "Cloning picoclaw..."
    git clone --branch $Branch --single-branch $RemoteUrl $PicoclawDir
} else {
    Set-Location $PicoclawDir
    Write-SubStep "Fetching and resetting to remote..."
    git fetch origin
    git reset --hard "origin/$Branch"
}
git fetch upstream
git merge upstream/main
git push
# Step 2: Build picoclaw frontend
Write-Step "Step 2: Building picoclaw frontend"

$PicoclawFrontendDir = Join-Path $PicoclawDir "web\frontend"

Set-Location $PicoclawFrontendDir
npm install
npm run build
Write-SubStep "Picoclaw frontend built"

# Step 3: Copy picoclaw-app dist to picoclaw backend dist (merge)
Write-Step "Step 3: Merging picoclaw-app frontend"

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

# Step 4: Build picoclaw Go backend (CGO disabled for Android)
Write-Step "Step 4: Building picoclaw Go backend"

$PicoclawBackendDir = Join-Path $PicoclawDir "web\backend"
$PicoclawApiDir = Join-Path $PicoclawBackendDir "api"
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

# Copy setup.go for model configuration wizard
$SetupGoSource = Join-Path $AppDir "web\backend\api\setup.go"
$SetupGoDest = Join-Path $PicoclawApiDir "setup.go"
if (Test-Path $SetupGoSource) {
    Copy-Item -Path $SetupGoSource -Destination $SetupGoDest -Force
    
    # Modify router.go to register setup routes
    $RouterFile = Join-Path $PicoclawApiDir "router.go"
    $RouterContent = Get-Content $RouterFile -Raw
    if ($RouterContent -notmatch "registerSetupRoutes") {
        # Add setup routes registration after model routes
        $RouterContent = $RouterContent -replace '(h\.registerModelRoutes\(mux\))', "`$1`r`n`r`n`t// Setup wizard`r`n`th.registerSetupRoutes(mux)"
        Set-Content -Path $RouterFile -Value $RouterContent -NoNewline
    }
    Write-SubStep "Setup API routes added"
}

$env:GOOS = "android"
$env:GOARCH = "arm64"
$env:CGO_ENABLED = "0"
go build -tags android -ldflags="-s -w" -o "picoclaw-web" .

# Copy to Android jniLibs directory as a .so file (trick to allow execution)
$AndroidJniLibsDir = Join-Path $AppDir "android\app\src\main\jniLibs\arm64-v8a"
if (-not (Test-Path $AndroidJniLibsDir)) {
    New-Item -ItemType Directory -Path $AndroidJniLibsDir -Force | Out-Null
}
$SoBinaryDest = Join-Path $AndroidJniLibsDir "libpicoclaw-web.so"
Copy-Item -Path "picoclaw-web" -Destination $SoBinaryDest -Force
Write-SubStep "Go binary copied to jniLibs as libpicoclaw-web.so"

# Restore systray.go after build
if (Test-Path $TrayAndroidSource) {
    $SystrayBak = Join-Path $PicoclawBackendDir "systray.go.bak"
    $SystrayFile = Join-Path $PicoclawBackendDir "systray.go"
    if (Test-Path $SystrayBak) {
        Rename-Item -Path $SystrayBak -NewName "systray.go" -Force
    }
    # Remove copied setup.go
    if (Test-Path $SetupGoDest) {
        Remove-Item -Path $SetupGoDest -Force
    }
    # Restore router.go using git
    Push-Location $PicoclawDir
    git checkout -- web/backend/api/router.go 2>$null
    # Restore custom frontend components
    if (Test-Path $CustomComponentsDir) {
        Get-ChildItem -Path $CustomComponentsDir -Filter "*.tsx" -Recurse | ForEach-Object {
            $RelativePath = $_.FullName.Substring($CustomComponentsDir.Length + 1)
            $DestPath = Join-Path $TargetComponentsDir $RelativePath
            git checkout -- "src/components/$RelativePath" 2>$null
        }
    }
    Pop-Location
}
Write-SubStep "Go backend built for Android ARM64"

# Step 5: Copy to Android assets
Write-Step "Step 5: Copying to Android assets"

$AndroidAssetsDir = Join-Path $AppDir "android\app\src\main\assets"
if (-not (Test-Path $AndroidAssetsDir)) {
    New-Item -ItemType Directory -Path $AndroidAssetsDir -Force | Out-Null
}

$GoBinarySource = Join-Path $PicoclawBackendDir "picoclaw-web"
$GoBinaryDest = Join-Path $AndroidAssetsDir "picoclaw-web"
Copy-Item -Path $GoBinarySource -Destination $GoBinaryDest -Force
Write-SubStep "Go binary copied"

$ConfigSource = Join-Path $AppDir "config.json"
if (Test-Path $ConfigSource) {
    $ConfigDest = Join-Path $AndroidAssetsDir "config.json"
    Copy-Item -Path $ConfigSource -Destination $ConfigDest -Force
    Write-SubStep "Config copied"
}

# Step 6: Build Android APK
if ($Platform -eq "android" -or $Platform -eq "both") {
    Write-Step "Step 6: Building Android APK"

    $AndroidDir = Join-Path $AppDir "android"
    Set-Location $AndroidDir
    npx cap sync android
    .\gradlew assembleRelease

    $ApkSource = "$AndroidDir\app\build\outputs\apk\release\app-release-unsigned.apk"
    $ApkDest = Join-Path $AppDir "PicoClaw-android.apk"
    Copy-Item -Path $ApkSource -Destination $ApkDest -Force
    Write-SubStep "APK: $ApkDest"
}

# Step 7: Build iOS
if ($Platform -eq "ios" -or $Platform -eq "both") {
    Write-Step "Step 7: Building iOS"

    $IosDir = Join-Path $AppDir "ios"
    if (-not (Test-Path $IosDir)) {
        New-Item -ItemType Directory -Path $IosDir -Force | Out-Null
    }

    $IosAssetsDir = Join-Path $IosDir "App\Resources"
    if (-not (Test-Path $IosAssetsDir)) {
        New-Item -ItemType Directory -Path $IosAssetsDir -Force | Out-Null
    }

    Set-Location $PicoclawBackendDir
    $env:GOOS = "ios"
    $env:GOARCH = "arm64"
    $env:GOARM = "7"
    $env:CGO_ENABLED = "0"
    go build -ldflags="-s -w" -o "$IosAssetsDir\picoclaw-web" .
    Write-SubStep "iOS build done (requires macOS for final IPA)"
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

if ($Platform -eq "android" -or $Platform -eq "both") {
    Get-Item "$AppDir\PicoClaw-android.apk" | Select-Object Name, @{N="Size(MB)";E={[math]::Round($_.Length/1MB,2)}}, LastWriteTime
}
