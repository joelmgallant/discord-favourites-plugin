import { classNameFactory } from "@utils/css";
import { NavigationRouter } from "@webpack/common";

export const cl = classNameFactory("vc-favourites-");

export function navigateToChannel(guildId: string, channelId: string) {
    NavigationRouter.transitionTo(`/channels/${guildId}/${channelId}`);
}
