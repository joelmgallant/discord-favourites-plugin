import * as DataStore from "@api/DataStore";
import { ChannelStore, GuildStore } from "@webpack/common";

const STORE_KEY = "FavouritesPanel_favourites";

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

export interface GroupedCategory extends ResolvedFavourite {
    children: ResolvedFavourite[];
}

// In-memory cache of favourites, kept in sync with DataStore
let favouritesCache: Record<string, FavouriteChannel> = {};

// Listeners that get called when favourites change
const listeners: Set<() => void> = new Set();

export function addChangeListener(listener: () => void) {
    listeners.add(listener);
}

export function removeChangeListener(listener: () => void) {
    listeners.delete(listener);
}

function notifyListeners() {
    listeners.forEach(fn => fn());
}

export async function loadFavourites() {
    const stored = await DataStore.get(STORE_KEY);
    favouritesCache = stored ?? {};
}

async function saveFavourites() {
    await DataStore.set(STORE_KEY, favouritesCache);
    notifyListeners();
}

export function getFavourites(): FavouriteChannel[] {
    return Object.values(favouritesCache).sort((a, b) => a.position - b.position);
}

export function getCategories(): FavouriteChannel[] {
    return getFavourites().filter(f => f.type === FavouriteChannelType.CATEGORY);
}

export function isFavourited(channelId: string): boolean {
    return channelId in favouritesCache;
}

function getNextPosition(): number {
    const favs = Object.values(favouritesCache);
    if (favs.length === 0) return 0;
    return Math.max(...favs.map(f => f.position)) + 1;
}

function resolveFavourite(fav: FavouriteChannel): ResolvedFavourite {
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

export function getGroupedFavourites(): { categories: GroupedCategory[]; uncategorized: ResolvedFavourite[] } {
    const all = getFavourites().map(resolveFavourite);
    const categories = all.filter(f => f.type === FavouriteChannelType.CATEGORY);
    const channels = all.filter(f => f.type !== FavouriteChannelType.CATEGORY);

    const categorized = new Set<string>();
    const grouped: GroupedCategory[] = categories.map(cat => {
        const children = channels.filter(ch => ch.parentId === cat.id);
        children.forEach(ch => categorized.add(ch.id));
        return { ...cat, children };
    });

    const uncategorized = channels.filter(ch => !categorized.has(ch.id));

    return { categories: grouped, uncategorized };
}

// Write operations

export async function addFavourite(channelId: string, parentId?: string) {
    favouritesCache[channelId] = {
        id: channelId,
        nickname: "",
        type: FavouriteChannelType.REFERENCE_ORIGINAL,
        position: getNextPosition(),
        parentId: parentId ?? null,
    };
    await saveFavourites();
}

export async function removeFavourite(channelId: string) {
    delete favouritesCache[channelId];
    await saveFavourites();
}

export async function createCategory(name: string): Promise<string> {
    const categoryId = String(Date.now());
    favouritesCache[categoryId] = {
        id: categoryId,
        nickname: name,
        type: FavouriteChannelType.CATEGORY,
        position: getNextPosition(),
        parentId: null,
    };
    await saveFavourites();
    return categoryId;
}

export async function createCategoryWithChannel(name: string, channelId: string): Promise<string> {
    const categoryId = String(Date.now());
    const basePosition = getNextPosition();

    favouritesCache[categoryId] = {
        id: categoryId,
        nickname: name,
        type: FavouriteChannelType.CATEGORY,
        position: basePosition,
        parentId: null,
    };

    favouritesCache[channelId] = {
        id: channelId,
        nickname: "",
        type: FavouriteChannelType.REFERENCE_ORIGINAL,
        position: basePosition + 1,
        parentId: categoryId,
    };

    await saveFavourites();
    return categoryId;
}

export async function removeCategory(categoryId: string) {
    delete favouritesCache[categoryId];

    // Uncategorize children
    for (const fav of Object.values(favouritesCache)) {
        if (fav.parentId === categoryId) {
            fav.parentId = null;
        }
    }

    await saveFavourites();
}

export async function moveFavouriteToCategory(channelId: string, categoryId: string | null) {
    if (!favouritesCache[channelId]) return;
    favouritesCache[channelId].parentId = categoryId;
    await saveFavourites();
}

export async function renameFavourite(id: string, nickname: string) {
    if (!favouritesCache[id]) return;
    favouritesCache[id].nickname = nickname;
    await saveFavourites();
}
