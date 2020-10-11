import { AudioEffect } from "../../../mixerycore/effect.js";
import { Session } from "../../../mixerycore/session.js";
import { EffectExplorerContent } from "../../../mixeryui/explorer.js";
import { updateCanvasSize } from "../../../mixeryui/ui.js";

export default class EQExplorerContent extends EffectExplorerContent {
    name = "EQ";

    constructPlugin(preset: object) {
        return new EQ();
    }
}

export class EQ extends AudioEffect {
    name = "EQ";
    author = ["nahkd123"];

    effectLoad(session: Session) {
        this.input = session.audioEngine.createGain();
        this.output = session.audioEngine.createGain();

        this.input.connect(this.output);
        this.initWindow(session);
    }

    analyserCanvas: HTMLCanvasElement;
    analyserCtx: CanvasRenderingContext2D;
    initWindow(session: Session) {
        let window = this.window;
        window.width = 500;
        window.height = 300;

        window.innerElement.addEventListener("click", event => {
            this.input.disconnect();
            console.warn("broke audio line!");
        });

        this.analyserCanvas = document.createElement("canvas");
        this.analyserCanvas.style.width = "100%";
        this.analyserCanvas.style.height = "100%";
        window.innerElement.append(this.analyserCanvas);
        updateCanvasSize(this.analyserCanvas);

        this.analyserCtx = this.analyserCanvas.getContext("2d");
        let self = this;

        let analyser = session.audioEngine.audio.createAnalyser();
        this.input.audioNode.connect(analyser);
        analyser.fftSize = 512;
        let data = new Uint8Array(analyser.fftSize / 2);
        function render() {
            if (!window.hidden) {
                analyser.getByteFrequencyData(data);

                let ctx = self.analyserCtx;
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

                const barWidth = ctx.canvas.width / data.length;

                for (let i = 0; i < data.length; i++) {
                    const prog = data[i] / 256;
                    ctx.fillStyle = `rgb(0, 0, 0, ${prog})`;
                    ctx.fillRect(i * barWidth, ctx.canvas.height - (prog * ctx.canvas.height), barWidth, prog * ctx.canvas.height);
                    // ctx.fillRect(i * barWidth, ctx.canvas.height - 5, barWidth, 5);
                }
            }
            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
    }
}