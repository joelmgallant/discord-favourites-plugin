# Favourites Panel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a standalone Vencord plugin that shows all of a user's favorited channels across servers in a unified sidebar panel, with full add/remove/organize capabilities.

**Architecture:** Server list star icon (via ServerListAPI) toggles a custom panel that replaces the channel sidebar. Reads/writes Discord's native favorites protobuf via UserSettingsProtoStore. Context menu patches on channels for add/remove.

**Tech Stack:** TypeScript, React, Vencord Plugin APIs, Discord internal Flux stores and protobuf settings.

---

### Task 1: Development Environment Setup

**Files:**
- Create: `README.md` (brief setup instructions)

**Step 1: Verify Vencord source installation**

The user must have Vencord built from source. Check for it:

```bash
ls ~/Vencord/src/userplugins/ 2>/dev/null || ls ~/vencord/src/userplugins/ 2>/dev/null || echo "Vencord source not found - user must provide path"
```

If not found, ask the user for their Vencord source path.

**Step 2: Symlink plugin into Vencord**

```bash
# Replace VENCORD_PATH with actual path
ln -s /Users/joelmgallant/Desktop/discord-favourites-plugin VENCORD_PATH/src/userplugins/favouritesPanel
```

**Step 3: Verify the symlink works**

```bash
ls -la VENCORD_PATH/src/userplugins/favouritesPanel/
```

Expected: symlink pointing to our project directory.

**Step 4: Create README with setup instructions**

```markdown
# Discord Favourites Panel (Vencord Plugin)

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
```

**Step 5: Commit**

```bash
git add README.md
git commit -m "feat: add README with setup instructions"
```

---

### Task 2: Plugin Skeleton with Settings

**Files:**
- Create: `index.tsx`

**Step 1: Create the minimal plugin definition**

```tsx
import definePlugin from "@utils/types";
import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

const settings = definePluginSettings({
    showServerBadge: {
        type: OptionType.BOOLEAN,
        description: "Show server name next to channels",
        default: true,
    },
    collapseByDefault: {
        type: OptionType.BOOLEAN,
        description: "Collapse categories by default",
        default: false,
    },
});

export default definePlugin({
    name: "FavouritesPanel",
    description: "Shows all your favourite channels from across servers in one unified sidebar panel",
    authors: [{ name: "Joel Gallant", id: 0n }],
    settings,

    start() {
        console.log("[FavouritesPanel] Plugin started");
    },

    stop() {
        console.log("[FavouritesPanel] Plugin stopped");
    },
});
```

**Step 2: Build and verify**

```bash
cd VENCORD_PATH && pnpm build
```

Expected: build succeeds with no errors.

**Step 3: Verify in Discord**

Open Discord -> Vencord Settings -> Plugins. Search "FavouritesPanel". It should appear with the description and settings toggles.

**Step 4: Commit**

```bash
git add index.tsx
git commit -m "feat: add plugin skeleton with settings"
```

---

### Task 3: Discover and Read Favourites Proto Data

**Files:**
- Create: `store.ts`

**Step 1: Create discovery helper to explore the proto store**

We need to find the exact field path for favourites in the proto. Create `store.ts` with a discovery function first:

```ts
import { proxyLazyWebpack } from "@webpack";
import { UserSettingsActionCreators, UserSettingsProtoStore } from "@webpack/common";

const PreloadedUserSettingsActionCreators = proxyLazyWebpack(
    () => UserSettingsActionCreators.PreloadedUserSettingsActionCreators
);

export function discoverFavouritesProto() {
    console.log("[FavouritesPanel] Proto store settings:", UserSettingsProtoStore.settings);
    console.log("[FavouritesPanel] Current value:", PreloadedUserSettingsActionCreators.getCurrentValue());

    const current = PreloadedUserSettingsActionCreators.getCurrentValue();
    if (!current) {
        console.log("[FavouritesPanel] No current value available");
        return;
    }

    // Log all top-level fields to find favorites
    for (const key of Object.keys(current)) {
        console.log(`[FavouritesPanel] Field: ${key}`, current[key]);
    }

    // Try known field names
    const candidates = ["favorites", "favourites", "textAndImages"];
    for (const name of candidates) {
        if (current[name]) {
            console.log(`[FavouritesPanel] Found candidate: ${name}`, current[name]);
        }
    }

    // Explore proto class fields
    const protoClass = PreloadedUserSettingsActionCreators.ProtoClass;
    if (protoClass?.fields) {
        console.log("[FavouritesPanel] Proto class fields:",
            protoClass.fields.map((f: any) => f.localName));
    }
}
```

