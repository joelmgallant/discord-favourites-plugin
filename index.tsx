import definePlugin from "@utils/types";
import { addServerListElement, removeServerListElement, ServerListRenderPosition } from "@api/ServerList";
import { Alerts, Menu } from "@webpack/common";
import { FavouritesIcon } from "./components/FavouritesIcon";
import { FavouritesPanel } from "./components/FavouritesPanel";
import { isFavourited, getCategories } from "./store";
import { addFavourite, removeFavourite, createCategoryWithChannel } from "./actions";
import { isPanelOpen, setPanelOpen, cleanupPanelState, settings } from "./state";
import "./style.css";

function FavouritesServerIcon() {
    return (
        <FavouritesIcon
            active={isPanelOpen}
            onClick={() => setPanelOpen(!isPanelOpen)}
        />
    );
}

function FavouritesPanelOverlay() {
    return <FavouritesPanel />;
}

export default definePlugin({
    name: "FavouritesPanel",
    description: "Shows all your favourite channels from across servers in one unified sidebar panel",
    authors: [{ name: "Joel Gallant", id: 0n }],
    dependencies: ["ServerListAPI"],
    settings,

    start() {
        addServerListElement(ServerListRenderPosition.Above, FavouritesServerIcon);
        addServerListElement(ServerListRenderPosition.Above, FavouritesPanelOverlay);
    },

    stop() {
        removeServerListElement(ServerListRenderPosition.Above, FavouritesServerIcon);
        removeServerListElement(ServerListRenderPosition.Above, FavouritesPanelOverlay);
        cleanupPanelState();
    },

    flux: {
        CHANNEL_SELECT() {
            if (isPanelOpen) {
                setPanelOpen(false);
            }
        },
        CONNECTION_OPEN() {
            // Re-render panel on reconnect to pick up fresh proto data
        },
    },

    contextMenus: {
        "channel-context"(children, { channel }: { channel: any; }) {
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
                                        Alerts.show({
                                            title: "New Favourites Category",
                                            body: "Enter a name for the new category:",
                                            confirmText: "Create",
                                            cancelText: "Cancel",
                                            onConfirm: (value: string) => {
                                                if (value?.trim()) {
                                                    createCategoryWithChannel(value.trim(), channel.id);
                                                }
                                            },
                                        });
                                    }}
                                />,
                            ]}
                        </Menu.MenuItem>
                    </Menu.MenuGroup>
                );
            }
        },
    },
});
