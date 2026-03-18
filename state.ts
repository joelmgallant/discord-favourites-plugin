import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

export let isPanelOpen = false;
let forceUpdatePanel: (() => void) | null = null;

export function setPanelOpen(open: boolean) {
    isPanelOpen = open;
    forceUpdatePanel?.();
}

export function registerPanelUpdater(updater: () => void) {
    forceUpdatePanel = updater;
}

export function cleanupPanelState() {
    isPanelOpen = false;
    forceUpdatePanel = null;
}

export const settings = definePluginSettings({
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