**Step 2: Wire discovery into plugin start()**

In `index.tsx`, import and call it:

```tsx
import { discoverFavouritesProto } from "./store";

// In start():
start() {
    discoverFavouritesProto();
},
```

**Step 3: Build, reload Discord, check console**

```bash
cd VENCORD_PATH && pnpm build
```

Open Discord DevTools (Ctrl+Shift+I) -> Console. Filter by `[FavouritesPanel]`. Note the exact field names and structure.

**Step 4: Implement the actual store based on discovery**

Once we know the field names (expected: `favorites` with `favoriteChannels` map), update `store.ts`:

```ts
import { proxyLazyWebpack } from "@webpack";
import { ChannelStore, GuildStore, UserSettingsActionCreators, UserSettingsProtoStore } from "@webpack/common";

const PreloadedUserSettingsActionCreators = proxyLazyWebpack(
    () => UserSettingsActionCreators.PreloadedUserSettingsActionCreators
);

export { PreloadedUserSettingsActionCreators };

export const enum FavouriteChannelType {
    UNSET = 0,
    REFERENCE_ORIGINAL = 1,
    CATEGORY = 2,
}

export interface FavouriteChannel {
    id: string;
    nickname: string;
    type: FavouriteChannelType;
    position: number;
    parentId: string | null;
}

export interface ResolvedFavourite extends FavouriteChannel {
    channelName: string;
    guildName: string;
    guildId: string;
    channelType: number;
    accessible: boolean;
}

export function getRawFavourites(): Record<string, any> {
    const current = PreloadedUserSettingsActionCreators.getCurrentValue();
    // Field name may need adjustment based on discovery
    return current?.favorites?.favoriteChannels ?? {};
}

export function getFavourites(): FavouriteChannel[] {
    const raw = getRawFavourites();
    const result: FavouriteChannel[] = [];

    for (const [id, fav] of Object.entries(raw)) {
        result.push({
            id,
            nickname: (fav as any).nickname ?? "",
            type: (fav as any).type ?? FavouriteChannelType.UNSET,
            position: (fav as any).position ?? 0,
            parentId: (fav as any).parentId ? String((fav as any).parentId) : null,
        });
    }

    return result.sort((a, b) => a.position - b.position);
}

export function getCategories(): FavouriteChannel[] {
    return getFavourites().filter(f => f.type === FavouriteChannelType.CATEGORY);
}

export function getChannelFavourites(): FavouriteChannel[] {
    return getFavourites().filter(f => f.type === FavouriteChannelType.REFERENCE_ORIGINAL);
}

export function isFavourited(channelId: string): boolean {
    return channelId in getRawFavourites();
}

export function resolveFavourite(fav: FavouriteChannel): ResolvedFavourite {
    if (fav.type === FavouriteChannelType.CATEGORY) {
        return {
            ...fav,
            channelName: fav.nickname || "Category",
            guildName: "",
            guildId: "",
            channelType: -1,
            accessible: true,
        };
    }

    const channel = ChannelStore.getChannel(fav.id);
    const guild = channel ? GuildStore.getGuild(channel.guild_id) : null;

    return {
        ...fav,
        channelName: channel?.name ?? "Unknown Channel",
        guildName: guild?.name ?? "Unknown Server",
        guildId: channel?.guild_id ?? "",
        channelType: channel?.type ?? 0,
        accessible: !!channel,
    };
}

export function getResolvedFavourites(): ResolvedFavourite[] {
    return getFavourites().map(resolveFavourite);
}

export function getGroupedFavourites(): { categories: ResolvedFavourite[]; uncategorized: ResolvedFavourite[] } {
    const all = getResolvedFavourites();
    const categories = all.filter(f => f.type === FavouriteChannelType.CATEGORY);
    const channels = all.filter(f => f.type !== FavouriteChannelType.CATEGORY);

    const categorized = new Set<string>();
    const grouped = categories.map(cat => {
        const children = channels.filter(ch => ch.parentId === cat.id);
        children.forEach(ch => categorized.add(ch.id));
        return { ...cat, children };
    });

    const uncategorized = channels.filter(ch => !categorized.has(ch.id));

    return { categories: grouped as any, uncategorized };
}
```

