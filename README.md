# Discord Favourites Panel (Vencord Plugin)

A Vencord plugin that shows all your favourite channels from across servers in one unified sidebar panel. Adds a star icon to the server list, with full add/remove/organize capabilities via channel context menus.

## Features

- Star icon in the server list to toggle the favourites panel
- Right-click any channel to add/remove from favourites
- Organize favourites into custom categories
- Server name badges next to channels
- Collapsible category sections
- Reads/writes Discord's native favourites protobuf data

## Setup

1. Clone Vencord from source: `git clone https://github.com/Vendicated/Vencord`
2. Install deps: `cd Vencord && pnpm install`
3. Symlink this plugin: `ln -s /path/to/discord-favourites-plugin Vencord/src/userplugins/favouritesPanel`
4. Build: `cd Vencord && pnpm build`
5. Inject into Discord or use the browser extension

## Development

After making changes, rebuild and restart Discord:

```
cd Vencord && pnpm build
```

## Settings

- **Show Server Badge**: Display the server name next to each channel (default: on)
- **Collapse by Default**: Start with category sections collapsed (default: off)

## Architecture

```
index.tsx          - Plugin entry point, settings, ServerListAPI integration, context menus
store.ts           - Read layer for Discord's favourites protobuf data
actions.ts         - Write layer for modifying favourites
utils.ts           - Shared helpers (CSS class factory, navigation)
style.css          - All plugin styles
components/
  FavouritesIcon.tsx    - Star icon for the server list
  FavouritesPanel.tsx   - Main panel component
  ChannelEntry.tsx      - Individual channel row
  CategorySection.tsx   - Collapsible category with children
  EmptyState.tsx        - Empty state when no favourites exist
```
