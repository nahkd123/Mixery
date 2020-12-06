export var SVGHelper;
(function (SVGHelper) {
    function createParentSVG() {
        let element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        return element;
    }
    SVGHelper.createParentSVG = createParentSVG;
    function createRect(x, y, w, h, ...elementClass) {
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
    SVGHelper.createRect = createRect;
    function createGroup(...elementClass) {
        let g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        elementClass.forEach(c => {
            g.classList.add(c);
        });
        return g;
    }
    SVGHelper.createGroup = createGroup;
})(SVGHelper || (SVGHelper = {}));