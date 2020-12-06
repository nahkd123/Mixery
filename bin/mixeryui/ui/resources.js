import ContextMenu, { ContextMenuEntry } from "../../contextmenus/menu.js";
import { Resources } from "../../mixerycore/resources.js";
import { upload } from "../../utils/uploader.js";
export class ResourcesPane {
    constructor(ui, paneElement) {
        this.ui = ui;
        this.paneElement = paneElement;
        this.resourcesStore.linkedPane = this;
        this.ctxMenu = new ContextMenu();
        this.ctxMenu.entries.push(new ContextMenuEntry("Add MIDI Clip", () => {
            for (let i = 0; i < this.resParentElement.children.length; i++) {
                this.resParentElement.children[i].style.boxShadow = "";
            }
            this.resourcesStore.newMIDIResource();
        }), new ContextMenuEntry("Import Audio", async () => {
            let files = await upload("audio/*");
            for (let i = 0; i < files.length; i++) {
                let file = files.item(i);
                const name = file.name;
                const origin = await file.arrayBuffer();
                const audio = await ui.session.decodeAudio(origin, name);
                let res = this.resourcesStore.newAudioResource(audio, origin);
                res.name = name;
            }
        }));
        this.resParentElement = document.createElement("div");
        this.resParentElement.style.position = "relative";
        this.resParentElement.style.width = "100%";
        this.resParentElement.style.height = "calc(100% - 72px)";
        this.resParentElement.style.overflowY = "auto";
        this.paneElement.append(this.resParentElement);
        this.resParentElement.addEventListener("contextmenu", event => {
            event.preventDefault();
            if (event.target === this.resParentElement)
                this.ctxMenu.openMenu(event.pageX + 1, event.pageY + 1);
        });
    }
    get resourcesStore() { return this.ui.session.resources; }
    addElement(res) {
        let element = new ResourceElement(this, res);
        this.resParentElement.append(element.element);
        return element;
    }
}
export class ResourceElement {
    constructor(pane, res) {
        this.ctxMenu = new ContextMenu();
        this.svgOldElementsCount = -1;
        this.pane = pane;
        this.element = document.createElement("div");
        this.linked = res;
        res.linkedElement = this;
        this.ctxMenu.entries.push(new ContextMenuEntry("Remove Resource", () => {
            this.element.remove();
            if (this.linked instanceof Resources.CompoundResource)
                return;
            let session = this.pane.ui.session;
            let tracks = session.playlist.tracks;
            for (let i = 0; i < tracks.length; i++) {
                tracks[i].removeBasedOnResource(res);
            }
            this.pane.ui.canvasRenderUpdate();
        }));
        let name = document.createElement("div");
        name.className = "resname";
        name.textContent = res._name;
        this.element.append(name);
        this.element.style.cursor = "grab";
        if (res instanceof Resources.MIDIResource) {
            this.element.className = "resentry midi";
            this.divContent = document.createElement("div");
            this.divContent.className = "content";
            this.element.append(this.divContent);
            this.updateGraphics();
        }
        else if (res instanceof Resources.AudioResource) {
            this.element.className = "resentry audio";
            this.divContent = document.createElement("div");
            this.divContent.className = "content";
            this.element.append(this.divContent);
            this.updateGraphics();
        }
        let dragMouseDown = false;
        let drag = false;
        this.element.addEventListener("mousedown", event => {
            if (event.buttons === 2) {
                event.preventDefault();
                return;
            }
            dragMouseDown = true;
            drag = false;
            let moveListener;
            let upListener;
            document.addEventListener("mousemove", moveListener = event => {
                if (dragMouseDown) {
                    if (drag === false) {
                        let dragginE = this.draggingElement = this.element.cloneNode(true);
                        document.body.append(dragginE);
                        dragginE.style.position = "absolute";
                        dragginE.style.left = event.pageX + "px";
                        dragginE.style.top = event.pageY + "px";
                        dragginE.style.opacity = "0.5";
                        dragginE.style.boxShadow = "";
                        pane.dragging = this;
                    }
                    drag = true;
                    this.draggingElement.style.left = event.pageX + "px";
                    this.draggingElement.style.top = event.pageY + "px";
                }
            });
            document.addEventListener("mouseup", upListener = event => {
                dragMouseDown = false;
                if (!drag) {
                    if (this.linked instanceof Resources.CompoundResource)
                        return;
                    if (this.pane.resourcesStore.selectedResource === this.linked) {
                        this.pane.resourcesStore.selectedResource = undefined;
                    }
                    else
                        this.pane.resourcesStore.selectedResource = this.linked;
                    for (let i = 0; i < this.pane.resParentElement.children.length; i++) {
                        this.pane.resParentElement.children[i].style.boxShadow = "";
                    }
                    this.updateGraphics();
                }
                else {
                    this.draggingElement.remove();
                }
                document.removeEventListener("mousemove", moveListener);
                document.removeEventListener("mouseup", upListener);
            });
        });
        this.element.addEventListener("contextmenu", event => {
            event.preventDefault();
            if (event.target === this.element ||
                event.target === name ||
                event.target === this.divContent)
                this.ctxMenu.openMenu(event.pageX + 1, event.pageY + 1);
        });
    }
    updateGraphics() {
        if (this.linked instanceof Resources.MIDIResource) {
            while (this.divContent.firstChild)
                this.divContent.firstChild.remove();
            const length = Math.floor(this.linked.actualLength) + 1;
            const range = this.linked.noteRange;
            const rangeSize = Math.max(range[1] - range[0] + 1, 1);
            for (let i = 0; i < this.linked.notes.length; i++) {
                let note = this.linked.notes[i];
                let element = document.createElement("div");
                element.className = "note";
                element.style.left = (100 * (note.start / length)) + "%";
                element.style.top = (100 * ((range[1] - note.note) / rangeSize)) + "%";
                element.style.width = (100 * (note.duration / length)) + "%";
                element.style.height = (100 / rangeSize) + "%";
                this.divContent.appendChild(element);
            }
        }
        if (this.pane.resourcesStore.selectedResource === this.linked) {
            if (this.linked instanceof Resources.MIDIResource)
                this.element.style.boxShadow = "0 0 5px var(--resources-midi)";
            if (this.linked instanceof Resources.AudioResource)
                this.element.style.boxShadow = "0 0 5px var(--resources-audio)";
        }
        else {
            this.element.style.boxShadow = "";
        }
    }
}