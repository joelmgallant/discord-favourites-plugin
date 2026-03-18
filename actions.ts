import { proxyLazyWebpack } from "@webpack";
import { FluxDispatcher } from "@webpack/common";
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

export function createCategoryWithChannel(name: string, channelId: string): string {
    const favourites = cloneCurrentFavourites();
    if (!favourites.favoriteChannels) favourites.favoriteChannels = {};

    const categoryId = String(Date.now());
    const basePosition = getNextPosition();

    favourites.favoriteChannels[categoryId] = {
        nickname: name,
        type: FavouriteChannelType.CATEGORY,
        position: basePosition,
        parentId: "0",
    };

    favourites.favoriteChannels[channelId] = {
        nickname: "",
        type: FavouriteChannelType.REFERENCE_ORIGINAL,
        position: basePosition + 1,
        parentId: categoryId,
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
