var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import ContextMenu, { ContextMenuEntry } from "../../contextmenus/menu.js";
import { AudioSampleRates } from "../../mixeryaudio/samplerates.js";
import download from "../../utils/downloader.js";
import { numberRounder } from "../../utils/numberround.js";
import { fixedSnap } from "../../utils/snapper.js";
export function tbWindowsProcess(session) {
    let windows = session.menus.windows;
    processExportWindow(session);
    processBPMTapper(session);
}
function processExportWindow(session) {
    let window = session.menus.windows.file.export;
    window.width = 300;
    window.height = 400;
    let content = window.innerElement;
    function appendLabel(text) {
        let label = document.createElement("div");
        label.textContent = text;
        label.style.padding = "5px 12px";
        content.appendChild(label);
        return label;
    }
    function appendButton(text, listener) {
        let button = document.createElement("div");
        button.textContent = text;
        button.style.padding = "5px 12px";
        button.style.margin = "5px 12px";
        button.style.width = "248px";
        button.style.border = "2px solid rgb(206, 206, 206)";
        button.style.borderRadius = "3px";
        content.appendChild(button);
        if (listener)
            button.addEventListener("click", listener);
        return button;
    }
    function appendTextbox(val) {
        let textbox = document.createElement("input");
        textbox.type = "text";
        textbox.value = val;
        textbox.style.padding = "5px 12px";
        textbox.style.margin = "5px 12px";
        textbox.style.width = "248px";
        textbox.style.border = "2px solid rgb(206, 206, 206)";
        textbox.style.borderRadius = "3px";
        content.appendChild(textbox);
        return textbox;
    }
    appendLabel("File Name");
    let fileName = appendTextbox("audio." + session.encoders.selectedEncoder.fileExt);
    appendLabel("Channels Count");
    let channelsCount = appendTextbox("2");
    appendLabel("Audio Encoder");
    let encodersMenu = new ContextMenu();
    session.encoders.encoders.forEach(encoder => {
        encodersMenu.entries.push(new ContextMenuEntry(encoder.name, () => {
            encoderButton.textContent = encoder.name;
            session.encoders.selectedEncoder = encoder;
            let a = fileName.value.split(".");
            a.pop();
            fileName.value = a.join(".") + "." + encoder.fileExt;
        }));
    });
    let encoderButton = appendButton(session.encoders.selectedEncoder.name, event => {
        encodersMenu.openMenu(event.pageX, event.pageY);
    });
    let encodeButton = appendButton("Encode and Export", event => {
        console.log("[main] Reseting session...");
        session.stop();
        let oldSeeker = session.seeker;
        let realTimeRendering = session.settings.performance.realTimeRendering;
        session.seeker = 0;
        session.settings.performance.realTimeRendering = false;
        console.log("[main] Preparing renderer...");
        session.audioEngine.prepareRenderer(AudioSampleRates.COMMON * 10, parseInt(channelsCount.value));
        console.log("[main] Rendering...");
        session.play(true);
        session.audioEngine.startRender().then((audioBuffer) => __awaiter(this, void 0, void 0, function* () {
            console.log("[main] Encoding...");
            let arrayBuffer = yield session.encoders.encodeAudio(audioBuffer);
            console.log("[main] Converting to blob...");
            let blob = new Blob([arrayBuffer]);
            download(blob, fileName.value);
            console.log(audioBuffer);
            console.log("[main] Reverting old session state...");
            session.stop();
            session.seeker = oldSeeker;
            session.settings.performance.realTimeRendering = realTimeRendering;
            console.log("[main] Clearing renderer...");
        }));
    });
    encodeButton.style.backgroundColor = "rgb(86, 227, 198)";
    encodeButton.style.color = "white";
    content.append(session.documents.ccRecommendation.element);
}
function processBPMTapper(session) {
    const BPM_TAPPING_TIMEOUT = 3000;
    let window = session.menus.windows.tools.bpmTapper;
    let recordedValues = [];
    let lastTime = 0;
    function avg(...val) {
        let out = val[0];
        for (let i = 1; i < val.length; i++)
            out += val[i];
        return out !== undefined ? out / val.length : 0;
    }
    window.innerElement.textContent = "Click/Press T to tap. Right click to set to displayed BPM";
    window.innerElement.style.textAlign = "center";
    window.innerElement.style.padding = "15px";
    window.innerElement.style.width = "calc(100% - 30px)";
    window.innerElement.style.height = "calc(100% - 59px)";
    function tap() {
        const passedTime = Date.now() - lastTime;
        if (passedTime >= BPM_TAPPING_TIMEOUT) {
            recordedValues = [];
            window.innerElement.textContent = "Click/Press T to continue";
        }
        else {
            recordedValues.push(passedTime);
            window.innerElement.textContent = numberRounder(fixedSnap(60000 / avg(...recordedValues), 0.5), 2) + " BPM";
        }
        lastTime = Date.now();
    }
    window.innerElement.addEventListener("contextmenu", event => {
        event.preventDefault();
    });
    window.innerElement.addEventListener("mousedown", event => {
        if (event.buttons === 1)
            tap();
        else if (event.buttons === 2) {
            if (recordedValues.length < 2) {
                window.innerElement.textContent = "Please tap at least 2 times";
                recordedValues = [];
                return;
            }
            session.bpm = fixedSnap(60000 / avg(...recordedValues), 0.5);
            session.ui.playlist.editorBar.tempo.textContent = numberRounder(fixedSnap(60000 / avg(...recordedValues), 0.5), 2) + "";
            window.innerElement.textContent = "BPM Changed";
            recordedValues = [];
        }
    });
    document.addEventListener("keydown", event => {
        if (window.hidden)
            return;
        if (event.code === "KeyT")
            tap();
    });
}