**Step 5: Remove discovery call from index.tsx start()**

Clean up — remove the `discoverFavouritesProto()` call from `start()`.

**Step 6: Build and verify**

```bash
cd VENCORD_PATH && pnpm build
```

Expected: compiles cleanly.

**Step 7: Commit**

```bash
git add store.ts index.tsx
git commit -m "feat: add favourites store layer to read proto data"
```

---

### Task 4: Favourites Actions (Write Proto)

**Files:**
- Create: `actions.ts`

**Step 1: Implement write operations**

```ts
import { proxyLazyWebpack } from "@webpack";
import { FluxDispatcher, UserSettingsActionCreators } from "@webpack/common";
import { PreloadedUserSettingsActionCreators, FavouriteChannelType, getRawFavourites } from "./store";

function searchProtoClassField(localName: string, protoClass: any) {
    const field = protoClass?.fields?.find((field: any) => field.localName === localName);
    if (!field) return;
    const fieldGetter = Object.values(field).find(value => typeof value === "function") as any;
    return fieldGetter?.();
}

const FavouritesProtoClass = proxyLazyWebpack(
    () => searchProtoClassField("favorites", PreloadedUserSettingsActionCreators.ProtoClass)
);

const FavouriteChannelProtoClass = proxyLazyWebpack(
    () => searchProtoClassField("favoriteChannels", FavouritesProtoClass)
);

function dispatchFavouritesUpdate(favouritesProto: any) {
    const proto = PreloadedUserSettingsActionCreators.ProtoClass.create();
    proto.favorites = favouritesProto;

    FluxDispatcher.dispatch({
        type: "USER_SETTINGS_PROTO_UPDATE",
        local: true,
        partial: true,
        settings: { type: 1, proto },
    });
}

function cloneCurrentFavourites(): any {
    const current = PreloadedUserSettingsActionCreators.getCurrentValue()?.favorites;
    if (current && FavouritesProtoClass.toBinary && FavouritesProtoClass.fromBinary) {
        return FavouritesProtoClass.fromBinary(FavouritesProtoClass.toBinary(current));
    }
    return FavouritesProtoClass.create();
}

function getNextPosition(): number {
    const raw = getRawFavourites();
    return Object.values(raw).reduce((max: number, f: any) => Math.max(max, (f.position ?? 0) + 1), 0);
}

export function addFavourite(channelId: string, parentId?: string) {
    const favourites = cloneCurrentFavourites();
    if (!favourites.favoriteChannels) favourites.favoriteChannels = {};

    favourites.favoriteChannels[channelId] = {
        nickname: "",
        type: FavouriteChannelType.REFERENCE_ORIGINAL,
        position: getNextPosition(),
        parentId: parentId ?? "0",
    };

    dispatchFavouritesUpdate(favourites);
}

export function removeFavourite(channelId: string) {
    const favourites = cloneCurrentFavourites();
    if (favourites.favoriteChannels) {
        delete favourites.favoriteChannels[channelId];
    }
    dispatchFavouritesUpdate(favourites);
}

export function createCategory(name: string): string {
    const favourites = cloneCurrentFavourites();
    if (!favourites.favoriteChannels) favourites.favoriteChannels = {};

    // Generate a pseudo-snowflake ID for the category
    const categoryId = String(Date.now());
    favourites.favoriteChannels[categoryId] = {
        nickname: name,
        type: FavouriteChannelType.CATEGORY,
        position: getNextPosition(),
        parentId: "0",
    };

    dispatchFavouritesUpdate(favourites);
    return categoryId;
}

export function removeCategory(categoryId: string) {
    const favourites = cloneCurrentFavourites();
    if (!favourites.favoriteChannels) return;

    // Remove the category itself
    delete favourites.favoriteChannels[categoryId];

    // Uncategorize any children (set parentId to "0")
    for (const [id, fav] of Object.entries(favourites.favoriteChannels)) {
        if ((fav as any).parentId === categoryId) {
            (fav as any).parentId = "0";
        }
    }

    dispatchFavouritesUpdate(favourites);
}

export function moveFavouriteToCategory(channelId: string, categoryId: string | null) {
    const favourites = cloneCurrentFavourites();
    if (!favourites.favoriteChannels?.[channelId]) return;

    favourites.favoriteChannels[channelId].parentId = categoryId ?? "0";
    dispatchFavouritesUpdate(favourites);
}

export function renameFavourite(id: string, nickname: string) {
    const favourites = cloneCurrentFavourites();
    if (!favourites.favoriteChannels?.[id]) return;

    favourites.favoriteChannels[id].nickname = nickname;
    dispatchFavouritesUpdate(favourites);
}
```

