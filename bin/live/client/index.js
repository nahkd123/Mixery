class EventEmitter {
    constructor(options) {
        this.options = options;
        this.listeners = new Map();
    }
    on(event, listener) {
        if (!this.listeners.has(event))
            this.listeners.set(event, []);
        this.listeners.get(event).push(listener);
    }
    emit(event, ...args) {
        if (!this.listeners.has(event))
            return;
        this.listeners.get(event).forEach(listener => {
            listener(...args);
        });
    }
}
export class MixeryLive extends EventEmitter {
    constructor(host, port = 8080, options) {
        super();
        this.host = host;
        this.port = port;
        this.authorized = false;
        this.initPacketsListener();
        this.ws = new WebSocket((options.useWSS ? "wss" : "ws") + "://" + host + ":" + port + "/live/ws", ["live"]);
        console.log("[live/ws] Connection established (" + host + ":" + port + ")");
        this.ws.addEventListener("open", (event) => {
            console.log("[live/ws] " + host + " opened. Attempting to authorize...");
            this.login(options.username || "USER", options.password || "PASSWORD_HERE");
        });
        this.ws.addEventListener("message", (event) => {
            if (typeof event.data === "string") {
                let pk = JSON.parse(event.data);
                this.emit("packet", pk);
            }
            else if (event.data instanceof Blob) {
            }
        });
    }
    isSameConnection(host, port) {
        return this.host === host && this.port === port;
    }
    initPacketsListener() {
        this.on("packet", (pk) => {
            if (pk.type === "changestate") {
                if (pk.state === "auth.loginfail")
                    this.emit("login", false);
                if (pk.state === "auth.login")
                    this.emit("login", true);
            }
        });
        this.on("login", (success) => {
            this.authorized = success;
            if (this.authorized)
                console.log("[live/ws] Authorize successfully.");
            else
                console.log("[live/ws] Authorize failed. Please check your login credential");
        });
    }
    sendPacket(packet) { this.ws.send(JSON.stringify(packet)); }
    login(username, password) {
        if (this.authorized)
            return;
        this.sendPacket({
            type: "auth",
            username, password
        });
    }
    changeState(state) {
        if (!this.authorized)
            throw new Error("Cannot change state: Not authorized");
        this.sendPacket({
            type: "changestate",
            state: state
        });
    }
}