# PicoClaw App Initialization Script
#
# This script initializes the picoclaw-app project:
# 1. Checks for git and required tools
# 2. Initializes git submodules
# 3. Installs dependencies
# 4. Builds the APK
#
# Usage:
#   .\init.ps1                    # Full initialization and build
#   .\init.ps1 -SkipBuild         # Initialize only, skip building
#   .\init.ps1 -Force             # Force re-initialize (clean and rebuild)

param(
    [switch]$SkipBuild,
    [switch]$Force,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning { param([string]$Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param([string]$Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

# Get script directory
$ScriptDir = Split-Path -Parent $PSCommandPath
$AppDir = Split-Path -Parent $ScriptDir
$PicoclawDir = Join-Path $AppDir "picoclaw"

Write-Info "PicoClaw App Initialization"
Write-Info "Working directory: $AppDir"

# Step 1: Check prerequisites
Write-Info "Checking prerequisites..."

# Check Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git is not installed. Please install Git first."
    Write-Info "Download: https://git-scm.com/downloads"
    exit 1
}

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed. Please install Node.js first."
    Write-Info "Download: https://nodejs.org/ (LTS version recommended)"
    exit 1
}

# Check Go
if (-not (Get-Command go -ErrorAction SilentlyContinue)) {
    Write-Error "Go is not installed. Please install Go first."
    Write-Info "Download: https://go.dev/dl/"
    exit 1
}

# Check Java (for Android)
if (-not ($env:JAVA_HOME) -and -not (Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Warning "JAVA_HOME not set or Java not found. Android build may fail."
    Write-Info "Download: https://adoptium.net/ (JDK 17 or 21 recommended)"
}

# Check Android SDK
if (-not ($env:ANDROID_HOME) -and -not ($env:ANDROID_SDK_ROOT)) {
    Write-Warning "ANDROID_HOME not set. Android build may fail."
    Write-Info "Download: https://developer.android.com/studio#command-tools"
}

Write-Success "Prerequisites check completed"

# Step 2: Initialize submodules
Write-Info "Initializing git submodules..."

Set-Location $AppDir

if ($Force) {
    Write-Warning "Force mode enabled. Cleaning and re-initializing..."
    if (Test-Path $PicoclawDir) {
        Remove-Item -Path $PicoclawDir -Recurse -Force
    }
}

# Check if submodule already exists
if (Test-Path (Join-Path $PicoclawDir ".git")) {
    Write-Info "Submodule already exists. Updating..."
    git submodule update --recursive
} else {
    Write-Info "Cloning picoclaw submodule..."
    git submodule update --init --recursive
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to initialize submodules"
    exit 1
}

Write-Success "Submodules initialized"

# Step 3: Install npm dependencies
Write-Info "Installing npm dependencies..."

# Install dependencies for picoclaw frontend
$PicoclawFrontendDir = Join-Path $PicoclawDir "web\frontend"
if (Test-Path $PicoclawFrontendDir) {
    Set-Location $PicoclawFrontendDir
    
    if (Test-Path "package.json") {
        Write-Info "Installing frontend dependencies..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install npm dependencies"
            exit 1
        }
    }
}

# Install dependencies for app
Set-Location $AppDir
if (Test-Path "package.json") {
    Write-Info "Installing app dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install npm dependencies"
        exit 1
    }
}

Write-Success "Dependencies installed"

# Step 4: Build APK (unless skipped)
if (-not $SkipBuild) {
    Write-Info "Starting build process..."
    
    $BuildScript = Join-Path $ScriptDir "build-apk.ps1"
    
    if (Test-Path $BuildScript) {
        & $BuildScript -Platform android
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Build failed"
            exit 1
        }
        
        # Check if APK was created
        $ApkPath = Join-Path $AppDir "PicoClaw-android.apk"
        if (Test-Path $ApkPath) {
            $ApkInfo = Get-Item $ApkPath
            Write-Success "Build completed successfully!"
            Write-Info "APK location: $ApkPath"
            Write-Info "APK size: $([math]::Round($ApkInfo.Length/1MB,2)) MB"
            
            # Next steps
            Write-Info ""
            Write-Info "Next steps:"
            Write-Info "  1. Connect your Android device via USB"
            Write-Info "  2. Enable USB debugging on your device"
            Write-Info "  3. Install APK: adb install -r $ApkPath"
            Write-Info "  4. Or copy APK to your device and install manually"
        } else {
            Write-Warning "APK file not found. Build may have failed."
        }
    } else {
        Write-Error "Build script not found: $BuildScript"
        exit 1
    }
} else {
    Write-Info "Build skipped (--SkipBuild flag used)"
    Write-Info "To build later, run: .\scripts\build-apk.ps1"
}

Write-Success "Initialization completed!"
Write-Info "Project ready at: $AppDir"
