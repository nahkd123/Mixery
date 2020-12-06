export class LeftPaneSelector {
    constructor(ui) {
        this.ui = ui;
        this.session = ui.session;
    }
    applyUpdate() {
        let self = this;
        function addPaneSwitchButton(className) {
            let swButton = self.element.querySelector("div." + className);
            swButton.addEventListener("click", () => {
                self.ui.leftBarMode = className;
            });
        }
        addPaneSwitchButton("hide");
        addPaneSwitchButton("explorer");
        addPaneSwitchButton("resources");
        addPaneSwitchButton("settings");
    }
}