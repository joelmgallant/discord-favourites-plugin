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
