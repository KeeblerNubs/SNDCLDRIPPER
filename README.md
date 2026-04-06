# SoundCloud Ripper

Bulk SoundCloud playlist to MP3 downloader built with Electron + Electron Forge.

## Make your first Windows `.exe` release

From a Windows machine (PowerShell), run:

```powershell
npm install
npm run release:win
```

That command builds the Windows installer and collects release-ready artifacts under:

- `release/v<version>/`

Expected artifacts include:

- `SoundCloudRipperSetup.exe` (installer)
- `RELEASES` and `.nupkg` files (Squirrel update artifacts)
- optional `.zip` package
- `SHA256SUMS.txt` (checksums for every artifact)

### Choose a specific release version

If you want to stage artifacts under a different release tag:

```powershell
./scripts/release-win.ps1 -Version 1.0.1
```

If omitted, the script uses the version from `package.json`.

### Clean old outputs before building

```powershell
./scripts/release-win.ps1 -Clean
```

## Development scripts

```bash
npm start       # Run app in development mode
npm run package # Package app without installer
npm run make    # Build distributables for the current platform
npm run make:win
npm run release:win
```

## Notes

- Build Windows releases on Windows for the most reliable results.
- If PowerShell blocks script execution, use:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
