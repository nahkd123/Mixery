import { Session } from "../../mixerycore/session.js";
import { numberRounder } from "../../utils/numberround.js";
import { fixedSnap } from "../../utils/snapper.js";

// Related to topbar menu windows thing aaaaaaaaaa
export function tbWindowsProcess(session: Session) {
    let windows = session.menus.windows;

    processExportWindow(session);
    processBPMTapper(session);
}

function processExportWindow(session: Session) {
    let window = session.menus.windows.file.export;
    window.width = 300;
    window.height = 500;
    
    let content = window.innerElement;
    content.append(session.documents.ccRecommendation.element);
}

function processBPMTapper(session: Session) {
    const BPM_TAPPING_TIMEOUT = 3000;

    let window = session.menus.windows.tools.bpmTapper;
    let recordedValues: number[] = [];
    let lastTime = 0;

    function avg(...val: number[]) {
        let out = val[0];
        for (let i = 1; i < val.length; i++) out += val[i];
        return out !== undefined? out / val.length : 0;
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
        } else {
            recordedValues.push(passedTime);
            window.innerElement.textContent = numberRounder(fixedSnap(60000 / avg(...recordedValues), 0.5), 2) + " BPM";
        }
        lastTime = Date.now();
    }

    window.innerElement.addEventListener("contextmenu", event => {
        event.preventDefault();
    });
    window.innerElement.addEventListener("mousedown", event => {
        if (event.buttons === 1) tap();
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
        if (window.hidden) return;
        if (event.code === "KeyT") tap();
    });
}