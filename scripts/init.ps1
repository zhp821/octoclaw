# PicoClaw App Initialization Script
#
# This script initializes the picoclaw-app project:
# 1. Checks for git and required tools
# 2. Initializes git submodules
# 3. Configures upstream remote for syncing
# 4. Syncs with upstream latest code
# 5. Installs dependencies
#
# Usage:
#   .\init.ps1                    # Initialize and sync with upstream
#   .\init.ps1 -Force             # Force re-initialize and clean
#   .\init.ps1 -SkipSync          # Initialize but skip upstream sync

param(
    [switch]$Force,
    [switch]$SkipSync,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning { param([string]$Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param([string]$Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Step { param([string]$Message) Write-Host "`n========================================" -ForegroundColor Cyan; Write-Host $Message -ForegroundColor Cyan; Write-Host "========================================" -ForegroundColor Cyan }

# Get script directory
$ScriptDir = Split-Path -Parent $PSCommandPath
$AppDir = Split-Path -Parent $ScriptDir
$PicoclawDir = Join-Path $AppDir "picoclaw"

$UpstreamUrl = "https://github.com/sipeed/picoclaw.git"

Write-Step "PicoClaw App Initialization"
Write-Info "Working directory: $AppDir"

# Step 1: Check prerequisites
Write-Step "Step 1: Checking Prerequisites"

# Check Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git is not installed. Please install Git first."
    Write-Info "Download: https://git-scm.com/downloads"
    exit 1
}
Write-Success "Git found"

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed. Please install Node.js first."
    Write-Info "Download: https://nodejs.org/ (LTS version recommended)"
    exit 1
}
Write-Success "Node.js found"

# Check Go
if (-not (Get-Command go -ErrorAction SilentlyContinue)) {
    Write-Error "Go is not installed. Please install Go first."
    Write-Info "Download: https://go.dev/dl/"
    exit 1
}
Write-Success "Go found"

Write-Success "Prerequisites check completed"

# Step 2: Initialize submodules
Write-Step "Step 2: Initializing Git Submodules"

Set-Location $AppDir

if ($Force) {
    Write-Warning "Force mode enabled. Cleaning submodule..."
    if (Test-Path $PicoclawDir) {
        Remove-Item -Path $PicoclawDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Check if .gitmodules exists
if (-not (Test-Path ".gitmodules")) {
    Write-Info "Creating submodule configuration..."
    git submodule add $UpstreamUrl picoclaw
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to add submodule"
        exit 1
    }
    git commit -m "Add picoclaw submodule" -q
}

# Initialize/Update submodule
Write-Info "Cloning picoclaw submodule..."
git submodule update --init --recursive --force

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to initialize submodules"
    exit 1
}

Write-Success "Submodules initialized"

# Step 3: Configure upstream and sync
Write-Step "Step 3: Configuring Upstream Sync"

Set-Location $PicoclawDir

# Check if upstream remote exists
$upstreamExists = git remote -v | Select-String "upstream"

if (-not $upstreamExists) {
    Write-Info "Adding upstream remote: $UpstreamUrl"
    git remote add upstream $UpstreamUrl
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to add upstream remote"
        exit 1
    }
    Write-Success "Upstream remote added"
} else {
    Write-Info "Upstream remote already exists"
    # Update upstream URL if needed
    git remote set-url upstream $UpstreamUrl
}

# Show current remotes
Write-Info "Current remotes:"
git remote -v | ForEach-Object { Write-Info "  $_" }

if (-not $SkipSync) {
    Write-Step "Step 4: Syncing with Upstream"
    
    # Fetch upstream
    Write-Info "Fetching upstream latest code..."
    git fetch upstream
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to fetch upstream"
        exit 1
    }
    
    # Get current branch
    $currentBranch = git rev-parse --abbrev-ref HEAD
    Write-Info "Current branch: $currentBranch"
    
    # Reset to upstream latest (force sync)
    Write-Info "Syncing local code with upstream/main..."
    git reset --hard upstream/main
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to sync with upstream"
        exit 1
    }
    
    Write-Success "Synced with upstream latest code"
    
    # Show latest commit
    $latestCommit = git log -1 --oneline
    Write-Info "Latest commit: $latestCommit"
} else {
    Write-Warning "Upstream sync skipped (--SkipSync flag used)"
}

Set-Location $AppDir

# Step 5: Update submodule reference in parent repo
Write-Step "Step 5: Updating Submodule Reference"

# Check if submodule reference needs update
$submoduleStatus = git submodule status picoclaw
if ($submoduleStatus -match "^") {
    Write-Info "Submodule has changes, committing reference update..."
    git add picoclaw
    git commit -m "Update picoclaw submodule to upstream latest" -q
    Write-Success "Submodule reference updated"
} else {
    Write-Info "Submodule reference is up to date"
}

# Step 6: Install dependencies
Write-Step "Step 6: Installing Dependencies"

# Install dependencies for picoclaw frontend
$PicoclawFrontendDir = Join-Path $PicoclawDir "web\frontend"
if (Test-Path $PicoclawFrontendDir) {
    Set-Location $PicoclawFrontendDir
    
    if (Test-Path "package.json") {
        Write-Info "Installing picoclaw frontend dependencies..."
        if (Test-Path "node_modules") {
            Write-Info "node_modules exists, skipping npm install"
        } else {
            npm install
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Failed to install frontend dependencies"
                exit 1
            }
        }
        Write-Success "Frontend dependencies installed"
    }
}

# Install dependencies for app
Set-Location $AppDir
if (Test-Path "package.json") {
    Write-Info "Installing app dependencies..."
    if (Test-Path "node_modules") {
        Write-Info "node_modules exists, skipping npm install"
    } else {
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install app dependencies"
            exit 1
        }
    }
    Write-Success "App dependencies installed"
}

Write-Step "Initialization Completed!"
Write-Success "PicoClaw App is ready at: $AppDir"

Write-Info ""
Write-Info "Next steps:"
Write-Info "  1. Review the synced code: cd picoclaw && git log --oneline -5"
Write-Info "  2. Build the APK: .\scripts\build-apk.ps1"
Write-Info "  3. Install to device: adb install -r PicoClaw-android.apk"
Write-Info ""
Write-Info "To sync with upstream again later:"
Write-Info "  cd picoclaw"
Write-Info "  git fetch upstream"
Write-Info "  git reset --hard upstream/main"
Write-Info "  cd .."
Write-Info "  git add picoclaw && git commit -m 'Update submodule'"
