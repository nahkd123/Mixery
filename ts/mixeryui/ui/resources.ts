import { UserInterface } from "../ui.js";

export class ResourcesPane {
    ui: UserInterface;
    paneElement: HTMLDivElement;
    parent: ResourceElement;

    get resourcesStore() {return this.ui.session.resources;}

    constructor(ui: UserInterface, paneElement: HTMLDivElement) {
        this.ui = ui;
        this.paneElement = paneElement;
        this.resourcesStore.linkedPane = this;

        let resParentElement = document.createElement("div");
        this.paneElement.append(resParentElement);
    }
}

export class ResourceElement {
    element: HTMLDivElement;

    constructor(element: HTMLDivElement) {
        this.element = element;
    }
}