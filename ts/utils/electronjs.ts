export namespace ElectronJSApp {
    export interface FileEntry {
        dateCreate: number;
        contents: string | Uint8Array;
    }

    export type WindowState = "maximized" | "minimized" | "windowed";

    export interface API {
        _filesMap?: any;

        // Files
        listFiles: (path: string) => string[];
        readFile: (path: string) => FileEntry;

        // UI
        close: () => void;
        maximize: () => void;
        minimize: () => void;
        restore: () => void;
        getWindowState: () => WindowState;
    }
}