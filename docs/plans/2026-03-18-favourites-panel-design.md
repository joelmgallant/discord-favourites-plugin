# Discord Favourites Panel — Vencord Plugin Design

## Overview

A standalone Vencord plugin that adds a dedicated "Favourites" sidebar panel to Discord, surfacing all of a user's favorited channels from across servers in one unified view. It reads Discord's native (but unreleased) favorites protobuf data and provides full add/remove/organize capabilities.

## Approach

**Server List Icon + Custom Panel** — a star icon in the server list (via Vencord's `ServerListAPI`) toggles a custom panel that replaces the channel list area. This gives clean separation, full UI control, and uses a stable Vencord API hook point.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│ Discord Client                                       │
│                                                      │
│  ┌──────────┐  ┌──────────────────────────────────┐  │
│  │ Server   │  │ Favourites Panel                  │  │
│  │ List     │  │                                   │  │
│  │          │  │  Category (from protobuf)          │  │
│  │ [Star]◄──┼──┤    #channel-name     [ServerName] │  │
│  │          │  │    #another-channel  [ServerName]  │  │
│  │ Server1  │  │                                   │  │
│  │ Server2  │  │  Uncategorized                    │  │
│  │ ...      │  │    #general          [ServerName] │  │
│  └──────────┘  └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Components

1. **FavouritesIcon** — Star icon in server list via `ServerListRenderPosition.Above`. Toggles panel visibility.
2. **FavouritesPanel** — Main React component replacing the channel list area when active. Renders favorites grouped by protobuf categories.
3. **FavouritesStore (store.ts)** — Reads `UserSettingsProtoStore` for favorites data, subscribes to `USER_SETTINGS_PROTO_UPDATE` for real-time updates.
4. **FavouritesActions (actions.ts)** — Write operations: add/remove/reorder favorites via `PreloadedUserSettingsActionCreators`.
5. **Context Menu Patch** — Adds "Add to Favourites" / "Remove from Favourites" to channel right-click menus.

### Data Flow

```
UserSettingsProtoStore (protobuf)
  -> FavouritesStore (reads & subscribes)
    -> FavouritesPanel (renders)
      -> User clicks channel -> NavigationUtils.transitionTo()
      -> User right-clicks -> Context menu add/remove
        -> FavouritesActions (writes protobuf back)
          -> USER_SETTINGS_PROTO_UPDATE event
            -> FavouritesStore updates -> Panel re-renders
```

## Data Layer

### Reading Favorites

- `UserSettingsProtoStore` (pre-exported in `@webpack/common`) holds the decoded protobuf
- Protobuf structure: `Favorites.favorite_channels` map — channel ID -> `FavoriteChannel { nickname, type, position, parent_id }`
- `type`: `REFERENCE_ORIGINAL` (real channel) or `CATEGORY` (virtual grouping folder)
- Resolve channel metadata via `ChannelStore.getChannel(id)` and `GuildStore.getGuild(channel.guild_id)`

### Writing Favorites

- Use `PreloadedUserSettingsActionCreators` (pattern from FakeNitro plugin) to construct modified proto
- Dispatch `USER_SETTINGS_PROTO_UPDATE` with `local: true`
- Operations: add channel, remove channel, reorder (update position), create/delete categories

### Reactivity

- Flux events via plugin's `flux` property:
  - `USER_SETTINGS_PROTO_UPDATE` — favorites changed
  - `CONNECTION_OPEN` — initial load / reconnect
- React components use `useStateFromStores([UserSettingsProtoStore], ...)` for auto-rerender

### Edge Cases

- Deleted channel or lost access: show dimmed/unavailable, offer removal
- User no longer in guild: same treatment
- Empty favorites: friendly empty state with instructions

## UI Components

### FavouritesIcon
- Star icon, `ServerListRenderPosition.Above`
- Active highlight when panel is open
- Tooltip: "Favourites"

### FavouritesPanel
- Replaces channel list area via patching the sidebar component
- Header: "Favourites" title + collapse all button
- Scrollable via Discord's `ScrollerThin`

### ChannelEntry
- Channel type icon + name + server name badge
- Click: navigate to channel via `NavigationUtils.transitionTo()`
- Right-click: "Remove from Favourites", "Move to Category..."
- Dimmed style if inaccessible

### CategorySection
- Collapsible sections matching protobuf `CATEGORY` entries
- "Uncategorized" section at bottom for orphaned favorites
- Right-click: "Rename", "Delete Category"

### Context Menu Patch (channel-context)
- Not favorited: "Add to Favourites" with category submenu
- Already favorited: "Remove from Favourites"

### EmptyState
- "No favourites yet" message
- Hint: "Right-click any channel and select 'Add to Favourites'"

## File Structure

```
src/userplugins/favouritesPanel/
  index.tsx              # Plugin definition, patches, flux events, context menus
  store.ts               # Read/subscribe to UserSettingsProtoStore favorites data
  actions.ts             # Write operations via PreloadedUserSettingsActionCreators
  components/
    FavouritesIcon.tsx   # Server list star icon
    FavouritesPanel.tsx  # Main panel (scrollable favourites list)
    ChannelEntry.tsx     # Individual channel row
    CategorySection.tsx  # Collapsible category group
    EmptyState.tsx       # Empty state placeholder
  utils.ts               # Channel resolution helpers, navigation
  style.css              # Styles with vc-favourites-* prefix
```

## Settings

- `showServerBadge` (boolean, default true) — show server name next to channels
- `collapseByDefault` (boolean, default false) — categories start collapsed

## Styling

- All classes prefixed `vc-favourites-`
- Uses Discord CSS variables: `--channels-default`, `--interactive-hover`, `--background-secondary`, etc.
- Matches native Discord channel list look and feel

## Error Handling

- All React components wrapped in `ErrorBoundary`
- Channel/guild resolution failures: dimmed entry, no crash
- Proto write failures: logged to console, never silently swallowed

## Dependencies

Zero external npm packages. All from Vencord/Discord internals:
- `@webpack/common`: UserSettingsProtoStore, ChannelStore, GuildStore, useStateFromStores, FluxDispatcher, NavigationRouter
- `@api/ServerList`: addServerListElement, removeServerListElement
- `@api/Settings`: definePluginSettings
- `@utils/types`: definePlugin
- `@components/ErrorBoundary`: error wrapping

## Key Reference Plugins

- **PinDMs** — custom channel categories, persistent data, context menus
- **BetterFolders** — sidebar patching, folder state management
- **FakeNitro** — UserSettingsProtoStore access, proto manipulation pattern
- **MemberCount** — injecting custom UI via patches
