import { AppPlugins } from "../../mixeryapi/appplugins.js";
export var InternalAppPlugins;
(function (InternalAppPlugins) {
    class Plugin extends AppPlugins.Plugin {
        constructor(session, pluginPath) {
            super();
            this.loaded = false;
            this.enabled = false;
            this.components = [];
            this.session = session;
            this.load(pluginPath);
        }
        get name() { return this.info?.name; }
        get authors() { return this.info?.authors; }
        async load(path) {
            if (this.loaded)
                return;
            this.pluginModule = await import(path);
            this.loaded = true;
            this.info = this.pluginModule.plugin;
            if (this.pluginModule.onLoad)
                this.pluginModule.onLoad(this);
        }
        enable() {
            if (this.enabled)
                return;
            if (this.pluginModule.onEnable)
                this.pluginModule.onEnable();
            this.enabled = true;
            console.log("[apppl/" + this.name + "] Enabled.");
        }
        disable() {
            if (!this.enabled)
                return;
            if (this.pluginModule.onDisable)
                this.pluginModule.onDisable();
            this.enabled = false;
            console.log("[apppl/" + this.name + "] Disabled.");
        }
        registerComponent(component) {
            return this;
        }
    }
    InternalAppPlugins.Plugin = Plugin;
    class AppPluginsManager {
        constructor(session) {
            this.plugins = [];
            this.session = session;
        }
        async loadFromRemoteList() {
            const PATH = "../assets/appplugins.json";
            let fetchInfo = await fetch(PATH);
            if (fetchInfo.ok) {
                let obj = await fetchInfo.json();
                obj.available.forEach(val => {
                    this.loadPluginNS(val);
                    console.log("[apppl/mgr] Loading " + val + "...");
                });
                this.enableAll(obj.disabled);
                console.log("[apppl/mgr] Now enabling plugins...");
            }
            else
                throw "Cannot fetch remote list";
        }
        loadPluginNS(namespace) {
            return this.loadPlugin("../../appplugins/" + namespace + "/index.js");
        }
        loadPlugin(path) {
            let p = new InternalAppPlugins.Plugin(this.session, path);
            this.plugins.push(p);
            return p;
        }
        enableAll(filter = []) {
            let task = setInterval(() => {
                let stop = true;
                this.plugins.forEach(plugin => {
                    if (!plugin.loaded) {
                        stop = false;
                        return;
                    }
                    else if (!plugin.enabled && !filter.includes(plugin.name))
                        plugin.enable();
                });
                if (stop)
                    clearInterval(task);
            }, 100);
        }
    }
    InternalAppPlugins.AppPluginsManager = AppPluginsManager;
})(InternalAppPlugins || (InternalAppPlugins = {}));