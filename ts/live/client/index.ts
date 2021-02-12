import { MixeryLivePackets } from "../packet.js";

export interface MixeryLiveClientOptions {
    useWSS?: boolean;
    username: string;
    password: string;
}

abstract class EventEmitter {
    constructor(public options?: {}) {}

    listeners = new Map<string, ((...args: any[]) => void)[]>();

    on(event: string, listener: (...args: any[]) => void): void {
        if (!this.listeners.has(event)) this.listeners.set(event, []);
        this.listeners.get(event).push(listener);
    }
    emit(event: string, ...args: any): void {
        if (!this.listeners.has(event)) return;
        this.listeners.get(event).forEach(listener => {
            listener(...args);
        });
    }
}

export interface MixeryLive {
    on(event: "packet", listener: (packet: MixeryLivePackets.Packet) => void): void;
    emit(event: "packet", packet: MixeryLivePackets.Packet): void;
    
    on(event: "login", listener: (success: boolean) => void): void;
    emit(event: "login", success: boolean): void;
}
export class MixeryLive extends EventEmitter {
    ws: WebSocket;
    authorized = false;

    constructor(public host: string, public port: number = 8080, options: MixeryLiveClientOptions) {
        super();
        this.initPacketsListener();

        this.ws = new WebSocket(
            (options.useWSS? "wss" : "ws") + "://" + host + ":" + port + "/live/ws",
            ["live"]
        );
        console.log("[live/ws] Connection established (" + host + ":" + port + ")");

        this.ws.addEventListener("open", (event) => {
            console.log("[live/ws] " + host + " opened. Attempting to authorize...");
            this.login(options.username || "USER", options.password || "PASSWORD_HERE");
        });
        this.ws.addEventListener("message", (event) => {
            if (typeof event.data === "string") {
                let pk = <MixeryLivePackets.Packet> JSON.parse(event.data);
                this.emit("packet", pk);
            } else if (event.data instanceof Blob) {
                // Controls
            }
        });
    }

    isSameConnection(host: string, port: number) {
        return this.host === host && this.port === port;
    }

    initPacketsListener() {
        this.on("packet", (pk) => {
            if (pk.type === "changestate") {
                if (pk.state === "auth.loginfail") this.emit("login", false);
                if (pk.state === "auth.login") this.emit("login", true);
            }
        });

        this.on("login", (success) => {
            this.authorized = success;
            if (this.authorized) console.log("[live/ws] Authorize successfully.");
            else console.log("[live/ws] Authorize failed. Please check your login credential");
        });
    }

    sendPacket(packet: MixeryLivePackets.Packet) {this.ws.send(JSON.stringify(packet));}
    login(username: string, password: string) {
        if (this.authorized) return;
        this.sendPacket(<MixeryLivePackets.Login> {
            type: "auth",
            username, password
        });
    }
    changeState(state: "auth.loginfail" | "auth.login" | "dvtype.sender" | "dvtype.reciever") {
        if (!this.authorized) throw new Error("Cannot change state: Not authorized");
        this.sendPacket(<MixeryLivePackets.ChangeState> {
            type: "changestate",
            state: state
        });
    }
}