import ContextMenu, { ContextMenuEntry } from "../../contextmenus/menu.js";
import { numberRounder } from "../../utils/numberround.js";
import { fixedSnap, fixedSnapCeil } from "../../utils/snapper.js";
import MoveableWindow from "../../windows/window.js";
import { updateCanvasSize } from "../ui.js";
import { AutomationsUIUtils } from "./utils.js";
export default class AudioAutomator {
    constructor(ui, automation, name = "Unnamed Automation") {
        this.min = 0;
        this.max = 1;
        this.snap = 0.05;
        this.startValue = 1;
        this.clickRadius = 3;
        this.minPPS = 25;
        this.maxPPS = 500;
        this.pxPerSecond = 100;
        this.scrolledSecond = 0;
        this.displayMultiply = 1.0;
        this.displayUnit = " unit";
        this.lastNodeType = "instant";
        this.nodeSelectMenu = new ContextMenu();
        let i = 1;
        function debug() {
            console.log("pass " + i++);
        }
        this.ui = ui;
        this.window = new MoveableWindow({
            title: name + " - Automation",
            buttons: {
                hideInstead: true
            }
        }, 0, 0, 500, 300, true);
        this.automation = automation;
        this.canvas = document.createElement("canvas");
        this.canvas.width = 500;
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.window.innerElement.append(this.canvas);
        this.ctx = this.canvas.getContext("2d", { alpha: false });
        updateCanvasSize(this.canvas, () => {
            this.renderAutomation();
        });
        this.renderAutomation();
        let mouseDown = false;
        let clickedNode;
        this.canvas.addEventListener("mousedown", event => {
            if (event.buttons === 4) {
                event.preventDefault();
                this.nodeSelectMenu.openMenu(event.pageX, event.pageY);
                return;
            }
            mouseDown = true;
            clickedNode = undefined;
            const range = this.max - this.min;
            this.automation.nodes.forEach(node => {
                if (clickedNode !== undefined)
                    return;
                const pointX = (this.scrolledSecond + node.time) * this.pxPerSecond;
                const pointY = ((this.max - node.value) / range) * this.canvas.height;
                if (event.offsetX >= pointX - this.clickRadius && event.offsetX <= pointX + this.clickRadius) {
                    clickedNode = node;
                    if (event.buttons === 2) {
                        mouseDown = false;
                        automation.nodes.splice(automation.nodes.indexOf(clickedNode), 1);
                        automation.rearrange();
                        this.renderAutomation();
                    }
                    return;
                }
            });
            if (clickedNode === undefined) {
                const clickedTime = event.offsetX / this.pxPerSecond;
                const clickedValue = (this.max - event.offsetY / this.canvas.height) / (this.max - this.min);
                clickedNode = automation.addNode(this.lastNodeType, clickedTime, clickedValue);
            }
        });
        this.canvas.addEventListener("mousemove", event => {
            if (mouseDown) {
                if (mouseDown) {
                    const rawTime = event.offsetX / this.pxPerSecond;
                    const rawValue = (this.max - this.min) * (1 - event.offsetY / this.canvas.height) + this.min;
                    clickedNode.time = event.shiftKey ? rawTime : event.ctrlKey ? fixedSnapCeil(rawTime, 0.05) : fixedSnap(rawTime, 0.05);
                    clickedNode.value = event.shiftKey ? rawValue : event.ctrlKey ? fixedSnapCeil(rawValue, this.snap) : fixedSnap(rawValue, this.snap);
                    this.renderAutomation();
                    let ctx = this.ctx;
                    ctx.fillStyle = "white";
                    ctx.font = "14px 'Nunito Sans', 'Noto Sans', 'Ubuntu', Calibri, sans-serif";
                    ctx.fillText(numberRounder(clickedNode.time, 2) + "s", event.offsetX, event.offsetY);
                    ctx.fillText(numberRounder(clickedNode.value * this.displayMultiply, 2) + this.displayUnit, event.offsetX, event.offsetY + 18);
                }
            }
        });
        this.canvas.addEventListener("mouseup", event => {
            mouseDown = false;
            automation.rearrange();
            this.renderAutomation();
        });
        this.canvas.addEventListener("contextmenu", event => event.preventDefault());
        this.canvas.addEventListener("wheel", event => {
            let unitsPerScreen = this.canvas.width / this.pxPerSecond;
            unitsPerScreen += event.deltaY / 100;
            if (unitsPerScreen > 10)
                unitsPerScreen = 10;
            else if (unitsPerScreen < 1)
                unitsPerScreen = 1;
            this.pxPerSecond = this.canvas.width / unitsPerScreen;
            this.renderAutomation();
        });
        this.nodeSelectMenu.entries.push(new ContextMenuEntry("Instant", () => { this.lastNodeType = "instant"; }));
        this.nodeSelectMenu.entries.push(new ContextMenuEntry("Linear Ramp", () => { this.lastNodeType = "linearRamp"; }));
        this.nodeSelectMenu.entries.push(new ContextMenuEntry("Exponential Ramp", () => { this.lastNodeType = "exponentialRamp"; }));
    }
    renderAutomation(color = "rgb(86, 227, 198)") {
        let ctx = this.ctx;
        const halfHeight = this.canvas.height / 2;
        const range = this.max - this.min;
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = "#ffffff";
        AutomationsUIUtils.drawGrid(ctx, 0, this.canvas.width, this.pxPerSecond);
        ctx.globalAlpha = 1;
        let lastPointY = 0;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        this.automation.nodes.forEach(node => {
            const pointX = (this.scrolledSecond + node.time) * this.pxPerSecond;
            const pointY = lastPointY = ((this.max - node.value) / range) * this.canvas.height;
            ctx.translate(pointX, pointY);
            ctx.beginPath();
            ctx.moveTo(0 + 3, 0);
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.closePath();
            ctx.translate(-pointX, -pointY);
        });
        let lastNode = undefined;
        lastPointY = ((this.max - this.startValue) / (this.max - this.min)) * ctx.canvas.height;
        ctx.beginPath();
        ctx.moveTo(0, lastPointY);
        this.automation.nodes.forEach(node => {
            const pointX = (this.scrolledSecond + node.time) * this.pxPerSecond;
            const pointY = ((this.max - node.value) / range) * this.canvas.height;
            if (node.type === "instant") {
                ctx.lineTo(pointX, lastPointY);
                ctx.lineTo(pointX, pointY);
            }
            else if (node.type === "linearRamp") {
                ctx.lineTo(pointX, pointY);
            }
            lastNode = node;
            lastPointY = pointY;
        });
        ctx.stroke();
        ctx.closePath();
    }
}