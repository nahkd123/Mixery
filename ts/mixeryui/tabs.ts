export default class TabsContainer {
    parent: HTMLDivElement;
    tabsButtonsContainer: HTMLDivElement;
    tabs: Map<string, HTMLDivElement> = new Map();

    constructor(parent: HTMLDivElement) {
        this.parent = parent;
        this.tabsButtonsContainer = document.createElement("div");
        this.tabsButtonsContainer.className = "tabs buttonscontainer";

        this.parent.append(this.tabsButtonsContainer);
    }
    hideAll() {
        Array.from(this.tabs.values()).forEach(tabView => {
            tabView.classList.add("hidden");
        });
    }
    addTab(name: string, select = true) {
        if (select) this.hideAll();

        let element = document.createElement("div");
        element.className = "tabs content " + (select? "" : "hidden");
        this.tabs.set(name, element);
        this.parent.appendChild(element);

        let tabButton = document.createElement("div");
        tabButton.className = "tabs button";
        tabButton.textContent = name;
        this.tabsButtonsContainer.appendChild(tabButton);
        tabButton.addEventListener("click", event => {
            this.hideAll();
            element.classList.remove("hidden");
        });
        return element;
    }
}