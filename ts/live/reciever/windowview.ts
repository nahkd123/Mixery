import { Session } from "../../mixerycore/session.js";
import MoveableWindow from "../../windows/window.js";

export default class MixeryLiveWindowView extends MoveableWindow {
    constructor(public session: Session) {
        super("Mixery Live");
        this.width = 500;
        this.height = 300;
        this.init();
    }

    init() {}
}