import ErrorBoundary from "@components/ErrorBoundary";
import { cl } from "../utils";
import { Tooltip } from "@webpack/common";

interface FavouritesIconProps {
    active: boolean;
    onClick: () => void;
}

function FavouritesIconInner({ active, onClick }: FavouritesIconProps) {
    return (
        <div className={cl("icon-wrapper")}>
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
        </div>
    );
}

export const FavouritesIcon = ErrorBoundary.wrap(FavouritesIconInner, { noop: true });
