declare type InstallPromptPlatform = "";

declare interface BeforeInstallPromptEvent extends Event {
    readonly platforms: InstallPromptPlatform[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed',
        platform: InstallPromptPlatform
    }>;

    prompt(): Promise<void>;
}

interface WindowEventMap {
    "beforeinstallprompt": BeforeInstallPromptEvent;
}