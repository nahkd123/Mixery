export namespace SVGHelper {
    export function createParentSVG() {
        let element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        return element;
    }
    export function createRect(x: number, y: number, w: number, h: number, ...elementClass: string[]) {
        let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x.toString());
        rect.setAttribute("y", y.toString());
        rect.setAttribute("width", w.toString());
        rect.setAttribute("height", h.toString());
        elementClass.forEach(c => {
            rect.classList.add(c);
        });
        return rect;
    }
    export function createGroup(...elementClass: string[]) {
        let g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        elementClass.forEach(c => {
            g.classList.add(c);
        });
        return g;
    }
}