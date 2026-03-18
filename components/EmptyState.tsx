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