**Step 2: Build and verify**

```bash
cd VENCORD_PATH && pnpm build
```

Expected: compiles cleanly.

**Step 3: Commit**

```bash
git add actions.ts
git commit -m "feat: add favourites actions for writing proto data"
```

---

### Task 5: UI Components

**Files:**
- Create: `components/FavouritesIcon.tsx`
- Create: `components/EmptyState.tsx`
- Create: `components/ChannelEntry.tsx`
- Create: `components/CategorySection.tsx`
- Create: `components/FavouritesPanel.tsx`
- Create: `utils.ts`
- Create: `style.css`

**Step 1: Create utils.ts with shared helpers**

```ts
import { classNameFactory } from "@utils/css";
import { NavigationRouter } from "@webpack/common";

export const cl = classNameFactory("vc-favourites-");

export function navigateToChannel(guildId: string, channelId: string) {
    NavigationRouter.transitionTo(`/channels/${guildId}/${channelId}`);
}
```

**Step 2: Create style.css**

```css
.vc-favourites-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--background-primary);
    cursor: pointer;
    transition: border-radius 0.15s ease, background-color 0.15s ease;
    color: var(--channels-default);
    margin-bottom: 8px;
}

.vc-favourites-icon:hover,
.vc-favourites-icon.vc-favourites-active {
    border-radius: 16px;
    background: var(--brand-500);
    color: white;
}

.vc-favourites-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--background-secondary);
}

.vc-favourites-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 600;
    color: var(--header-primary);
    box-shadow: 0 1px 0 var(--background-modifier-accent);
}

.vc-favourites-panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
}

.vc-favourites-category {
    margin-bottom: 4px;
}

.vc-favourites-category-header {
    display: flex;
    align-items: center;
    padding: 6px 16px;
    cursor: pointer;
    color: var(--channels-default);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    user-select: none;
}

.vc-favourites-category-header:hover {
    color: var(--interactive-hover);
}

.vc-favourites-collapse-icon {
    margin-right: 4px;
    transition: transform 0.2s ease;
    width: 12px;
    height: 12px;
}

.vc-favourites-collapse-icon.vc-favourites-collapsed {
    transform: rotate(-90deg);
}

.vc-favourites-channel {
    display: flex;
    align-items: center;
    padding: 6px 16px 6px 32px;
    cursor: pointer;
    color: var(--channels-default);
    border-radius: 4px;
    margin: 0 8px;
    gap: 8px;
}

.vc-favourites-channel:hover {
    background: var(--background-modifier-hover);
    color: var(--interactive-hover);
}

.vc-favourites-channel.vc-favourites-inaccessible {
    opacity: 0.5;
}

.vc-favourites-channel-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
}

.vc-favourites-server-badge {
    font-size: 11px;
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 120px;
}

.vc-favourites-channel-icon {
    width: 20px;
    height: 20px;
    color: var(--channels-default);
    flex-shrink: 0;
}

.vc-favourites-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    color: var(--text-muted);
    gap: 8px;
}

.vc-favourites-empty-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--header-secondary);
}

.vc-favourites-empty-hint {
    font-size: 13px;
}
```

**Step 3: Create EmptyState component**

```tsx
// components/EmptyState.tsx
import { cl } from "../utils";

export function EmptyState() {
    return (
        <div className={cl("empty")}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <div className={cl("empty-title")}>No favourites yet</div>
            <div className={cl("empty-hint")}>
                Right-click any channel and select "Add to Favourites"
            </div>
        </div>
    );
}
```

**Step 4: Create ChannelEntry component**

