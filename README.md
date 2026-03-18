# Discord Favourites Panel

A [Vencord](https://github.com/Vendicated/Vencord) plugin that shows all your favourite channels from across Discord servers in one unified sidebar panel.

## Features

- Star icon in the server list to toggle the favourites panel
- Right-click any channel to add/remove from favourites
- Organize favourites into custom categories
- Server name badges next to channels
- Collapsible category sections
- Persistent storage via Vencord DataStore (survives restarts)

## Setup

```bash
git clone --recurse-submodules https://github.com/joelmgallant/discord-favourites-plugin.git
cd discord-favourites-plugin
./scripts/inject.sh
```

Restart Discord and enable **FavouritesPanel** in Vencord Settings > Plugins.

## Development

After making changes to the plugin source, rebuild and re-inject:

```bash
./scripts/build.sh      # build only
./scripts/inject.sh     # build + inject into Discord
```

Then restart Discord to see your changes.

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Show Server Badge | Display the server name next to each channel | On |
| Collapse by Default | Start with category sections collapsed | Off |

## How It Works

The plugin uses Vencord's [ServerListAPI](https://github.com/Vendicated/Vencord/blob/main/src/api/ServerList.tsx) to add a star icon above the server list. Clicking the icon opens a panel rendered via a React portal overlay on top of the channel sidebar. Favourites are persisted locally using Vencord's DataStore (IndexedDB).

Channel context menus are patched to add "Add to Favourites" / "Remove from Favourites" options, with support for organizing channels into named categories.

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

## Disclaimer

This plugin is a standalone project and is not affiliated with or endorsed by Discord or Vencord. Using client modifications may violate Discord's Terms of Service. Use at your own risk.

## License

MIT
