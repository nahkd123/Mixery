import ContextMenu, { ContextMenuEntry } from "../../contextmenus/menu.js";
import RenderableAudioParam from "../../mixeryaudio/automations/param.js";
import { AutomationClip } from "../../mixerycore/clips.js";
import { Session } from "../../mixerycore/session.js";
import { numberRounder } from "../../utils/numberround.js";
import { fixedSnap } from "../../utils/snapper.js";

export type ParamControlStyle = "verticalSlider" | "horizontalSlider" | "knob";

export default class ParamControl {
    session: Session;
    name: string;
    element: HTMLDivElement;
    param: RenderableAudioParam;
    defaultValue: number = 0;

    menu: ContextMenu;

    // Component Behavior
    style: ParamControlStyle = "horizontalSlider";
    minValue: number = 0;
    maxValue: number = 1;
    movePx: number = 100;
    get range() {return this.maxValue - this.minValue;}
    segmentSnaps: number = 0.05;

    get controlProgress() {return (this.param.value - this.minValue) / this.range;}
    set controlProgress(value: number) {
        // x = (this.param.value - this.minValue) / this.range
        // x * this.range = this.param.value - this.minValue
        // x * this.range + this.minValue = this.param.value
        this.param.value = value * this.range + this.minValue;
    }

    get controlValue() {return this.minValue + this.controlProgress * this.range;}

    get indicatorPosition() {return this.controlProgress * this.movePx;}
    set indicatorPosition(value: number) {
        this.controlProgress = value / this.movePx;
    }

    constructor(session: Session, name: string, element: HTMLDivElement, param: RenderableAudioParam) {
        this.session = session;
        this.element = element;
        this.param = param;

        this.menu = new ContextMenu();
        this.menu.entries.push(
            new ContextMenuEntry("Reset", () => {param.value = this.defaultValue;}),
            new ContextMenuEntry("Create Automation Clip", () => {
                let clip = new AutomationClip(this.param);
                clip.name = name;

                let availableTrack = this.session.playlist.findUnoccupiedTrack(this.session.seeker, 1);
                if (availableTrack !== undefined) {
                    availableTrack.clips.push(clip);
                }
                this.session.playlist.selectedClip = clip;
                this.session.ui.canvasRenderUpdate();
            })
        );

        this.element.addEventListener("contextmenu", event => {
            event.preventDefault();
            this.menu.openMenu(event.pageX, event.pageY);
        });

        let oldPosition = 0;
        let movement = 0;
        this.element.addEventListener("mousedown", event => {
            if (event.buttons !== 1) return;
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
            function mouseUp(event: MouseEvent) {
                element.removeEventListener("mouseup", mouseUp);
                element.removeEventListener("mousemove", mouseMove);
                document.exitPointerLock();
                valueInspector.remove();
            }
            function mouseMove(event: MouseEvent) {
                if (self.style === "horizontalSlider") movement += event.movementX;
                else if (self.style === "verticalSlider") movement += event.movementY;
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

    onValueChange(val: number) {}
}

export class HorizontalSliderParamControl extends ParamControl {
    private _color: string;
    get color() {return this._color;}
    set color(value: string) {
        this._color = value;
        this.onValueChange(0);
    }

    constructor(session: Session, name: string, param: RenderableAudioParam, width = 100, height = 10) {
        let element = document.createElement("div");
        element.className = "paramcontrol slider horizontal";
        element.style.width = width + "px";
        element.style.height = height + "px";
        
        super(session, name, element, param);
        this._color = "white";
        this.movePx = width;
        this.onValueChange(0);
    }

    onValueChange(val: number) {
        this.element.style.setProperty("--progress", this.indicatorPosition + "px");
        this.element.style.setProperty("--color", this._color);
    }
}