```tsx
// components/ChannelEntry.tsx
import { cl, navigateToChannel } from "../utils";
import { ResolvedFavourite } from "../store";
import { removeFavourite } from "../actions";
import { Tooltip, Menu } from "@webpack/common";
import { useSettings } from "@api/Settings";

function ChannelTypeIcon({ type }: { type: number; }) {
    // Discord channel types: 0=text, 2=voice, 5=announcement, 13=stage, 15=forum, 16=media
    switch (type) {
        case 2: // voice
            return (
                <svg className={cl("channel-icon")} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3a1 1 0 0 0-1-1h-.06a1 1 0 0 0-.74.32L5.92 7H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2.92l4.28 4.68a1 1 0 0 0 .74.32H11a1 1 0 0 0 1-1V3ZM15.1 20.75c-.58.14-1.1-.33-1.1-.92v-.03c0-.5.37-.92.85-1.05a7 7 0 0 0 0-13.5A1.11 1.11 0 0 1 14 4.2v-.03c0-.6.52-1.06 1.1-.92a9 9 0 0 1 0 17.5Z" />
                    <path d="M15.16 16.51c-.57.28-1.16-.2-1.16-.83v-.14c0-.43.28-.8.63-1.02a3 3 0 0 0 0-5.04c-.35-.23-.63-.6-.63-1.02v-.14c0-.63.59-1.1 1.16-.83a5 5 0 0 1 0 9.02Z" />
                </svg>
            );
        case 5: // announcement
            return (
                <svg className={cl("channel-icon")} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.9 8.26H2V15.2941H3.9V8.26Z" />
                    <path d="M19.1 4V18.4708L4.92 15.2941V8.26L19.1 4Z" />
                    <path d="M21 7.01L19.1 7.5V16.5L21 17V7.01Z" />
                    <path d="M6.56 15.6L7.4 21.4H9.62L8.75 15.17L6.56 15.6Z" />
                </svg>
            );
        case 15: // forum
        case 16: // media
            return (
                <svg className={cl("channel-icon")} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.4 4L12 6.93 5.6 4 2 16h3l1.58-7.12L12 12.07l5.42-3.19L19 16h3L18.4 4Z" />
                </svg>
            );
        default: // text
            return (
                <svg className={cl("channel-icon")} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.88657 21C5.57547 21 5.3399 20.7189 5.39427 20.4126L6.00001 17H2.59511C2.28449 17 2.04905 16.7198 2.10259 16.4138L2.27759 15.4138C2.31946 15.1746 2.52722 15 2.77011 15H6.35001L7.41001 9H4.00511C3.69449 9 3.45905 8.71977 3.51259 8.41381L3.68759 7.41381C3.72946 7.17456 3.93722 7 4.18011 7H7.76001L8.39677 3.41262C8.43914 3.17391 8.64664 3 8.88907 3H9.87344C10.1845 3 10.4201 3.28107 10.3657 3.58738L9.76001 7H15.76L16.3968 3.41262C16.4391 3.17391 16.6466 3 16.8891 3H17.8734C18.1845 3 18.4201 3.28107 18.3657 3.58738L17.76 7H21.1649C21.4755 7 21.711 7.28023 21.6574 7.58619L21.4824 8.58619C21.4406 8.82544 21.2328 9 20.9899 9H17.41L16.35 15H19.7549C20.0655 15 20.301 15.2802 20.2474 15.5862L20.0724 16.5862C20.0306 16.8254 19.8228 17 19.5799 17H16L15.3632 20.5874C15.3209 20.8261 15.1134 21 14.8709 21H13.8866C13.5755 21 13.3399 20.7189 13.3943 20.4126L14 17H8.00001L7.36325 20.5874C7.32088 20.8261 7.11337 21 6.87094 21H5.88657ZM9.41045 9L8.35045 15H14.3504L15.4104 9H9.41045Z" />
                </svg>
            );
    }
}

interface ChannelEntryProps {
    favourite: ResolvedFavourite;
    showServerBadge: boolean;
}

export function ChannelEntry({ favourite, showServerBadge }: ChannelEntryProps) {
    const displayName = favourite.nickname || favourite.channelName;

    return (
        <div
            className={cl("channel", { inaccessible: !favourite.accessible })}
            onClick={() => {
                if (favourite.accessible) {
                    navigateToChannel(favourite.guildId, favourite.id);
                }
            }}
            role="button"
            tabIndex={0}
        >
            <ChannelTypeIcon type={favourite.channelType} />
            <span className={cl("channel-name")}>{displayName}</span>
            {showServerBadge && favourite.guildName && (
                <span className={cl("server-badge")}>{favourite.guildName}</span>
            )}
        </div>
    );
}
```

