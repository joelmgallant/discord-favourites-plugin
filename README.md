# Discord Favourites Panel (Vencord Plugin)

A Vencord plugin that shows all your favourite channels from across servers in one unified sidebar panel. Adds a star icon to the server list, with full add/remove/organize capabilities via channel context menus.

## Features

- Star icon in the server list to toggle the favourites panel
- Right-click any channel to add/remove from favourites
- Organize favourites into custom categories
- Server name badges next to channels
- Collapsible category sections
- Persistent storage via Vencord DataStore (survives restarts)

## Setup

```bash
git clone --recurse-submodules <this-repo>
./scripts/inject.sh
```

That's it. Restart Discord and enable "FavouritesPanel" in Vencord Settings > Plugins.

## Development

After making changes to the plugin source, rebuild and re-inject:

```bash
./scripts/build.sh      # build only
./scripts/inject.sh     # build + inject into Discord
```

Then restart Discord to see your changes.

## Settings

- **Show Server Badge**: Display the server name next to each channel (default: on)
- **Collapse by Default**: Start with category sections collapsed (default: off)

## Architecture

```
index.tsx              - Plugin entry, settings, ServerListAPI, context menus
store.ts               - Favourites data layer (DataStore CRUD + change listeners)
state.ts               - Shared UI state (panel open/close, settings)
utils.ts               - Shared helpers (CSS class factory, navigation)
style.css              - All plugin styles
components/
  FavouritesIcon.tsx   - Star icon for the server list
  FavouritesPanel.tsx  - Main panel component (React portal)
  ChannelEntry.tsx     - Individual channel row
  CategorySection.tsx  - Collapsible category with children
  EmptyState.tsx       - Empty state when no favourites exist
scripts/
  build.sh             - Build Vencord with plugin
  inject.sh            - Build + inject into Discord
vendor/
  Vencord/             - Vencord source (git submodule)
```
