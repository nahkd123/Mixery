import ContextMenu, { ContextMenuEntry } from "../contextmenus/menu.js";

const CONFIG = {
    MIN_Y: 39
};

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
    closed: boolean = false;
    hidden: boolean;

    outerElement: HTMLDivElement;
    title: HTMLDivElement;
    innerElement: HTMLDivElement;
    menu: ContextMenu;

    get x() {return this.outerElement.offsetLeft;}
    get y() {return this.outerElement.offsetTop;}
    set x(value: number) {this.outerElement.style.left = value + "px";}
    set y(value: number) {this.outerElement.style.top = Math.max(value, CONFIG.MIN_Y) + "px";}

    get width() {return this.outerElement.offsetWidth;}
    get height() {return this.outerElement.offsetHeight;}
    set width(value: number) {this.outerElement.style.width = value + "px";}
    set height(value: number) {this.outerElement.style.height = value + "px";}

    constructor(a: string | WindowConfiguration, x = 0, y = 0, width = 100, height = 100, hideOnOpen: boolean = true) {
        if (typeof a === "string") {
            this.config = {
                title: a,
                buttons: { close: true, minimize: true, hideInstead: true }
            };
        } else this.config = a;

        this.outerElement = document.createElement("div");
        this.outerElement.className = "moveablewindow";
        this.outerElement.style.left = x + "px";
        this.outerElement.style.top = Math.max(y, CONFIG.MIN_Y) + "px";
        this.outerElement.style.width = width + "px";
        this.outerElement.style.height = height + "px";

        this.title = document.createElement("div");
        this.title.className = "moveablewindowtitle";
        this.title.textContent = this.config.title;
        this.innerElement = document.createElement("div");
        this.innerElement.className = "moveablewindowcontainer";

        this.outerElement.append(this.title, this.innerElement);
        document.body.appendChild(this.outerElement);

        if (hideOnOpen) this.hide();
        
        this.menu = new ContextMenu();
        this.menu.entries.push(new ContextMenuEntry("Close", () => {this.close()}));

        // Mouse events
        let self = this;
        this.title.addEventListener("mousedown", event => {
            function mouseMove(event: MouseEvent) {
                self.x += event.movementX;
                self.y += event.movementY;
            }
            function mouseUp(event: MouseEvent) {
                document.removeEventListener("mousemove", mouseMove);
                document.removeEventListener("mouseup", mouseUp);
            }

            document.addEventListener("mousemove", mouseMove);
            document.addEventListener("mouseup", mouseUp);
        });
        this.title.addEventListener("contextmenu", event => {
            event.preventDefault();
            this.menu.openMenu(event.pageX, event.pageY);
        });
    }

    show() {
        if (this.closed) throw "The window is already closed";
        this.outerElement.classList.remove("hidden");
        this.hidden = false;
    }
    hide() {
        if (this.closed) return;
        this.outerElement.classList.add("hidden");
        this.hidden = true;
    }
    close() {
        if (this.closed) return;
        if (this.config.buttons.hideInstead) this.hide();
        else {
            this.outerElement.remove();
            this.closed = true;
        }
    }
}