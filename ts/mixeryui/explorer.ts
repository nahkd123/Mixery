import { ByteStream } from "../fileformat/filestream.js";
import MixeryAudioEngine from "../mixeryaudio/engine.js";
import { AudioClip } from "../mixerycore/clips.js";
import { AudioEffect } from "../mixerycore/effect.js";
import { AudioGenerator } from "../mixerycore/generator.js";
import { MIDINoteInfo } from "../mixerycore/midi.js";
import { Session } from "../mixerycore/session.js";
import { msToBeats } from "../utils/msbeats.js";
import { UserInterface } from "./ui.js";

export class ExplorerSection {
    pane: ExplorerPane;
    name: string;
    contents: ExplorerContent[] = [];

    element: HTMLDetailsElement;

    constructor(pane: ExplorerPane, name: string) {
        this.pane = pane;
        this.name = name;
    }

    addContent(content: ExplorerContent) {
        let ele = document.createElement("div");
        ele.className = "explorerentry";
        ele.textContent = content.name;
        ele.style.setProperty("--color", content.color);
        this.element.append(ele);

        ele.addEventListener("mousedown", event => {
            if (this.pane.draggingContent) return;
            this.pane.ui.dragMode = true;
            this.pane.draggingContent = content;

            let self = this;
            function mouseUp(event: MouseEvent) {
                self.pane.ui.dragMode = false;
                self.pane.dragEnd(event);

                document.removeEventListener("mouseup", mouseUp);
                self.pane.draggingContent = undefined;
            }

            document.addEventListener("mouseup", mouseUp);
        });

        ele.addEventListener("touchstart", event => {
            if (event.touches.length === 1) {
                event.preventDefault();
                let touch = event.touches[0];
                this.pane.ui.dragMode = true;
                this.pane.draggingContent = content;

                let self = this;
                function touchMove(event: TouchEvent) {
                    if (event.touches.length === 1) touch = event.touches[0];
                }
                function touchEnd(event: TouchEvent) {
                    self.pane.ui.dragMode = false;
                    const consumer = self.pane.contentsConsumers.get(document.elementFromPoint(touch.pageX, touch.pageY));
                    console.log(consumer);
                    if (consumer !== undefined) consumer(content);

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

    addContents(contents: ExplorerContent[]) {
        contents.forEach(a => this.addContent(a));
    }
}

export abstract class ExplorerContent {
    abstract name: string;
    abstract author: string[];
    abstract color: string;
    element: HTMLDivElement;
}

export abstract class GeneratorExplorerContent extends ExplorerContent {
    color = "rgb(252, 186, 12)";
    abstract constructPlugin(stream?: ByteStream.ReadableStream): AudioGenerator;
}
export abstract class EffectExplorerContent extends ExplorerContent {
    color = "rgb(245, 54, 137)";
    abstract constructPlugin(preset?: object): AudioEffect;
}
export class GeneratorPresetExplorerContent extends ExplorerContent {
    name: string;
    author: string[]
    color = "rgb(252, 232, 100)";
    generator: GeneratorExplorerContent;
    preset: Uint8Array;

    constructor(name: string, author: string[], generator: GeneratorExplorerContent, preset: Uint8Array) {
        super();
        this.name = name;
        this.author = author;
        this.generator = generator;
        this.preset = preset;
    }

    constructPlugin() {
        return this.generator.constructPlugin(new ByteStream.ReadableStream(this.preset));
    }
}
export abstract class MIDIClipExplorerContent extends ExplorerContent {
    notes: MIDINoteInfo[] = [];
}
export class AudioClipExplorerContent extends ExplorerContent {
    name: string;
    author: string[] = [];
    color = "rgb(87, 250, 93)";
    bufferUrl: string;
    buffer: AudioBuffer;
    bufferLoaded: boolean = false;

    constructor(name: string, buffer: AudioBuffer | string) {
        super();
        this.name = name;
        if (typeof buffer === "string") {
            this.bufferUrl = buffer;
        } else {
            this.buffer = buffer;
            this.bufferLoaded = true;
        }
    }

    async loadBuffer(engine: MixeryAudioEngine) {
        let fetchInf = await fetch(this.bufferUrl);
        engine.audio.decodeAudioData(await fetchInf.arrayBuffer(), (data) => {
            this.buffer = data;
            this.bufferLoaded = true;
        }, (err) => {
            console.error(err);
        });
    }

    createClip(session: Session) {
        if (this.bufferLoaded === false) throw "Buffer is not loaded yet";
        let clip = new AudioClip(this.buffer);
        clip.name = this.name;
        clip.length = msToBeats(this.buffer.duration * 1000, session.bpm);
        return clip;
    }
}

export class ExplorerPane {
    ui: UserInterface;
    paneElement: HTMLDivElement;
    contentsHolder: HTMLDivElement;

    draggingContent: ExplorerContent;

    constructor(ui: UserInterface, paneElement: HTMLDivElement) {
        this.ui = ui;
        this.paneElement = paneElement;
        this.contentsHolder = paneElement.querySelector("div.explorercontents");
    }

    addSection(name: string) {
        let out = new ExplorerSection(this, name);

        let ele = document.createElement("details");
        let summary = document.createElement("summary");
        summary.textContent = name;
        ele.append(summary);

        this.contentsHolder.insertBefore(ele, this.contentsHolder.lastChild.previousSibling);
        out.element = ele;

        return out;
    }

    contentsConsumers: Map<Element, (content: ExplorerContent) => void> = new Map();
    dragEnd(event: MouseEvent) {
        let consumer = this.contentsConsumers.get(<Element> event.target);
        if (consumer !== undefined) consumer(this.draggingContent);
    }

    addContentConsumer(element: Element, consumer: (content: ExplorerContent) => void) {
        this.contentsConsumers.set(element, consumer);
    }
}