import { PluginPreset } from "../mixerycore/plugins.js";
import { AudioGenerator } from "../mixerycore/generator.js";
import { MIDINoteInfo } from "../mixerycore/midi.js";
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

        this.contents.push(content);
    }

    addContents(contents: ExplorerContent[]) {
        contents.forEach(a => this.addContent(a));
    }
}

export abstract class ExplorerContent {
    abstract name: string;
    abstract color: string;
    element: HTMLDivElement;
}

export abstract class GeneratorExplorerContent extends ExplorerContent {
    color = "rgb(252, 186, 12)";
    abstract constructPlugin(preset: PluginPreset): AudioGenerator;
}
export abstract class PluginPresetExplorerContent extends ExplorerContent {
    preset: PluginPreset;
}
export abstract class MIDIClipExplorerContent extends ExplorerContent {
    notes: MIDINoteInfo[] = [];
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
        console.log(name);
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