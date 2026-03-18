import { useStateFromStores, UserSettingsProtoStore, ScrollerThin } from "@webpack/common";
import { useSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { cl } from "../utils";
import { getGroupedFavourites } from "../store";
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
