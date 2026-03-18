import definePlugin from "@utils/types";
import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";
import { addServerListElement, removeServerListElement, ServerListRenderPosition } from "@api/ServerList";
import { Menu } from "@webpack/common";
import { FavouritesIcon } from "./components/FavouritesIcon";
import { FavouritesPanel } from "./components/FavouritesPanel";
import { isFavourited, getCategories } from "./store";
import { addFavourite, removeFavourite, createCategory } from "./actions";
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
            if (isPanelOpen) {
                setPanelOpen(false);
            }
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
});
