import { AppComponent } from "../../mixeryapi/appcomponent.js";
import { AppPlugins } from "../../mixeryapi/appplugins.js";
import { ToolComponents } from "../../mixeryapi/toolcomponent.js";
import { Session } from "../session.js";

export namespace InternalAppPlugins {
    export class Plugin extends AppPlugins.Plugin {
        info: AppPlugins.PluginInfo;

        get name() {return this.info?.name;}
        get authors() {return this.info?.authors;}
        loaded: boolean = false;
        enabled: boolean = false;

        components: AppComponent[] = [];
        
        session: Session;
        pluginModule: AppPlugins.PluginModule;

        constructor(session: Session, pluginPath: string) {
            super();
            this.session = session;
            this.load(pluginPath);
        }

        async load(path: string) {
            if (this.loaded) return;

            this.pluginModule = await import(path);
            this.loaded = true;

            this.info = this.pluginModule.plugin;
            if (this.pluginModule.onLoad) this.pluginModule.onLoad(this);

            this.components.forEach(component => {
                if (component instanceof ToolComponents.Tool) this.session.ui.registerTool(component);
            });
        }

        enable() {
            if (this.enabled) return;

            if (this.pluginModule.onEnable) this.pluginModule.onEnable();
            this.enabled = true;

            console.log("[apppl/" + this.name + "] Enabled.");
        }
        disable() {
            if (!this.enabled) return;

            if (this.pluginModule.onDisable) this.pluginModule.onDisable();
            this.enabled = false;

            console.log("[apppl/" + this.name + "] Disabled.");
        }
        registerComponent(component: AppComponent) {
            this.components.push(component);
            return this;
        }
    }

    export class AppPluginsManager {
        session: Session;
        plugins: InternalAppPlugins.Plugin[] = [];

        constructor(session: Session) {
            this.session = session;
        }

        async loadFromRemoteList() {
            const PATH = "../assets/appplugins.json";
            let fetchInfo = await fetch(PATH);
            if (fetchInfo.ok) {
                let obj: AppPlugins.PluginListing = await fetchInfo.json();
                obj.available.forEach(val => {
                    this.loadPluginNS(val);
                    console.log("[apppl/mgr] Loading " + val + "...");
                });

                this.enableAll(obj.disabled);
                console.log("[apppl/mgr] Now enabling plugins...");
            } else throw "Cannot fetch remote list";
        }

        loadPluginNS(namespace: string): InternalAppPlugins.Plugin {
            // session.appPlugins.loadPlugin("../../appplugins/Mixery/index.js");
            return this.loadPlugin("../../appplugins/" + namespace + "/index.js");
        }

        loadPlugin(path: string): InternalAppPlugins.Plugin {
            let p = new InternalAppPlugins.Plugin(this.session, path);
            this.plugins.push(p);
            return p;
        }

        enableAll(filter: string[] = []) {
            let task = setInterval(() => {
                let stop = true;
                this.plugins.forEach(plugin => {
                    if (!plugin.loaded) {
                        stop = false;
                        return;
                    } else if (!plugin.enabled && !filter.includes(plugin.name)) plugin.enable();
                });

                if (stop) clearInterval(task);
            }, 100);
        }
    }
}