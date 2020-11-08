export default class BundlesManager {
    constructor(session, explorer) {
        this.found = [];
        this.loaded = [];
        this.failed = [];
        this.session = session;
        this.explorer = explorer;
    }
    add(bundle) {
        this.found.push(bundle);
    }
    loadBundles() {
        if (this.found.length === 0)
            return;
        if (this.failed.length > 0)
            this.failed = [];
        console.log("[bundlesmgr] Found " + this.found.length + " bundles.");
        for (let i = 0; i < this.found.length; i++) {
            const bundle = this.found[i];
            console.log("[bundlesmgr] Loading " + bundle.name + " by " + bundle.author + "...");
            try {
                let explorerSection = this.explorer.addSection(bundle.name);
                explorerSection.addContents(bundle.generators);
                explorerSection.addContents(bundle.effects);
                explorerSection.addContents(bundle.audios);
                bundle.audios.forEach(audio => {
                    audio.loadBuffer(this.session.audioEngine);
                });
                this.loaded.push(bundle);
            }
            catch (e) {
                this.failed.push(bundle);
            }
        }
        this.loaded.forEach(loadedBundle => {
            this.found.splice(this.found.indexOf(loadedBundle), 1);
        });
        console.log("[bundlesmgr] " + this.loaded.length + " loaded, " + this.failed.length + " failed, " + this.found.length + " not loaded.");
    }
}