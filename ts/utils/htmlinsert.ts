export class ExternalHTMLDocument {
    element: HTMLDivElement;
    path: string;
    loaded: boolean;

    constructor(path: string, autoload = true) {
        this.path = path;
        this.element = document.createElement("div");
        this.element.className = "externalhtmldocument";

        if (autoload) this.load();
    }

    async load() {
        let fetchInfo = await fetch(this.path);
        if (!fetchInfo.ok) {
            this.element.textContent = "Unable to fetch document :(";
            throw "Unable to fetch document from " + this.path;
        }

        let data = await fetchInfo.text();
        this.element.insertAdjacentHTML("afterbegin", data);
    }
}