**Step 5: Create CategorySection component**

```tsx
// components/CategorySection.tsx
import { useState } from "@webpack/common";
import { cl } from "../utils";
import { ChannelEntry } from "./ChannelEntry";
import { ResolvedFavourite } from "../store";

interface CategorySectionProps {
    category: ResolvedFavourite & { children: ResolvedFavourite[]; };
    showServerBadge: boolean;
    defaultCollapsed: boolean;
}

export function CategorySection({ category, showServerBadge, defaultCollapsed }: CategorySectionProps) {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);

    return (
        <div className={cl("category")}>
            <div
                className={cl("category-header")}
                onClick={() => setCollapsed(!collapsed)}
            >
                <svg
                    className={cl("collapse-icon", { collapsed })}
                    viewBox="0 0 24 24"
                    width="12"
                    height="12"
                    fill="currentColor"
                >
                    <path d="M7 10l5 5 5-5H7z" />
                </svg>
                {category.nickname || "Category"}
            </div>
            {!collapsed && category.children.map(ch => (
                <ChannelEntry
                    key={ch.id}
                    favourite={ch}
                    showServerBadge={showServerBadge}
                />
            ))}
        </div>
    );
}
```

**Step 6: Create FavouritesPanel component**

```tsx
// components/FavouritesPanel.tsx
import { useStateFromStores, UserSettingsProtoStore, ScrollerThin } from "@webpack/common";
import { useSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { cl } from "../utils";
import { getGroupedFavourites, getChannelFavourites } from "../store";
import { ChannelEntry } from "./ChannelEntry";
import { CategorySection } from "./CategorySection";
import { EmptyState } from "./EmptyState";

function FavouritesPanelInner() {
    // Re-render when proto store updates
    const grouped = useStateFromStores(
        [UserSettingsProtoStore],
        () => getGroupedFavourites()
    );

    const settings = useSettings(["showServerBadge", "collapseByDefault"]);
    const showServerBadge = settings.plugins?.FavouritesPanel?.showServerBadge ?? true;
    const collapseByDefault = settings.plugins?.FavouritesPanel?.collapseByDefault ?? false;

    const hasAny = grouped.categories.length > 0 || grouped.uncategorized.length > 0;

    return (
        <div className={cl("panel")}>
            <div className={cl("panel-header")}>
                Favourites
            </div>
            <ScrollerThin className={cl("panel-content")} fade>
                {!hasAny && <EmptyState />}
                {grouped.categories.map((cat: any) => (
                    <CategorySection
                        key={cat.id}
                        category={cat}
                        showServerBadge={showServerBadge}
                        defaultCollapsed={collapseByDefault}
                    />
                ))}
                {grouped.uncategorized.length > 0 && (
                    <div className={cl("category")}>
                        {grouped.categories.length > 0 && (
                            <div className={cl("category-header")}>
                                Uncategorized
                            </div>
                        )}
                        {grouped.uncategorized.map(ch => (
                            <ChannelEntry
                                key={ch.id}
                                favourite={ch}
                                showServerBadge={showServerBadge}
                            />
                        ))}
                    </div>
                )}
            </ScrollerThin>
        </div>
    );
}

export const FavouritesPanel = ErrorBoundary.wrap(FavouritesPanelInner, { noop: true });
```

**Step 7: Create FavouritesIcon component**

```tsx
// components/FavouritesIcon.tsx
import ErrorBoundary from "@components/ErrorBoundary";
import { cl } from "../utils";
import { Tooltip } from "@webpack/common";

interface FavouritesIconProps {
    active: boolean;
    onClick: () => void;
}

function FavouritesIconInner({ active, onClick }: FavouritesIconProps) {
    return (
        <Tooltip text="Favourites" position="right">
            {(tooltipProps: any) => (
                <div
                    {...tooltipProps}
                    className={cl("icon", { active })}
                    onClick={onClick}
                    role="button"
                    tabIndex={0}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
            )}
        </Tooltip>
    );
}

export const FavouritesIcon = ErrorBoundary.wrap(FavouritesIconInner, { noop: true });
```

**Step 8: Build and verify**

