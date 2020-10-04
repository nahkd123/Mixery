export interface WindowConfiguration {
    title: string;
    buttons?: {
        close?: boolean;
        minimize?: boolean;

        /**
         * When user click the close button, it will hide the div element
         */
        hideInstead?: boolean;
    };
}

export default class MoveableWindow {
    config: WindowConfiguration;
    closed: boolean;
    hidden: boolean;

    outerElement: HTMLDivElement;
    title: HTMLDivElement;
    innerElement: HTMLDivElement;

    constructor(a: string | WindowConfiguration, hideOnOpen: boolean = true) {
        if (typeof a === "string") {
            this.config = {
                title: a,
                buttons: { close: true, minimize: true }
            };
        } else this.config = a;

        this.outerElement = document.createElement("div");
        this.outerElement.className = "moveablewindow";

        this.title = document.createElement("div");
        this.title.className = "moveablewindowtitle";
        this.innerElement = document.createElement("div");
        this.innerElement.className = "moveablewindowcontainer";

        this.outerElement.append(this.title, this.innerElement);
        document.body.appendChild(this.outerElement);

        if (hideOnOpen) this.outerElement.classList.add("hidden");
    }

    show() {this.outerElement.classList.remove("hidden");}
    hide() {this.outerElement.classList.add("hidden");}
}