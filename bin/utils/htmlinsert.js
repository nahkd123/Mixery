var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class ExternalHTMLDocument {
    constructor(path, autoload = true) {
        this.path = path;
        this.element = document.createElement("div");
        this.element.className = "externalhtmldocument";
        if (autoload)
            this.load();
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            let fetchInfo = yield fetch(this.path);
            if (!fetchInfo.ok) {
                this.element.textContent = "Unable to fetch document :(";
                throw "Unable to fetch document from " + this.path;
            }
            let data = yield fetchInfo.text();
            this.element.insertAdjacentHTML("afterbegin", data);
        });
    }
}