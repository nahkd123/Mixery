import { ByteStream } from "../fileformat/filestream.js";
import { AudioClip } from "../mixerycore/clips.js";
import { msToBeats } from "../utils/msbeats.js";
export class ExplorerSection {
    constructor(pane, name) {
        this.contents = [];
        this.pane = pane;
        this.name = name;
    }
    addContent(content) {
        let ele = document.createElement("div");
        ele.className = "explorerentry";
        ele.textContent = content.name;
        ele.style.setProperty("--color", content.color);
        this.element.append(ele);
        ele.addEventListener("contextmenu", event => { event.preventDefault(); });
        ele.addEventListener("mousedown", event => {
            if (event.buttons === 1) {
                if (this.pane.draggingContent)
                    return;
                this.pane.ui.dragMode = true;
                this.pane.draggingContent = content;
                let self = this;
                function mouseUp(event) {
                    self.pane.ui.dragMode = false;
                    self.pane.dragEnd(event);
                    document.removeEventListener("mouseup", mouseUp);
                    self.pane.draggingContent = undefined;
                }
                document.addEventListener("mouseup", mouseUp);
            }
            else if (event.buttons === 2) {
                if (content instanceof GeneratorExplorerContent || content instanceof EffectExplorerContent) {
                    let consumer = this.pane.contentsConsumers.get(this.pane.ui.playlist.editorBar.element.querySelector("div.editorbarentry.button.plugins > div.label"));
                    if (consumer !== undefined)
                        consumer(content);
                }
            }
        });
        ele.addEventListener("touchstart", event => {
            if (event.touches.length === 1) {
                event.preventDefault();
                let touch = event.touches[0];
                this.pane.ui.dragMode = true;
                this.pane.draggingContent = content;
                let self = this;
                function touchMove(event) {
                    if (event.touches.length === 1)
                        touch = event.touches[0];
                }
                function touchEnd(event) {
                    self.pane.ui.dragMode = false;
                    const consumer = self.pane.contentsConsumers.get(document.elementFromPoint(touch.pageX, touch.pageY));
                    console.log(consumer);
                    if (consumer !== undefined)
                        consumer(content);
                    document.removeEventListener("touchmove", touchMove);
                    document.removeEventListener("touchend", touchEnd);
                    self.pane.draggingContent = undefined;
                }
                document.addEventListener("touchmove", touchMove);
                document.addEventListener("touchend", touchEnd);
            }
        });
        this.contents.push(content);
    }
    addContents(contents) {
        contents.forEach(a => this.addContent(a));
    }
}
export class ExplorerContent {
}
export class GeneratorExplorerContent extends ExplorerContent {
    constructor() {
        super(...arguments);
        this.color = "rgb(252, 186, 12)";
    }
}
export class EffectExplorerContent extends ExplorerContent {
    constructor() {
        super(...arguments);
        this.color = "rgb(245, 54, 137)";
    }
}
export class GeneratorPresetExplorerContent extends ExplorerContent {
    constructor(name, author, generator, preset) {
        super();
        this.color = "rgb(252, 232, 100)";
        this.name = name;
        this.author = author;
        this.generator = generator;
        this.preset = preset;
    }
    constructPlugin() {
        return this.generator.constructPlugin(new ByteStream.ReadableStream(this.preset));
    }
}
export class MIDIClipExplorerContent extends ExplorerContent {
    constructor() {
        super(...arguments);
        this.notes = [];
    }
}
export class AudioClipExplorerContent extends ExplorerContent {
    constructor(name, buffer) {
        super();
        this.author = [];
        this.color = "rgb(87, 250, 93)";
        this.bufferLoaded = false;
        this.name = name;
        if (typeof buffer === "string") {
            this.bufferUrl = buffer;
        }
        else {
            this.buffer = buffer;
            this.bufferLoaded = true;
        }
    }
    async loadBuffer(engine) {
        let fetchInf = await fetch(this.bufferUrl);
        engine.audio.decodeAudioData(await fetchInf.arrayBuffer(), (data) => {
            this.buffer = data;
            this.bufferLoaded = true;
        }, (err) => {
            console.error(err);
        });
    }
    createClip(session) {
        if (this.bufferLoaded === false)
            throw "Buffer is not loaded yet";
        let res = session.resources.newAudioResource(this.buffer);
        res.name = this.name;
        let clip = new AudioClip(res);
        clip.name = this.name;
        clip.length = msToBeats(this.buffer.duration * 1000, session.bpm);
        return clip;
    }
}
export class ExplorerPane {
    constructor(ui, paneElement) {
        this.contentsConsumers = new Map();
        this.ui = ui;
        this.paneElement = paneElement;
        this.contentsHolder = paneElement.querySelector("div.explorercontents");
    }
    addSection(name) {
        let out = new ExplorerSection(this, name);
        let ele = document.createElement("details");
        let summary = document.createElement("summary");
        summary.textContent = name;
        ele.append(summary);
        this.contentsHolder.insertBefore(ele, this.contentsHolder.lastChild.previousSibling);
        out.element = ele;
        return out;
    }
    dragEnd(event) {
        let consumer = this.contentsConsumers.get(event.target);
        if (consumer !== undefined)
            consumer(this.draggingContent);
    }
    addContentConsumer(element, consumer) {
        this.contentsConsumers.set(element, consumer);
    }
}