import { Session } from "../mixerycore/session.js";
import { AppComponent } from "./appcomponent.js";

export namespace AppPlugins {
    export interface PluginModule {
        plugin: PluginInfo;

        onLoad?(plugin: Plugin): void;
        onEnable?(): void;
        onDisable?(): void;
        onError?(e: Error);
    }
    export interface PluginInfo {
        name: string;
        authors: string[];
        versionNo?: number;
    }
    export abstract class Plugin {
        abstract readonly name: string;
        abstract readonly authors: string[];
        abstract readonly loaded: boolean;
        abstract readonly enabled: boolean;

        abstract readonly components: AppComponent[];

        abstract readonly session: Session;

        abstract enable(): void;
        abstract disable(): void;
        abstract registerComponent(component: AppComponent): this;
    }

    export interface PluginListing {
        available: string[];
        disabled: string[];
    }
}