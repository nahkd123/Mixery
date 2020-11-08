import { Session } from "../../mixerycore/session.js";
import { msToBeats } from "../../utils/msbeats.js";
import { BeatSnapPreset, snap } from "../../utils/snapper.js";
import { UserInterface } from "../ui.js";

export class TimelineBar {
    ui: UserInterface;
    session: Session;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    constructor(ui: UserInterface) {
        this.ui = ui;
        this.session = ui.session;
    }

    applyUpdate() {
        this.canvas.addEventListener("wheel", (event) => {
            if (event.ctrlKey) {
                this.session.pxPerBeatTo -= event.deltaY;
                if (this.session.pxPerBeatTo < 25) this.session.pxPerBeatTo = 25;
                if (this.session.pxPerBeatTo > this.canvas.offsetWidth - 100) this.session.pxPerBeatTo = this.canvas.offsetWidth - 100;
                event.preventDefault();
            } else {
                this.session.scrolledPixels += event.deltaY + event.deltaX;
                if (this.session.scrolledBeats < 0) this.session.scrolledBeats = 0;
            }
            // this.render();
            this.ui.canvasRenderUpdate();
        });

        this.canvas.addEventListener("mousedown", event => {
            let self = this;
            self.session.seeker = snap(Math.max(self.session.scrolledBeats + (event.pageX - self.canvas.getBoundingClientRect().x) / self.session.pxPerBeat, 0), ...BeatSnapPreset);
            self.ui.canvasRenderUpdate();
            function mouseMove(event: MouseEvent) {
                self.session.seeker = snap(Math.max(self.session.scrolledBeats + (event.pageX - self.canvas.getBoundingClientRect().x) / self.session.pxPerBeat, 0), ...BeatSnapPreset);
                self.ui.canvasRenderUpdate();
            }
            function mouseUp(event: MouseEvent) {
                document.removeEventListener("mousemove", mouseMove);
                document.removeEventListener("mouseup", mouseUp);
            }
            document.addEventListener("mousemove", mouseMove);
            document.addEventListener("mouseup", mouseUp);
        });

        let touchTimeoutTask = -1;
        this.canvas.addEventListener("touchstart", event => {
            let self = this;
            if (event.touches.length === 1) {
                // Change seeker
                const oldX = event.touches[0].pageX;
                const oldSeeker = self.session.seeker;
                function touchMove(event: TouchEvent) {
                    // self.session.seeker = Math.max(oldSeeker + (event.touches[0].pageX - oldX) / self.session.pxPerBeat, 0);
                    self.session.seeker = snap(Math.max(self.session.scrolledBeats + (event.touches[0].pageX - self.canvas.getBoundingClientRect().x) / self.session.pxPerBeat, 0), ...BeatSnapPreset);
                    self.ui.canvasRenderUpdate();
                }
                function touchEnd(event: TouchEvent) {
                    document.removeEventListener("touchend", touchEnd);
                    document.removeEventListener("touchmove", touchMove);
                }
                touchTimeoutTask = <unknown> setTimeout(() => {
                    document.addEventListener("touchend", touchEnd);
                    document.addEventListener("touchmove", touchMove);
                }, 20) as number;
            } else if (event.touches.length === 2) {
                // Scroll
                let oldX = event.touches[0].pageX;
                let deltaLastMove = 0;
                if (touchTimeoutTask !== -1) {
                    clearTimeout(touchTimeoutTask);
                    touchTimeoutTask = -1;
                }
                function touchMove(event: TouchEvent) {
                    self.session.scrolledPixels -= (deltaLastMove = event.touches[0].pageX - oldX);
                    if (self.session.scrolledPixels < 0) self.session.scrolledPixels = 0;
                    oldX = event.touches[0].pageX;
                    if (self.session.playing) self.session.stopAndThenPlay();
                    self.ui.canvasRenderUpdate();
                }
                function touchEnd(event: TouchEvent) {
                    self.session.scrollFriction = - deltaLastMove * 2;
                    document.removeEventListener("touchend", touchEnd);
                    document.removeEventListener("touchmove", touchMove);
                }
                document.addEventListener("touchend", touchEnd);
                document.addEventListener("touchmove", touchMove);
            };
        });
    }

    render() {
        // Canvas Render
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const visibleBeats = Math.floor(this.canvas.width / this.session.pxPerBeat) + 2;
        const scrolledBeats = Math.ceil(this.session.scrolledBeats);
        const drawStart = this.session.pxPerBeat - (Math.floor(this.session.scrolledBeats * this.session.pxPerBeat) % this.session.pxPerBeat || this.session.pxPerBeat);

        this.ctx.strokeStyle = "white";
        this.ctx.fillStyle = "white";
        this.ctx.beginPath();
        for (let i = 0; i < visibleBeats; i++) {
            this.ctx.moveTo(drawStart + i * this.session.pxPerBeat, 29);
            this.ctx.lineTo(drawStart + i * this.session.pxPerBeat, 39);
        }
        this.ctx.stroke();
        this.ctx.closePath();
        
        this.ctx.font = "14px 'Nunito Sans', 'Noto Sans', 'Ubuntu', Calibri, sans-serif";
        /*for (let i = 0; i < visibleBeats; i++) {
            const text = (scrolledBeats + i + 1) + "";
            const charWidth = this.ctx.measureText(text).width;
            this.ctx.globalAlpha = ((scrolledBeats + i) % 4) === 0? 1 : Math.min((this.session.pxPerBeat - 50) / 50, 1.0);
            if (this.session.pxPerBeat >= 50 || ((scrolledBeats + i) % 4) === 0) this.ctx.fillText(text, drawStart + i * this.session.pxPerBeat - charWidth / 2, 23);
        }*/
        const textDrawStart = Math.floor(this.session.scrolledBeats);
        for (let i = textDrawStart; i < Math.ceil(this.session.scrolledBeats + visibleBeats); i++) {
            const text = (i + 1) + "";
            const charWidth = this.ctx.measureText(text).width;
            this.ctx.globalAlpha = (i % 4) === 0? 1 : Math.min((this.session.pxPerBeat - 50) / 50, 1.0);
            if (this.session.pxPerBeat >= 50 || (i % 4) === 0)
                this.ctx.fillText(
                    text,
                    (i - textDrawStart) * this.session.pxPerBeat - charWidth / 2 - 1 - (Math.floor(this.session.scrolledBeats * this.session.pxPerBeat) % (this.session.pxPerBeat)),
                    23
                );
        }
        this.ctx.globalAlpha = 1.0;

        function drawSeekerShape(ctx: CanvasRenderingContext2D, seekPx: number) {
            ctx.beginPath();
            ctx.moveTo(seekPx - 5, 0);
            ctx.lineTo(seekPx + 5, 0);
            ctx.lineTo(seekPx + 5, 10);
            ctx.lineTo(seekPx, 15);
            ctx.lineTo(seekPx - 5, 10);
            ctx.fill();
            ctx.closePath();
        }

        const seekPx = this.session.seeker * this.session.pxPerBeat - this.session.scrolledPixels;
        this.ctx.fillStyle = "rgb(86, 227, 198)";
        drawSeekerShape(this.ctx, seekPx);

        if (this.session.playing) {
            const seekPxPlaying = seekPx + msToBeats(this.session.playedLength, this.session.bpm) * this.session.pxPerBeat;
            this.ctx.fillStyle = "rgb(252, 186, 3)";
            drawSeekerShape(this.ctx, seekPxPlaying);
        }
    }
}