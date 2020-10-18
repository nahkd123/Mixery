import EnvelopeAutomation from "../../mixeryaudio/automations/envelope.js";
import { fixedSnap } from "../../utils/snapper.js";

export default class EnvelopeEditor {
    colors = {
        attack:     "#5be6ff",
        decay:      "#ffaa5b",
        sustain:    "#efefef",
        release:    "#54ff82"
    };

    envelope: EnvelopeAutomation;
    viewCanvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    // View
    padding: number = 15;
    pixelsPerSecond: number = 100;

    constructor(envelope: EnvelopeAutomation) {
        this.envelope = envelope;
        this.viewCanvas = document.createElement("canvas");
        this.ctx = this.viewCanvas.getContext("2d");
        this.initMouseEvents();
    }

    initMouseEvents() {
        let clickedNode = -1;

        this.viewCanvas.addEventListener("mousedown", event => {
            const paddedHeight = this.viewCanvas.height - this.padding * 2;
            const time = Math.max(event.offsetX - this.padding, 0.0) / this.pixelsPerSecond * 1000;
            const value = 1 - Math.min(Math.max((event.offsetY - this.padding) / paddedHeight, 0.0), 1.0);

            const timeCheck = [
                this.envelope.attackTime,
                this.envelope.decayTime,
                500,
                this.envelope.releaseTime
            ];
            
            clickedNode = 3;
            let timeChecking = 0;
            for (let i = 0; i < timeCheck.length; i++) {
                timeChecking += timeCheck[i];
                if (time <= timeChecking) {
                    clickedNode = i;
                    break;
                }
            }
        });
        this.viewCanvas.addEventListener("mousemove", event => {
            if (clickedNode !== -1) {
                const paddedHeight = this.viewCanvas.height - this.padding * 2;
                const time = Math.max(event.offsetX - this.padding, 0.0) * 1000 / this.pixelsPerSecond;
                const value = fixedSnap(1 - Math.min(Math.max((event.offsetY - this.padding) / paddedHeight, 0.0), 1.0), 0.05);

                switch (clickedNode) {
                    case 0: this.envelope.attackTime = time; break;
                    case 1: this.envelope.decayTime = Math.max(time - this.envelope.attackTime, 100); this.envelope.decayTo = value; break;
                    case 2: this.envelope.decayTo = value; break;
                    case 3: this.envelope.releaseTime = Math.max(time - this.envelope.attackTime - this.envelope.decayTime - 500, 0); break;
                }
                this.renderEnvelope();
            }
        });
        this.viewCanvas.addEventListener("mouseup", event => {
            clickedNode = -1;
        });
    }

    renderEnvelope() {
        const width = this.viewCanvas.width;
        const height = this.viewCanvas.height;
        this.ctx.clearRect(0, 0, width, height);

        const paddedHeight = height - this.padding * 2;

        const attackPw = this.envelope.attackTime * this.pixelsPerSecond / 1000;
        const decayPw = this.envelope.decayTime * this.pixelsPerSecond / 1000;
        const decayPy = this.padding + (1 - this.envelope.decayTo) * paddedHeight;
        const sustainPw = this.pixelsPerSecond / 2;
        const releasePw = this.envelope.releaseTime * this.pixelsPerSecond / 1000;

        const attackX = this.padding;
        const decayX = attackX + attackPw;
        const sustainX = decayX + decayPw;
        const releaseX = sustainX + sustainPw;

        let self = this;
        this.ctx.lineWidth = 2;
        function lineWithCircle(x1 = 0, y1 = 0, x2 = 69, y2 = 420) {
            self.ctx.beginPath();
            self.ctx.moveTo(x1, y1);
            self.ctx.lineTo(x2, y2);
            self.ctx.stroke();
            self.ctx.closePath();

            self.ctx.translate(x2, y2);
            self.ctx.beginPath();
            self.ctx.moveTo(3, 0);
            self.ctx.arc(0, 0, 3, 0, Math.PI * 2);
            self.ctx.stroke();
            self.ctx.closePath();
            self.ctx.translate(-x2, -y2);
        }
        function glassPane(x = 0, w = 0) {
            self.ctx.globalAlpha = 0.20;
            self.ctx.fillRect(x, 0, w, height);
            self.ctx.globalAlpha = 1;
        }

        this.ctx.fillStyle = this.ctx.strokeStyle = this.colors.attack;
        lineWithCircle(attackX, this.padding + paddedHeight, attackX + attackPw, this.padding);
        glassPane(0, this.padding + attackPw);
        this.ctx.fillStyle = this.ctx.strokeStyle = this.colors.decay;
        lineWithCircle(decayX, this.padding, decayX + decayPw, decayPy);
        glassPane(decayX, decayPw);
        this.ctx.fillStyle = this.ctx.strokeStyle = this.colors.sustain;
        lineWithCircle(sustainX, decayPy, sustainX + sustainPw, decayPy);
        glassPane(sustainX, sustainPw);
        this.ctx.fillStyle = this.ctx.strokeStyle = this.colors.release;
        lineWithCircle(releaseX, decayPy, releaseX + releasePw, height - this.padding);
        glassPane(releaseX, this.viewCanvas.width - releaseX);
    }
}