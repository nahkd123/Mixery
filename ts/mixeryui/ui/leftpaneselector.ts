import { Session } from "../../mixerycore/session.js";
import { LeftBarMode, UserInterface } from "../ui.js";

export class LeftPaneSelector {
    ui: UserInterface;
    session: Session;
    
    element: HTMLDivElement;

    constructor(ui: UserInterface) {
        this.ui = ui;
        this.session = ui.session;
    }

    applyUpdate() {
        let self = this;
        function addPaneSwitchButton(className: string) {
            let swButton: HTMLDivElement = self.element.querySelector("div." + className);
            swButton.addEventListener("click", () => {
                self.ui.leftBarMode = <LeftBarMode> className;
            });
        }

        addPaneSwitchButton("hide");
        addPaneSwitchButton("explorer");
        addPaneSwitchButton("resources");
        addPaneSwitchButton("settings");
    }
}