# build-auto.ps1 - One-command setup + build for Windows 11
# Run as Administrator if signing/code-signing is involved later

Write-Host "======================================" -ForegroundColor Cyan
Write-Host " SoundCloud Ripper Electron Auto-Build " -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js not found. Install it from https://nodejs.org (LTS recommended)" -ForegroundColor Red
    exit 1
}

# Check npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "npm not found. Reinstall Node.js." -ForegroundColor Red
    exit 1
}

$ErrorActionPreference = "Stop"

Write-Host "[1/6] Cleaning old node_modules / package-lock..." -ForegroundColor Yellow
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue

Write-Host "[2/6] Installing latest Electron Forge..." -ForegroundColor Yellow
npm install --save-dev @electron-forge/cli@latest

Write-Host "[3/6] Importing Forge (creates forge.config.js + templates if needed)..." -ForegroundColor Yellow
npx electron-forge import

# If import fails or you want fresh → comment above and uncomment below for clean scaffold
# npx create-electron-app . --template=webpack --yes

Write-Host "[4/6] Installing runtime deps + dev tools..." -ForegroundColor Yellow
npm install electron-store axios jszip file-saver archiver electron-dl --save
npm install electron-is-dev --save-dev

Write-Host "[5/6] Building Windows installer (NSIS)..." -ForegroundColor Green
npm run make

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host " DONE! Check ./out/make/squirrel.windows/x64/ for .exe installer" -ForegroundColor Green
Write-Host " Or ./out/soundcloud-ripper-electron* for portable exe" -ForegroundColor Green
Write-Host " Run the installer or portable exe to test" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next time just run: .\build-auto.ps1" -ForegroundColor Yellow