import { ScrollerThin, useReducer, useEffect, ReactDOM } from "@webpack/common";
import ErrorBoundary from "@components/ErrorBoundary";
import { cl } from "../utils";
import { getGroupedFavourites, GroupedCategory, addChangeListener, removeChangeListener } from "../store";
import { isPanelOpen, registerPanelUpdater, setPanelOpen, settings } from "../state";
import { ChannelEntry } from "./ChannelEntry";
import { CategorySection } from "./CategorySection";
import { EmptyState } from "./EmptyState";

function FavouritesPanelInner() {
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    registerPanelUpdater(forceUpdate);

    // Re-render when favourites data changes in DataStore
    useEffect(() => {
        addChangeListener(forceUpdate);
        return () => removeChangeListener(forceUpdate);
    }, [forceUpdate]);

    const showServerBadge = settings.use(["showServerBadge"]).showServerBadge;
    const collapseByDefault = settings.use(["collapseByDefault"]).collapseByDefault;

    if (!isPanelOpen) return null;

    const grouped = getGroupedFavourites();
    const hasAny = grouped.categories.length > 0 || grouped.uncategorized.length > 0;

    const panel = (
        <div className={cl("panel")}>
            <div className={cl("panel-header")}>
                <span>Favourites</span>
                <div
                    className={cl("panel-close")}
                    onClick={() => setPanelOpen(false)}
                    role="button"
                    tabIndex={0}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z" />
                    </svg>
                </div>
            </div>
            <ScrollerThin className={cl("panel-content")} fade>
                {!hasAny && <EmptyState />}
                {grouped.categories.map((cat: GroupedCategory) => (
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

    const container = document.getElementById("app-mount") ?? document.body;
    return ReactDOM.createPortal(panel, container);
}

export const FavouritesPanel = ErrorBoundary.wrap(FavouritesPanelInner, { noop: true });
