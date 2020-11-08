import ContextMenu, { ContextMenuEntry } from "../../contextmenus/menu.js";
import { AutomationClip } from "../../mixerycore/clips.js";
import { numberRounder } from "../../utils/numberround.js";
import { fixedSnap } from "../../utils/snapper.js";
export default class ParamControl {
    constructor(session, name, element, param) {
        this.defaultValue = 0;
        this.style = "horizontalSlider";
        this.minValue = 0;
        this.maxValue = 1;
        this.movePx = 100;
        this.segmentSnaps = 0.05;
        this.session = session;
        this.element = element;
        this.param = param;
        this.menu = new ContextMenu();
        this.menu.entries.push(new ContextMenuEntry("Reset", () => { param.value = this.defaultValue; }), new ContextMenuEntry("Create Automation Clip", () => {
            let clip = new AutomationClip(this.param);
            clip.name = name;
            clip.automation.nodes[0].value = this.param.value;
            clip.minValue = this.minValue;
            clip.maxValue = this.maxValue;
            let availableTrack = this.session.playlist.findUnoccupiedTrack(this.session.seeker, 1);
            if (availableTrack !== undefined) {
                availableTrack.clips.push(clip);
            }
            this.session.playlist.selectedClip = clip;
            this.session.ui.canvasRenderUpdate();
        }));
        this.element.addEventListener("contextmenu", event => {
            event.preventDefault();
            this.menu.openMenu(event.pageX, event.pageY);
        });
        let oldPosition = 0;
        let movement = 0;
        this.element.addEventListener("mousedown", event => {
            if (event.buttons !== 1)
                return;
            let valueInspector = document.createElement("div");
            valueInspector.style.position = "absolute";
            valueInspector.style.left = event.pageX + "px";
            valueInspector.style.top = event.pageY + "px";
            valueInspector.style.padding = "3px 7px";
            valueInspector.style.fontSize = "12px";
            valueInspector.style.backgroundColor = "white";
            valueInspector.style.color = "black";
            valueInspector.style.boxShadow = "0 0 5px black";
            document.body.appendChild(valueInspector);
            valueInspector.textContent = numberRounder(this.controlValue, 2);
            let self = this;
            function mouseUp(event) {
                element.removeEventListener("mouseup", mouseUp);
                element.removeEventListener("mousemove", mouseMove);
                document.exitPointerLock();
                valueInspector.remove();
            }
            function mouseMove(event) {
                if (self.style === "horizontalSlider")
                    movement += event.movementX;
                else if (self.style === "verticalSlider")
                    movement += event.movementY;
                self.indicatorPosition = oldPosition + movement;
                self.controlProgress = fixedSnap(Math.min(Math.max(self.controlProgress, 0.0), 1.0), self.segmentSnaps);
                self.param.value = self.controlValue;
                valueInspector.textContent = numberRounder(self.controlValue, 2);
                self.onValueChange(self.controlValue);
            }
            oldPosition = this.indicatorPosition;
            movement = 0;
            this.element.addEventListener("mouseup", mouseUp);
            this.element.addEventListener("mousemove", mouseMove);
            this.element.requestPointerLock();
        });
    }
    get range() { return this.maxValue - this.minValue; }
    get controlProgress() { return (this.param.value - this.minValue) / this.range; }
    set controlProgress(value) {
        this.param.value = value * this.range + this.minValue;
    }
    get controlValue() { return this.minValue + this.controlProgress * this.range; }
    get indicatorPosition() { return this.controlProgress * this.movePx; }
    set indicatorPosition(value) {
        this.controlProgress = value / this.movePx;
    }
    onValueChange(val) { }
}
export class HorizontalSliderParamControl extends ParamControl {
    constructor(session, name, param, width = 100, height = 10) {
        let element = document.createElement("div");
        element.className = "paramcontrol slider horizontal";
        element.style.width = width + "px";
        element.style.height = height + "px";
        super(session, name, element, param);
        this._color = "white";
        this.movePx = width;
        this.onValueChange(0);
    }
    get color() { return this._color; }
    set color(value) {
        this._color = value;
        this.onValueChange(0);
    }
    onValueChange(val) {
        this.element.style.setProperty("--progress", this.indicatorPosition + "px");
        this.element.style.setProperty("--color", this._color);
    }
}