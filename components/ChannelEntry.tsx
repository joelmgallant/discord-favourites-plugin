import { cl, navigateToChannel } from "../utils";
import { ResolvedFavourite } from "../store";

function ChannelTypeIcon({ type }: { type: number; }) {
    // Discord channel types: 0=text, 2=voice, 5=announcement, 13=stage, 15=forum, 16=media
    switch (type) {
        case 2: // voice
            return (
                <svg className={cl("channel-icon")} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3a1 1 0 0 0-1-1h-.06a1 1 0 0 0-.74.32L5.92 7H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2.92l4.28 4.68a1 1 0 0 0 .74.32H11a1 1 0 0 0 1-1V3ZM15.1 20.75c-.58.14-1.1-.33-1.1-.92v-.03c0-.5.37-.92.85-1.05a7 7 0 0 0 0-13.5A1.11 1.11 0 0 1 14 4.2v-.03c0-.6.52-1.06 1.1-.92a9 9 0 0 1 0 17.5Z" />
                    <path d="M15.16 16.51c-.57.28-1.16-.2-1.16-.83v-.14c0-.43.28-.8.63-1.02a3 3 0 0 0 0-5.04c-.35-.23-.63-.6-.63-1.02v-.14c0-.63.59-1.1 1.16-.83a5 5 0 0 1 0 9.02Z" />
                </svg>
            );
        case 5: // announcement
            return (
                <svg className={cl("channel-icon")} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.9 8.26H2V15.2941H3.9V8.26Z" />
                    <path d="M19.1 4V18.4708L4.92 15.2941V8.26L19.1 4Z" />
                    <path d="M21 7.01L19.1 7.5V16.5L21 17V7.01Z" />
                    <path d="M6.56 15.6L7.4 21.4H9.62L8.75 15.17L6.56 15.6Z" />
                </svg>
            );
        case 15: // forum
        case 16: // media
            return (
                <svg className={cl("channel-icon")} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.4 4L12 6.93 5.6 4 2 16h3l1.58-7.12L12 12.07l5.42-3.19L19 16h3L18.4 4Z" />
                </svg>
            );
        default: // text
            return (
                <svg className={cl("channel-icon")} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.88657 21C5.57547 21 5.3399 20.7189 5.39427 20.4126L6.00001 17H2.59511C2.28449 17 2.04905 16.7198 2.10259 16.4138L2.27759 15.4138C2.31946 15.1746 2.52722 15 2.77011 15H6.35001L7.41001 9H4.00511C3.69449 9 3.45905 8.71977 3.51259 8.41381L3.68759 7.41381C3.72946 7.17456 3.93722 7 4.18011 7H7.76001L8.39677 3.41262C8.43914 3.17391 8.64664 3 8.88907 3H9.87344C10.1845 3 10.4201 3.28107 10.3657 3.58738L9.76001 7H15.76L16.3968 3.41262C16.4391 3.17391 16.6466 3 16.8891 3H17.8734C18.1845 3 18.4201 3.28107 18.3657 3.58738L17.76 7H21.1649C21.4755 7 21.711 7.28023 21.6574 7.58619L21.4824 8.58619C21.4406 8.82544 21.2328 9 20.9899 9H17.41L16.35 15H19.7549C20.0655 15 20.301 15.2802 20.2474 15.5862L20.0724 16.5862C20.0306 16.8254 19.8228 17 19.5799 17H16L15.3632 20.5874C15.3209 20.8261 15.1134 21 14.8709 21H13.8866C13.5755 21 13.3399 20.7189 13.3943 20.4126L14 17H8.00001L7.36325 20.5874C7.32088 20.8261 7.11337 21 6.87094 21H5.88657ZM9.41045 9L8.35045 15H14.3504L15.4104 9H9.41045Z" />
                </svg>
            );
    }
}

interface ChannelEntryProps {
    favourite: ResolvedFavourite;
    showServerBadge: boolean;
}

export function ChannelEntry({ favourite, showServerBadge }: ChannelEntryProps) {
    const displayName = favourite.nickname || favourite.channelName;

    return (
        <div
            className={cl("channel", { inaccessible: !favourite.accessible })}
            onClick={() => {
                if (favourite.accessible) {
                    navigateToChannel(favourite.guildId, favourite.id);
                }
            }}
            role="button"
            tabIndex={0}
        >
            <ChannelTypeIcon type={favourite.channelType} />
            <span className={cl("channel-name")}>{displayName}</span>
            {showServerBadge && favourite.guildName && (
                <span className={cl("server-badge")}>{favourite.guildName}</span>
            )}
        </div>
    );
}
