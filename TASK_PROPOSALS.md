# Codebase Task Proposals

## 1) Typo fix task
**Issue found:** The icon asset is named `ico.ico`, while config and comments refer to `icon.ico`/`icon`.

- `src/assets/ico.ico` exists.
- `forge.config.js` references `./assets/icon` and `./assets/icon.ico`.

**Task:** Rename `src/assets/ico.ico` to `src/assets/icon.ico` and update all icon path references to consistently use `src/assets/icon` (without extension for packager, with `.ico` where required).

**Why this matters:** The current mismatch looks like a filename typo and can break icon resolution in packaging.

**Acceptance criteria:**
- No remaining references to `ico.ico`.
- `npm run make` resolves icon paths without missing-file errors.

## 2) Bug fix task
**Issue found:** `webpack.main.config.js` and `webpack.renderer.config.js` are empty files, but Forge webpack plugin is configured to load both.

**Task:** Add valid webpack config exports for main and renderer bundles (or remove webpack plugin and use non-webpack forge setup).

**Why this matters:** Starting or packaging with Forge can fail because required config files do not export configuration objects.

**Acceptance criteria:**
- `npm run start` launches successfully.
- `npm run make` completes without webpack-config errors.

## 3) Comment/documentation discrepancy task
**Issue found:** `build-auto.ps1` says step `[5/6] Building Windows installer (NSIS)...`, but project maker config uses `@electron-forge/maker-squirrel` (Squirrel), not NSIS.

**Task:** Update `build-auto.ps1` messaging to match the actual packaging target (`Squirrel`) or change Forge makers to NSIS if NSIS is intended.

**Why this matters:** Mismatched documentation causes confusion during release/installer troubleshooting.

**Acceptance criteria:**
- Script output and `forge.config.js` installer strategy match.
- A new contributor can identify packaging target from script and config without ambiguity.

## 4) Test improvement task
**Issue found:** There are no meaningful project tests, and the `lint` script is a placeholder (`echo "No lint yet"`).

**Task:** Add a minimal automated test suite (e.g., Jest) that covers:
- `renderer.js` log rendering behavior.
- `preload.js` API surface exposure (`getClientId`, `setClientId`).

Also replace placeholder lint script with real lint/test commands in CI-ready npm scripts.

**Why this matters:** No guardrails currently exist to catch regressions in renderer behavior or preload IPC API shape.

**Acceptance criteria:**
- `npm test` runs at least one meaningful assertion per module listed above.
- `npm run lint` performs real linting instead of placeholder output.
