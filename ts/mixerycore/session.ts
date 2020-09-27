import { Playlist } from "./playlist.js";
import { Plugins } from "./plugins.js";
import { NotificationsManager } from "../notifications/notificationsmgr.js";
import { msToBeats } from "../utils/msbeats.js";
import { MIDIClip } from "./clips.js";
import ContextMenu, { ContextMenuEntry } from "../contextmenus/menu.js";

export class Session {
    appControls = new SessionControls();
    menus = new SessionMenus();

    playlist: Playlist;
    plugins: Plugins;
    notifications: NotificationsManager;

    // General
    bpm: number = 120;

    // Views
    pxPerBeat: number = 100;
    pxPerBeatTo: number = 100;
    scrolledBeats: number = 0;
    get scrolledPixels() {return this.pxPerBeat * this.scrolledBeats;}
    set scrolledPixels(value: number) {this.scrolledBeats = value / this.pxPerBeat;}
    scrollFriction: number = 0;
    
    realScrolledBeats: number = 0;
    get realScrolledPixels() {return this.pxPerBeat * this.realScrolledBeats;}
    set realScrolledPixels(value: number) {this.realScrolledBeats = value / this.pxPerBeat;}

    // Player
    seeker: number = 0;
    playing: boolean = false;
    playTimestamp: number = 0;
    get playedLength() {return this.playing? (Date.now() - this.playTimestamp) : 0;}
    get playedBeats() {return msToBeats(this.playedLength, this.bpm);}

    // Dedicated to clip editor
    clipEditor = {
        noteLength: 0.125,
        availableLengths: [0.0625, 0.125, 0.1875, 0.25, 0.3125, 0.375, 0.4375, 0.5, 0.5625, 0.625, 0.6875, 0.75, 0.8125, 0.875, 0.9375, 1],
        // Yes i've used a tool to generate these values,

        verticalZoom: 25, // 25px height per note
        verticalScroll: 0
    };

    // Settings
    settings = {
        title: "Settings",

        rendering: {
            title: "Rendering settings",
            renderNotes: true
        }
    };
    keyboardShortcuts: {
        name: string,
        code: string,
        action: () => void
    }[] = [];

    // Extras
    isElectron: boolean = false;

    constructor() {
        this.playlist = new Playlist(this);
        this.plugins = new Plugins(this);
        this.notifications = new NotificationsManager();

        // Also add keyboard events
        document.addEventListener("keydown", event => {
            const keyStr = (event.ctrlKey? "Ctrl + " : "") + (event.altKey? "Alt + " : "") + (event.shiftKey? "Shift + " : "") + event.code;
            this.keyboardShortcuts.forEach(shortcut => {
                if (shortcut.code === keyStr) shortcut.action();
            });

            if ((event.target as HTMLDivElement).isContentEditable) return;
            switch (keyStr) {
                case "Ctrl + KeyR": this.notifications.push({
                    title: "a",
                    desc: "Use Ctrl + Shift + R to reload instead.",
                    duration: 2500,
                    tags: ["reloadshortcut"]
                });
                event.preventDefault(); break;
                case "Ctrl + Shift + KeyR":
                case "F12": break;
                default: event.preventDefault(); break;
            }
        });
    }

    play() {
        if (this.playing) return;
        this.playing = true;
        this.playTimestamp = Date.now();

        // Pass all clips to all generators
        this.playlist.tracks.forEach(track => {
            if (!track.unmuted) return;

            track.clips.forEach(clip => {
                if (clip instanceof MIDIClip) clip.generator.playClip(clip, clip.offset - this.seeker);
            });
        });
    }
    stop() {
        this.playing = false;

        // Stop all generators
    }
    stopAndThenPlay() {
        this.stop();
        this.play();
    }
    playToggle() {
        if (this.playing) this.stop();
        else this.play();
    }

    processTopbar(ele: HTMLDivElement) {
        function linkMenu(div: HTMLDivElement, menu: ContextMenu) {
            div.addEventListener("click", event => {
                menu.openMenu(div.offsetLeft, ele.offsetHeight);
            });
        }

        linkMenu(ele.querySelector("div#file.topbarbutton"), this.menus.file);
        linkMenu(ele.querySelector("div#help.topbarbutton"), this.menus.help);
    }

    electronAppEnabled() {
        this.menus.file.entries.push(new ContextMenuEntry("Close", () => {
            this.appControls.close();
        }));
        this.menus.help.entries.push(new ContextMenuEntry("Mixery Electron Source Code", () => {
            window.open("https://github.com/nahkd123/Mixery-Electron");
        }));

        console.log("Electron features enabled. It might cause some problem if you're trying to use Electron-only features.");
    }
}

export class SessionControls {
    /**
     * Close current app. Only works in Electron BrowserWindow
     */
    close() {
        // TODO we should ask for discarding any changes in here
        close();
    }
}

export class SessionMenus {
    file: ContextMenu = new ContextMenu();
    help: ContextMenu = new ContextMenu();

    constructor() {
        this.file.entries.push(new ContextMenuEntry("Open", () => {}));
        
        this.help.entries.push(new ContextMenuEntry("Documentation", () => {
            window.open("https://github.com/nahkd123/Mixery/wiki");
        }));
        this.help.entries.push(new ContextMenuEntry("About", () => {}));
        this.help.entries.push(new ContextMenuEntry("License info (GPL v3.0)", () => {
            window.open("https://www.gnu.org/licenses/gpl-3.0.html");
        }));
        this.help.entries.push(new ContextMenuEntry("Source Code!", () => {
            window.open("https://github.com/nahkd123/Mixery");
        }));
    }
}