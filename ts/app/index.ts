import { UserInterface } from "../mixeryui/ui.js";
import { Session } from "../mixerycore/session.js";
import { ExampleGenerator } from "../mixerycore/generator.js";
import { notesIndex } from "../mixerycore/notes.js";
import { MixeryGenerators } from "./plugins.js";

// Setting up session
let session = new Session();
session.processTopbar(document.querySelector("div.topbar"));

// Setting up UI
let ui = new UserInterface(session);
ui.element = document.querySelector("div.app");
ui.applyUpdate();
ui.canvasRenderUpdate();

document.addEventListener("resize", () => {
    ui.canvasRenderUpdate();
});

// Setting up keyboard shortcuts
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
            if (session.seeker < 0) session.seeker = 0;
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
            if (session.seeker < 0) session.seeker = 0;
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
            if (session.pxPerBeatTo > ui.playlist.timelineBar.canvas.offsetWidth - 100) session.pxPerBeatTo = ui.playlist.timelineBar.canvas.offsetWidth - 100;
            ui.canvasRenderUpdate();
        }
    });
    session.keyboardShortcuts.push({
        name: "Zoom Out",
        code: "Minus",
        action: () => {
            session.pxPerBeatTo -= 25;
            if (session.pxPerBeatTo < 25) session.pxPerBeatTo = 25;
            ui.canvasRenderUpdate();
        }
    });
}

// Setting up explorer contents
{
    let plugins = ui.explorer.addSection("Plugins");
    plugins.addContent(new MixeryGenerators.ExampleGeneratorExplorerContent());
}

function renderLoop(timestamp: number) {
    ui.renderLoop();
    window.requestAnimationFrame(renderLoop);
}
window.requestAnimationFrame(renderLoop);

const capTimestamp = Date.now();
const maxTimeout = 7000;
globalThis.toggleElectronJS = function toggleElectronJS() {
    if (Date.now() < capTimestamp + maxTimeout) {
        session.electronAppEnabled();
    } else console.warn("Unable to toggle Mixery Electron features");
};