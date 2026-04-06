# build-auto.ps1 - Backwards-compatible wrapper for first Windows release build

$ErrorActionPreference = "Stop"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host " SoundCloud Ripper Windows Release Build " -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

powershell -ExecutionPolicy Bypass -File "$PSScriptRoot/scripts/release-win.ps1" -Clean

Write-Host ""
Write-Host "Done. Release artifacts are in ./release/v<version>/" -ForegroundColor Green
