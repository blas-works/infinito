# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Infinito is an Electron 39 + React 19 + TypeScript desktop note-taking app (daily markdown notes, named note sessions, Excalidraw canvas) built with electron-vite and Tailwind v4. pnpm 11 is the package manager; Node 22 is required (`.nvmrc`, `engines` + `engineStrict` make pnpm refuse other versions).

## Commands

```bash
pnpm install                # postinstall rebuilds native deps (better-sqlite3) for Electron
pnpm run dev                # electron-vite dev with HMR
pnpm run lint               # eslint --cache .
pnpm run typecheck          # tsc for node (main/preload/db) and web (renderer) projects
pnpm run test               # vitest watch
pnpm run test:run           # vitest once
pnpm run test:coverage      # CI enforces 80% lines/functions/branches/statements
pnpm exec vitest run src/renderer/src/__tests__/hooks/useBlocks.test.ts # single file
pnpm exec vitest run -t "test name" # single test by name
pnpm run format             # prettier (single quotes, no semicolons, width 100, no trailing commas)
pnpm run db:generate        # drizzle-kit: generate migration from src/database/schema
pnpm run build:full         # copy migrations into resources/ then build
```

CI (`.github/workflows/ci-cd.yml`) runs lint → typecheck → test:run → test:coverage on push/PR to `main`/`develop`.

## Architecture

Three Electron layers plus a shared DB module:

- **`src/main/`** — main process. `index.ts` owns windows, tray, IPC handlers, single-instance lock and an `electron-store` (only `pendingUpdate` and `appMode`). `autoUpdater.ts` wraps electron-updater and the macOS Homebrew upgrade path (`brew upgrade --cask`).
- **`src/preload/index.ts`** — exposes `window.api` via `contextBridge`. Any new IPC channel needs: handler in `main/index.ts`, method in `preload/index.ts`, type in `preload/index.d.ts`, and usually a wrapper in `renderer/src/services/`.
- **`src/database/`** — Drizzle ORM over better-sqlite3 (WAL), used only from main. DB lives at `userData/infinito.db`. Migrations run at startup from `src/database/migrations` in dev and `process.resourcesPath/migrations` in production — after `db:generate`, run `build:migrations` so `resources/migrations` stays in sync (it's committed).
- **`src/renderer/src/`** — React app (alias `@renderer`). `App.tsx` switches between `sections/` (`daily`, `notes`, `canvas`, `config`); state lives in `hooks/`; `services/` are thin wrappers over `window.api`.

### Persistence split (important)

- **Daily notes** are the only data in SQLite: a flat ordered `blocks` table (`id`, `content`, `position`). `blockRepository.saveAll` deletes and reinserts everything in a transaction. A block whose content matches `DATE_REGEX` (`# dd-MM-yyyy`) is a date header; `lib/groupBlocks.ts` consolidates content so each date block is followed by at most one content block, and groups them into `DateGroup`s. `useBlocks` debounces saves.
- **Note sessions, canvas sessions and settings** live in renderer `localStorage` (`infinito-settings`, `infinito-canvas-registry`, note registry + per-session keys in `useNoteSessions`/`useCanvasSessions`). `useCanvasSessions` migrates the legacy `infinito-excalidraw` key.

### Window modes

`appMode` is `normal` or `menubar` (macOS tray mode). There can be a main window and a separate compact menubar window, both rendering the same renderer; `app:get-window-kind` tells the renderer which one it is (menubar disables some views/shortcuts). Main coordinates the two: it sends `app:flush-pending-saves` and waits for `blocks:flushed` before closing the menubar window, and `app:reload-data` to refresh the other window.

### Updates and releases

Commits must follow Conventional Commits: release-please generates `CHANGELOG.md`/version bumps on `main`. On release, CI derives an update priority (`normal`/`security`/`critical`) from commit subjects (keywords like `security-fix`, `cve-`, `critical`, `breaking`) and publishes `update-metadata.json`, which `autoUpdater.ts` fetches to drive the in-app update UI.

### Build quirks

- `electron.vite.config.ts` bundles `drizzle-orm` into main but keeps `better-sqlite3` external; a custom plugin serves/copies Excalidraw fonts to `/fonts/`.

## Tests

Vitest + jsdom + Testing Library. Tests only live under `**/__tests__/**` (currently `src/renderer/src/__tests__/`). `vitest.setup.ts` polyfills `localStorage` and mocks `electron`. Coverage excludes main, preload, services, `App.tsx`, `TitleBar.tsx` and `index.ts` barrels.
