import { Session } from "../../mixerycore/session.js";
import { Tools } from "../../mixerycore/tools.js";
import { numberRounder } from "../../utils/numberround.js";
import { EffectExplorerContent, GeneratorExplorerContent } from "../explorer.js";
import { UserInterface } from "../ui.js";


export class PlaylistBar {
    ui: UserInterface;
    session: Session;
    element: HTMLDivElement;

    timecode: HTMLDivElement;
    tempo: HTMLDivElement;

    constructor(ui: UserInterface) {
        this.ui = ui;
        this.session = ui.session;
    }

    applyUpdate() {
        this.tempo = this.element.querySelector("div.editorbarentry.tempo div.value");
        this.timecode = this.element.querySelector("div.editorbarentry.time div.timecode");

        let mouseDown = false;
        let doubleBpm = 0;
        this.tempo.addEventListener("contextmenu", event => {
            event.preventDefault();
        });
        this.tempo.addEventListener("mousedown", event => {
            if (event.buttons === 1) {
                mouseDown = true;
                doubleBpm = this.session.bpm * 2;
                this.tempo.requestPointerLock();
            } else if (event.buttons === 2) {
                this.session.menus.windows.tools.bpmTapper.x = event.pageX + 1;
                this.session.menus.windows.tools.bpmTapper.y = event.pageY + 1;
                this.session.menus.windows.tools.bpmTapper.show();
            }
        });
        this.tempo.addEventListener("mousemove", event => {
            if (mouseDown) {
                doubleBpm += event.movementX / 10;
                if (doubleBpm < 10) doubleBpm = 10;
                this.session.bpm = Math.floor(doubleBpm) / 2;
                this.tempo.textContent = numberRounder(this.session.bpm);
            }
        });
        this.tempo.addEventListener("mouseup", event => {
            mouseDown = false;
            document.exitPointerLock();
        });

        (<HTMLDivElement> this.element.querySelector("div.editorbarentry.plugins")).addEventListener("click", event => {
            this.ui.pluginsTray = !this.ui.pluginsTray;
        });
        this.ui.explorer.addContentConsumer((<HTMLDivElement> this.element.querySelector("div.editorbarentry.plugins > div.label")), (content) => {
            if (content instanceof GeneratorExplorerContent) {
                let generator = content.constructPlugin();
                generator.beforeLoad(this.session);
                this.ui.plugins.addPlugin(generator);
                generator.window.show();
            } else if (content instanceof EffectExplorerContent) {
                let effect = content.constructPlugin();
                effect.effectLoad(this.session);
                this.ui.mixer.mixerTrackPlugins.addEffectPlugin(effect);
                effect.window.show();
            }
        });

        (<HTMLDivElement> this.element.querySelector("div.editorbarentry.clipedit")).addEventListener("click", event => {
            this.ui.clipEditorTray = !this.ui.clipEditorTray;
        });

        let toolsButtons: HTMLDivElement[] = [];
        let toolsButtonsActions: Tools[] = [];
        function unselectTools(exclude?: HTMLDivElement) {
            toolsButtons.forEach(button => {if (button !== exclude) button.classList.remove("selected");});
        }
        function addToolButton(element: HTMLDivElement, tool: Tools) {
            toolsButtons.push(element);
            toolsButtonsActions.push(tool);
        }
        addToolButton(this.element.querySelector("div.tools.nothing"), Tools.NOTHING);
        addToolButton(this.element.querySelector("div.tools.pencil"), Tools.PENCIL);
        addToolButton(this.element.querySelector("div.tools.move"), Tools.MOVE);
        toolsButtons.forEach((button, index) => {
            button.addEventListener("click", event => {
                unselectTools(button);
                button.classList.add("selected");
                this.session.playlist.selectedTool = toolsButtonsActions[index];
            });
        });

        this.element.querySelector("div.playbackbutton.play").addEventListener("click", () => {
            this.session.playToggle();
            this.ui.canvasRenderUpdate();
        });
    }
}