import { Session } from "../../mixerycore/session.js";

// Related to topbar menu windows thing aaaaaaaaaa
export function tbWindowsProcess(session: Session) {
    let windows = session.menus.windows;

    processExportWindow(session);
}

function processExportWindow(session: Session) {
    let window = session.menus.windows.file.export;
    window.width = 300;
    window.height = 500;
    
    let content = window.innerElement;
    content.append(session.documents.ccRecommendation.element);
}