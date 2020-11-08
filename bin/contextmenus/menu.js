let currentMenu = undefined;
export class ContextMenuEntry {
    constructor(name, onclick = () => { }) {
        this.closeMenuOnClick = true;
        this.name = name;
        this.onclick = onclick;
    }
    createElement(menuElement) {
        let out = document.createElement("div");
        out.className = "ctxbutton";
        if (this.extendMenu)
            out.classList.add("extendable");
        out.textContent = this.name;
        out.addEventListener("click", (event) => {
            if (this.closeMenuOnClick && menuElement) {
                menuElement.remove();
                currentMenu = undefined;
            }
            this.onclick(event);
        });
        return out;
    }
}
export default class ContextMenu {
    constructor() {
        this.entries = [];
    }
    openMenu(x = 0, y = 0) {
        if (currentMenu) {
            let temp = currentMenu;
            currentMenu.close();
            if (temp.linkedMenu === this)
                return;
        }
        let menu = document.createElement("div");
        menu.className = "contextmenu";
        menu.style.top = y + "px";
        menu.style.left = x + "px";
        this.entries.forEach(entry => {
            menu.append(entry.createElement(menu));
        });
        document.body.appendChild(menu);
        return currentMenu = {
            element: menu,
            close() {
                menu.remove();
                currentMenu = undefined;
            },
            linkedMenu: this
        };
    }
}