```bash
cd VENCORD_PATH && pnpm build
```

Expected: compiles cleanly. Components aren't wired up yet, but no errors.

**Step 9: Commit**

```bash
git add utils.ts style.css components/
git commit -m "feat: add all UI components for favourites panel"
```

---

### Task 6: Wire Up Server List Icon and Panel Toggle

**Files:**
- Modify: `index.tsx`

**Step 1: Add ServerList API integration and panel state**

Replace `index.tsx` with the full wired-up version:

```tsx
import definePlugin from "@utils/types";
import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";
import { addServerListElement, removeServerListElement, ServerListRenderPosition } from "@api/ServerList";
import { FavouritesIcon } from "./components/FavouritesIcon";
import { FavouritesPanel } from "./components/FavouritesPanel";
import "./style.css";

export let isPanelOpen = false;
let forceUpdatePanel: (() => void) | null = null;

export function setPanelOpen(open: boolean) {
    isPanelOpen = open;
    forceUpdatePanel?.();
}

export function registerPanelUpdater(updater: () => void) {
    forceUpdatePanel = updater;
}

const settings = definePluginSettings({
    showServerBadge: {
        type: OptionType.BOOLEAN,
        description: "Show server name next to channels",
        default: true,
    },
    collapseByDefault: {
        type: OptionType.BOOLEAN,
        description: "Collapse categories by default",
        default: false,
    },
});

function FavouritesServerIcon() {
    return (
        <FavouritesIcon
            active={isPanelOpen}
            onClick={() => setPanelOpen(!isPanelOpen)}
        />
    );
}

export default definePlugin({
    name: "FavouritesPanel",
    description: "Shows all your favourite channels from across servers in one unified sidebar panel",
    authors: [{ name: "Joel Gallant", id: 0n }],
    dependencies: ["ServerListAPI"],
    settings,

    start() {
        addServerListElement(ServerListRenderPosition.Above, FavouritesServerIcon);
    },

    stop() {
        removeServerListElement(ServerListRenderPosition.Above, FavouritesServerIcon);
        isPanelOpen = false;
        forceUpdatePanel = null;
    },

    flux: {
        CHANNEL_SELECT() {
            // Close panel when user navigates to a channel via normal means
            if (isPanelOpen) {
                setPanelOpen(false);
            }
        },
    },
});
```

**Step 2: Build and verify**

```bash
cd VENCORD_PATH && pnpm build
```

Open Discord. The star icon should appear above the server list. Clicking it won't show a panel yet (we haven't patched the sidebar), but the icon should render and respond to clicks.

**Step 3: Commit**

```bash
git add index.tsx
git commit -m "feat: wire up server list icon with panel toggle state"
```

---

### Task 7: Panel Injection Patch

**Files:**
- Modify: `index.tsx` (add patches)

This is the trickiest part. We need to find the right component to patch for the channel sidebar. This requires runtime exploration.

**Step 1: Discover the sidebar component**

In Discord DevTools console, with Vencord loaded, explore:

```js
// Find the sidebar/channel list wrapper
Vencord.Webpack.find(m => m?.toString?.().includes("guildChannelList") || m?.toString?.().includes("privateChannels"))
```

Look for the component that renders the channel sidebar. Common identifiers:
- `"guildChannelList"`
- `"privateChannels"`
- `"sidebarContainer"`
- `"channels-"`
- `"sidebar-"`

**Step 2: Add patch to index.tsx**

Once the find string is identified, add a patch. The pattern will look something like this (exact `find` and `match` strings depend on discovery):

```tsx
// Add to the definePlugin object:
patches: [
    {
        // Patch the sidebar to conditionally render our panel
        // NOTE: The find string needs to be discovered at runtime
        find: "PLACEHOLDER_SIDEBAR_FIND_STRING",
        replacement: {
            match: /PLACEHOLDER_MATCH/,
            replace: "$self.renderFavouritesPanel()?$self.renderFavouritesPanel():$&",
        },
        predicate: () => true,
    },
],

// Add to the plugin object:
renderFavouritesPanel() {
    if (!isPanelOpen) return null;
    return <FavouritesPanel />;
},
```

**Alternative approach if sidebar patching proves too fragile:**

Use a CSS-based overlay approach — render the panel as a fixed-position element over the channel sidebar area when active:

