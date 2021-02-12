import MoveableWindow from "../../windows/window.js";
export default class MixeryLiveWindowView extends MoveableWindow {
    constructor(session) {
        super("Mixery Live");
        this.session = session;
        this.width = 500;
        this.height = 300;
        this.init();
    }
    init() { }
}