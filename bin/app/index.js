import { UserInterface } from "../mixeryui/ui.js";
import { Session } from "../mixerycore/session.js";
import { MixeryGenerators } from "./plugins.js";
import BundlesManager from "../bundles/bundlesmgr.js";
import MixeryDefaultBundle from "../bundles/mixerydefaults/bundle.js";
import { MixeryConfigurations } from "./config.js";
import MemesBundle from "../bundles/memes/bundle.js";
import { testbox } from "./dev/testbox.js";
const config = MixeryConfigurations;
let session = new Session();
session.processTopbar(document.querySelector("div.topbar"));
let ui = new UserInterface(session);
ui.element = document.querySelector("div.app");
ui.applyUpdate();
ui.canvasRenderUpdate();
document.addEventListener("resize", () => {
    ui.canvasRenderUpdate();
});
{
    session.keyboardShortcuts.push({
        name: "Play/Pause",
        code: "Space",
        action: () => {
            session.playToggle();
            ui.canvasRenderUpdate();
        }
    });
    session.keyboardShortcuts.push({
        name: "Seek Backward",
        code: "ArrowLeft",
        action: () => {
            session.seeker -= 0.125;
            if (session.seeker < 0)
                session.seeker = 0;
            ui.canvasRenderUpdate();
        }
    });
    session.keyboardShortcuts.push({
        name: "Seek Forward",
        code: "ArrowRight",
        action: () => {
            session.seeker += 0.125;
            ui.canvasRenderUpdate();
        }
    });
    session.keyboardShortcuts.push({
        name: "Scroll Backward",
        code: "Ctrl + ArrowLeft",
        action: () => {
            session.scrollFriction -= 12;
            if (session.seeker < 0)
                session.seeker = 0;
            ui.canvasRenderUpdate();
        }
    });
    session.keyboardShortcuts.push({
        name: "Scroll Forward",
        code: "Ctrl + ArrowRight",
        action: () => {
            session.scrollFriction += 12;
            ui.canvasRenderUpdate();
        }
    });
    session.keyboardShortcuts.push({
        name: "Scroll to the beginning",
        code: "Home",
        action: () => {
            session.scrolledBeats = 0;
            session.scrollFriction = 0;
            ui.canvasRenderUpdate();
        }
    });
    session.keyboardShortcuts.push({
        name: "Zoom In",
        code: "Equal",
        action: () => {
            session.pxPerBeatTo += 25;
            if (session.pxPerBeatTo > ui.playlist.timelineBar.canvas.offsetWidth - 100)
                session.pxPerBeatTo = ui.playlist.timelineBar.canvas.offsetWidth - 100;
            ui.canvasRenderUpdate();
        }
    });
    session.keyboardShortcuts.push({
        name: "Zoom Out",
        code: "Minus",
        action: () => {
            session.pxPerBeatTo -= 25;
            if (session.pxPerBeatTo < 25)
                session.pxPerBeatTo = 25;
            ui.canvasRenderUpdate();
        }
    });
}
{
    let plugins = ui.explorer.addSection("Plugins");
    plugins.addContent(new MixeryGenerators.ExampleGeneratorExplorerContent());
}
function renderLoop(timestamp) {
    ui.renderLoop();
    window.requestAnimationFrame(renderLoop);
}
window.requestAnimationFrame(renderLoop);
let bundlesManager = new BundlesManager(session, ui.explorer);
bundlesManager.add(new MixeryDefaultBundle());
bundlesManager.add(new MemesBundle());
bundlesManager.loadBundles();
if (config.exposeToGlobal) {
    const appObj = {
        session,
        bundlesManager,
        ui,
        config: MixeryConfigurations
    };
    globalThis.app = appObj;
}
if (config.emulateElectronJS && globalThis.electronjs === undefined) {
    console.warn("ElectronJS app emulation mode is currently on");
    let filesMap = new Map();
    let windowState = "windowed";
    let windowMinimized = false;
    const api = {
        _filesMap: filesMap,
        listFiles(path) {
            if (path === undefined || path === "/" || path === "")
                return Array.from(filesMap.keys());
            else
                return undefined;
        },
        readFile(path) { return filesMap.get(path); },
        close() { console.log("close()"); },
        maximize() { console.log("maximize()"); windowState = "maximized"; windowMinimized = false; },
        minimize() { console.log("minimize()"); windowMinimized = true; },
        restore() { console.log("restore()"); windowMinimized = false; },
        getWindowState() { return windowMinimized ? "minimized" : windowState; }
    };
    globalThis.electronjs = api;
    filesMap.set("exampleplugin.json", {
        dateCreate: Date.now(),
        contents: JSON.stringify({
            type: "generator",
            name: "Non-existent generator",
            configuration: {}
        })
    });
}
if (globalThis.electronjs) {
    session.electronAppEnabled();
}
if (config.showLogo) {
    console.log("%c" + config.logo.join("\n"), "color: " + config.randomLogoColor[Math.floor(config.randomLogoColor.length * Math.random())]);
}
if (MixeryConfigurations.allowTestBox && MixeryConfigurations.exposeToGlobal) {
    const startTime = Date.now();
    testbox().then(() => {
        console.log("[testbox/measure] Task finished (" + (Date.now() - startTime) + "ms)");
    });
}