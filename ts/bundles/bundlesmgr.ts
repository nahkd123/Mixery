import { Session } from "../mixerycore/session.js";
import { ExplorerPane, ExplorerSection } from "../mixeryui/explorer.js";
import Bundle from "./bundle.js";

export default class BunglesManager {
    session: Session;
    explorer: ExplorerPane;

    found: Bundle[] = [];
    loaded: Bundle[] = [];
    failed: Bundle[] = [];

    constructor(session: Session, explorer: ExplorerPane) {
        this.session = session;
        this.explorer = explorer;
    }

    add(bundle: Bundle) {
        this.found.push(bundle);
    }

    loadBundles() {
        if (this.found.length === 0) return;
        if (this.failed.length > 0) this.failed = [];

        console.log("[bundlesmgr] Found " + this.found.length + " bundles.");
        this.found.forEach(bundle => {
            console.log("[bundlesmgr] Loading " + bundle.name + " by " + bundle.author + "...");
            try {
                // Insert load thing in here
                let explorerSection = this.explorer.addSection(bundle.name);
                explorerSection.addContents(bundle.generators);

                this.loaded.push(bundle);
                this.found.splice(this.found.indexOf(bundle), 1);
            } catch (e) {
                this.failed.push(bundle);
            }
        });

        console.log("[bundlesmgr] " + this.loaded.length + " loaded, " + this.failed.length + " failed.");
    }
}