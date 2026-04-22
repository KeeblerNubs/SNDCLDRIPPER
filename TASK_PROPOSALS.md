# Codebase Task Proposals

## 1) Typo fix task
**Issue found:** `package.json` contains a likely typo in script naming: `release:winnpm`.

- Current script: `"release:winnpm": "npm run release:win"`
- Adjacent script naming uses `release:win` / `make:win`, so `release:winnpm` is inconsistent and hard to discover.

**Task:** Rename `release:winnpm` to a clearer, conventional name (for example `release:win:npm`) and update any docs that reference it.

**Why this matters:** Script names are user-facing CLI API. Typos reduce discoverability and increase release-command mistakes.

**Acceptance criteria:**
- No remaining references to `release:winnpm`.
- `npm run release:win:npm` (or chosen replacement) successfully forwards to the Windows release flow.

---

## 2) Bug fix task
**Issue found:** `src/main.js` can produce duplicate playlist track downloads because it does not deduplicate IDs gathered from paginated playlist responses.

- `fetchAllPlaylistTrackIds` pushes every `track.id` from each page into `allTrackIds` with no uniqueness check.
- If SoundCloud pagination returns overlapping items (common with mutable playlists while paging), duplicates flow into the download loop.

**Task:** Enforce stable de-duplication in `fetchAllPlaylistTrackIds` (or immediately after) while preserving playlist order.

**Why this matters:** Duplicate IDs can trigger repeat downloads, misleading progress totals, and wasted bandwidth.

**Acceptance criteria:**
- Repeated track IDs from API pages are downloaded once.
- Summary counts (`totalTracks`, `downloaded`, `failed`) align with unique IDs.

---

## 3) Comment/documentation discrepancy task
**Issue found:** README suggests broad cross-platform `npm run make` output, but release docs and scripts are explicitly Windows/Squirrel-specific.

- README artifact list assumes Windows outputs (`SoundCloudRipperSetup.exe`, `.nupkg`, `RELEASES`).
- `scripts/release-win.ps1` and Forge maker config are Windows-focused.

**Task:** Clarify README to distinguish:
1. general `npm run make` behavior by platform, and
2. Windows-only installer artifacts produced by `npm run release:win`.

**Why this matters:** New contributors on macOS/Linux may expect Windows artifact types from `make` and misdiagnose normal behavior as build failures.

**Acceptance criteria:**
- README explicitly labels Windows-only artifact expectations.
- README explains what `npm run make` should produce on non-Windows hosts.

---

## 4) Test improvement task
**Issue found:** Automated tests are currently placeholders (`"test": "echo \"No tests yet\""`) and do not cover core helper behavior.

**Task:** Add a focused unit test suite for pure playlist logic in `src/main.js`, starting with:
- `sanitizeFileName`
- `chunkArray`
- playlist ID aggregation/dedup ordering behavior

(Refactor helper functions into a separately exported module if needed to make them testable without booting Electron.)

**Why this matters:** This is high-impact logic used across every rip operation; regressions currently ship undetected.

**Acceptance criteria:**
- `npm test` executes real assertions.
- At least one test verifies dedup + stable ordering behavior for track IDs.
