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
