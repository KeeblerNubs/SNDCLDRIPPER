# SoundCloud Ripper

Bulk SoundCloud playlist to MP3 downloader built with Electron + Electron Forge.

## Windows Build Guide (Detailed)

This guide walks you through building the app on a Windows PC from source, including both a quick one-command build and a manual step-by-step build.

---

## 1) Prerequisites (Windows)

Before building, install the following:

1. **Windows 10/11 (64-bit)**
2. **Node.js LTS** (recommended) from https://nodejs.org
   - npm is installed automatically with Node.js.
3. **Git for Windows** from https://git-scm.com/download/win
4. **PowerShell 5.1+** (included on most modern Windows versions)

### Verify your tools

Open **PowerShell** and run:

```powershell
node -v
npm -v
git --version
```

If any command is not found, reinstall that tool and restart PowerShell.

---

## 2) Get the source code

In PowerShell:

```powershell
git clone <YOUR_REPO_URL>
cd SNDCLDRIPPER
```

If you already downloaded the repository as a ZIP, extract it and `cd` into that folder instead.

---

## 3) Option A (Recommended): Automatic build script

This repository includes `build-auto.ps1`, which performs a full setup + build process for Windows.

From the project root, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\build-auto.ps1
```

What it does at a high level:
- Verifies Node.js and npm are installed.
- Removes existing `node_modules` and `package-lock.json`.
- Installs the latest Electron Forge CLI.
- Runs `electron-forge import`.
- Installs runtime + development dependencies.
- Runs `npm run make` to generate Windows build artifacts.

After it finishes, check:
- `out/make/squirrel.windows/x64/` for installer artifacts.
- `out/` for packaged app output.

> Note: The script currently references NSIS in one status line, but the configured maker is Squirrel (`@electron-forge/maker-squirrel`).

---

## 4) Option B: Manual build steps

If you prefer not to use the script:

```powershell
npm install
npm run make
```

Useful commands:

```powershell
npm start      # Run app in development mode
npm run package # Package app without creating an installer
npm run make    # Build distributables/installers
```

---

## 5) Output locations

After a successful manual or automatic build, common output locations are:

- `out/` (all generated build output)
- `out/make/` (platform-specific distributables)
- `out/SoundCloud Ripper-win32-x64/` (packaged app folder, name may vary by version/tooling)

---

## 6) Troubleshooting (Windows)

### PowerShell blocks script execution

Run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Then run the script again.

### `node` or `npm` is not recognized

- Reinstall Node.js LTS.
- Close and reopen PowerShell.
- Ensure Node.js is on your `PATH`.

### Native module or dependency install failures

Try a clean reinstall:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

### Build succeeds but app does not launch

- Run `npm start` first to test in dev mode.
- Check antivirus/Defender quarantine.
- Try running the generated `.exe` as Administrator once.

---

## 7) Rebuilding after changes

From project root:

```powershell
npm install
npm run make
```

For a fully clean rebuild:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
npm run make
```

---

## 8) Tech stack summary

- Electron
- Electron Forge (Webpack template/tooling)
- Runtime deps used by the app include Axios, JSZip, Archiver, Electron Store, and Electron DL.