```tsx
// In FavouritesPanel.tsx, add positioning:
// The panel renders as a portal/overlay on top of the channel sidebar
// This avoids fragile patches entirely
```

Update the CSS:
```css
.vc-favourites-panel {
    position: fixed;
    top: 0;
    left: 72px; /* width of server list */
    width: 240px; /* width of channel sidebar */
    height: 100vh;
    z-index: 100;
    background: var(--background-secondary);
}
```

This CSS overlay approach is more resilient to Discord updates.

**Step 3: Build and verify**

```bash
cd VENCORD_PATH && pnpm build
```

Open Discord. Click the star icon. The favourites panel should appear (either replacing or overlaying the channel sidebar).

**Step 4: Commit**

```bash
git add index.tsx style.css
git commit -m "feat: add panel injection for favourites sidebar"
```

---

### Task 8: Context Menu Integration

**Files:**
- Modify: `index.tsx` (add contextMenus)

**Step 1: Add channel context menu patch**

Add to the `definePlugin` object in `index.tsx`:

```tsx
import { Menu } from "@webpack/common";
import { isFavourited, getCategories } from "./store";
import { addFavourite, removeFavourite, createCategory } from "./actions";

// Add to definePlugin:
contextMenus: {
    "channel-context": (children, { channel }: { channel: any; }) => {
        if (!channel?.id) return;

        const favourited = isFavourited(channel.id);
        const categories = getCategories();

        if (favourited) {
            children.push(
                <Menu.MenuGroup>
                    <Menu.MenuItem
                        id="vc-favourites-remove"
                        label="Remove from Favourites"
                        action={() => removeFavourite(channel.id)}
                    />
                </Menu.MenuGroup>
            );
        } else {
            const categoryItems = categories.map(cat => (
                <Menu.MenuItem
                    key={cat.id}
                    id={`vc-favourites-add-${cat.id}`}
                    label={cat.nickname || "Category"}
                    action={() => addFavourite(channel.id, cat.id)}
                />
            ));

            children.push(
                <Menu.MenuGroup>
                    <Menu.MenuItem
                        id="vc-favourites-add"
                        label="Add to Favourites"
                        action={categories.length === 0 ? () => addFavourite(channel.id) : undefined}
                    >
                        {categories.length > 0 && [
                            <Menu.MenuItem
                                key="no-category"
                                id="vc-favourites-add-none"
                                label="No Category"
                                action={() => addFavourite(channel.id)}
                            />,
                            ...categoryItems,
                            <Menu.MenuSeparator key="sep" />,
                            <Menu.MenuItem
                                key="new-category"
                                id="vc-favourites-new-category"
                                label="New Category..."
                                action={() => {
                                    const name = prompt("Category name:");
                                    if (name) {
                                        const catId = createCategory(name);
                                        addFavourite(channel.id, catId);
                                    }
                                }}
                            />,
                        ]}
                    </Menu.MenuItem>
                </Menu.MenuGroup>
            );
        }
    },
},
```

**Step 2: Build and verify**

```bash
cd VENCORD_PATH && pnpm build
```

Open Discord. Right-click any channel. "Add to Favourites" should appear in the context menu. After adding, right-click again — it should show "Remove from Favourites".

**Step 3: Commit**

```bash
git add index.tsx
git commit -m "feat: add context menu integration for add/remove favourites"
```

---

### Task 9: Integration Testing and Polish

**Step 1: Full integration test checklist**

Manually verify in Discord:

- [ ] Star icon appears in server list
- [ ] Clicking star icon shows favourites panel
- [ ] Panel shows "No favourites yet" when empty
- [ ] Right-click channel -> "Add to Favourites" works
- [ ] Added channel appears in panel
- [ ] Server badge shows next to channel name
- [ ] Clicking channel in panel navigates to it
- [ ] Panel closes after navigating
- [ ] Right-click channel -> "Remove from Favourites" works
- [ ] Channel disappears from panel
- [ ] Categories work (create, add to, display)
- [ ] Categories collapse/expand
- [ ] Settings toggles work (server badge, collapse by default)
- [ ] Plugin disable/enable cycle works cleanly

**Step 2: Fix any issues found during testing**

Address bugs discovered during manual testing.

**Step 3: Final commit**

```bash
git add -A
git commit -m "fix: polish and integration fixes"
```
