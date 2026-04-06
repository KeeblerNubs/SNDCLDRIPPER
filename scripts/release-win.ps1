param(
  [string]$Version,
  [switch]$Clean
)

$ErrorActionPreference = "Stop"

function Assert-Command($Name, $InstallHint) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name is required. $InstallHint"
  }
}

Write-Host "=== SoundCloud Ripper Windows Release Builder ===" -ForegroundColor Cyan

Assert-Command "node" "Install Node.js LTS from https://nodejs.org"
Assert-Command "npm" "Reinstall Node.js (npm ships with Node)."

if (-not $Version -or $Version.Trim().Length -eq 0) {
  $Version = (node -p "require('./package.json').version")
}

$Version = $Version.TrimStart("v")
$releaseTag = "v$Version"

Write-Host "Preparing release $releaseTag" -ForegroundColor Yellow

if ($Clean) {
  Write-Host "Cleaning previous build output..." -ForegroundColor Yellow
  Remove-Item -Path "out" -Recurse -Force -ErrorAction SilentlyContinue
  Remove-Item -Path "release" -Recurse -Force -ErrorAction SilentlyContinue
}

if (-not (Test-Path "node_modules")) {
  Write-Host "Installing dependencies..." -ForegroundColor Yellow
  npm ci
}

Write-Host "Building Windows installers (.exe + .nupkg)..." -ForegroundColor Green
npm run make -- --platform=win32

$artifactRoot = Join-Path (Get-Location) "out/make/squirrel.windows/x64"
if (-not (Test-Path $artifactRoot)) {
  throw "Build completed but no artifacts found at $artifactRoot"
}

$releaseDir = Join-Path (Get-Location) "release/$releaseTag"
New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null

Write-Host "Collecting release artifacts in $releaseDir" -ForegroundColor Yellow
Get-ChildItem -Path $artifactRoot -File |
  Where-Object { $_.Extension -in @(".exe", ".nupkg", ".txt") } |
  Copy-Item -Destination $releaseDir -Force

$zipPath = Join-Path (Get-Location) "out/make/zip/win32/x64"
if (Test-Path $zipPath) {
  Get-ChildItem -Path $zipPath -File -Filter "*.zip" | Copy-Item -Destination $releaseDir -Force
}

$hashFile = Join-Path $releaseDir "SHA256SUMS.txt"
Get-ChildItem -Path $releaseDir -File |
  Where-Object { $_.Name -ne "SHA256SUMS.txt" } |
  ForEach-Object {
    $hash = Get-FileHash -Algorithm SHA256 -Path $_.FullName
    "$($hash.Hash)  $($_.Name)"
  } | Set-Content -Path $hashFile

Write-Host ""
Write-Host "Release complete: $releaseDir" -ForegroundColor Green
Write-Host "Upload the files from this folder to your GitHub release $releaseTag." -ForegroundColor Green
