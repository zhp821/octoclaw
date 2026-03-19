# PicoClaw App Initialization Script
#
# This script ONLY syncs code with upstream:
# 1. Checks for git
# 2. Initializes/updates git submodules
# 3. Configures upstream remote
# 4. Merges upstream latest code
#
# Usage:
#   .\init.ps1                    # Sync with upstream
#   .\init.ps1 -Force             # Force re-clone submodule
#   .\init.ps1 -SkipSync          # Skip upstream merge (just check)

param(
    [switch]$Force,
    [switch]$SkipSync
)

$ErrorActionPreference = "Stop"

# Colors
function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning { param([string]$Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param([string]$Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Step { param([string]$Message) Write-Host "`n=== $Message ===" -ForegroundColor Cyan }

# Paths
$ScriptDir = Split-Path -Parent $PSCommandPath
$AppDir = Split-Path -Parent $ScriptDir
$PicoclawDir = Join-Path $AppDir "picoclaw"
$UpstreamUrl = "https://github.com/sipeed/picoclaw.git"

Write-Step "PicoClaw App - Code Sync"

# Step 1: Check Git
Write-Step "Checking Git"
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git not found. Download: https://git-scm.com/downloads"
    exit 1
}
Write-Success "Git OK"

# Step 2: Init/Update Submodule
Write-Step "Initializing Submodule"
Set-Location $AppDir

if ($Force -and (Test-Path $PicoclawDir)) {
    Write-Warning "Force mode: removing old submodule..."
    Remove-Item -Path $PicoclawDir -Recurse -Force
}

if (-not (Test-Path ".gitmodules")) {
    Write-Info "Creating submodule..."
    git submodule add $UpstreamUrl picoclaw
    git commit -m "Add picoclaw submodule" -q
} else {
    Write-Info "Updating submodule..."
    git submodule update --init --recursive
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Submodule init failed"
    exit 1
}
Write-Success "Submodule ready"

# Step 3: Configure Upstream
Write-Step "Configuring Upstream"
Set-Location $PicoclawDir

$upstreamExists = git remote -v | Select-String "upstream"
if (-not $upstreamExists) {
    git remote add upstream $UpstreamUrl
    Write-Success "Upstream remote added"
} else {
    git remote set-url upstream $UpstreamUrl
    Write-Info "Upstream already configured"
}

# Show remotes
Write-Info "Remotes:"
git remote -v | ForEach-Object { Write-Host "  $_" }

# Step 4: Sync with Upstream
if (-not $SkipSync) {
    Write-Step "Syncing with Upstream"
    
    git fetch upstream
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to fetch upstream"
        exit 1
    }
    
    # Stash local changes if any
    $hasChanges = git status --porcelain
    if ($hasChanges) {
        Write-Warning "Stashing local changes..."
        git stash push -m "Before upstream sync"
    }
    
    # Merge
    Write-Info "Merging upstream/main..."
    git merge upstream/main --no-edit
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Merge conflict! Please resolve manually:"
        Write-Info "  1. git status (see conflicts)"
        Write-Info "  2. Edit and fix conflicts"
        Write-Info "  3. git add . && git commit"
        Write-Info "  4. Or: git merge --abort"
        exit 1
    }
    
    # Restore stashed changes
    if ($hasChanges) {
        git stash pop
    }
    
    Write-Success "Synced with upstream"
    git log --oneline -1 | Write-Host
} else {
    Write-Warning "Sync skipped (--SkipSync)"
}

# Update parent repo reference
Set-Location $AppDir
$submoduleStatus = git submodule status picoclaw
if ($submoduleStatus -match "^") {
    git add picoclaw
    git commit -m "Update picoclaw submodule" -q 2>$null
}

Write-Step "Sync Complete!"
Write-Success "Code is up to date"
Write-Info "Next: .\scripts\build-apk.ps1 (to build)"
