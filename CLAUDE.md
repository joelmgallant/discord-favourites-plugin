# Discord Favourites Panel - Vencord Plugin

## Project Overview

Standalone Vencord plugin that adds a favourites sidebar panel to Discord, letting users aggregate channels from across servers into one view.

## Tech Stack

- **TypeScript / React** — plugin source
- **Vencord Plugin API** — ServerListAPI, DataStore, Settings, ContextMenu, ErrorBoundary
- **Vencord build system** — esbuild via `pnpm build` in the Vencord submodule

## Build & Deploy

```bash
./scripts/build.sh      # init submodule, install deps, copy plugin, build
./scripts/inject.sh     # build + inject into Discord app
```

The plugin source lives at the repo root. The build script copies it into `vendor/Vencord/src/userplugins/favouritesPanel/` before building. Vencord is a git submodule at `vendor/Vencord/`.

**Important**: The `COREPACK_INTEGRITY_KEYS=0` env var is required for pnpm due to a corepack signature verification issue with the pinned pnpm version.

## Key Architecture Decisions

### React Portal for Panel Rendering
The panel is rendered via `ReactDOM.createPortal` into `#app-mount` rather than inline in the ServerListAPI component tree. This is necessary because Discord's server list container has CSS containment that clips `position: fixed` children.

### No Circular Dependencies
Shared state (`isPanelOpen`, `settings`) lives in `state.ts`, NOT in `index.tsx`. Both `index.tsx` and `components/FavouritesPanel.tsx` import from `state.ts`. Moving state back into `index.tsx` will cause a circular dependency that silently breaks the panel.

### Hardcoded Theme Colors
CSS variables like `var(--background-secondary)` don't resolve in the portal target context. Theme colors are hardcoded (`#2b2d31` for dark, `#f2f3f5` for light) with `:root[class*="theme-dark/light"]` selectors.

### DataStore over Protobuf
Favourites are persisted via Vencord's DataStore (IndexedDB), not Discord's native favourites protobuf. The protobuf approach (`USER_SETTINGS_PROTO_UPDATE` with `local: true`) only updates in-memory state and doesn't survive restarts. DataStore is the same pattern used by PinDMs.

### Change Listener Pattern
The store uses a manual listener set (`addChangeListener` / `removeChangeListener`) rather than Flux stores. Components subscribe in `useEffect` and get notified when DataStore writes complete.

## Plugin Source Files (copied into Vencord on build)

Only these files are copied by `scripts/build.sh`:
- `index.tsx`, `store.ts`, `state.ts`, `utils.ts`, `style.css`, `components/`

Everything else (docs, scripts, .git, vendor) stays out of the Vencord build.

## Testing

No automated tests — this is a Vencord plugin that depends on Discord's runtime. Testing is manual:
1. `./scripts/inject.sh`
2. Restart Discord
3. Enable plugin in Vencord Settings > Plugins
4. Verify star icon, panel, context menus, persistence across restarts
