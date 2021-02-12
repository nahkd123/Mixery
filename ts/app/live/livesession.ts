import { MixeryLive } from "../../live/client/index.js";

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

export interface LiveSession {
    on(event: "login", listener: (success: boolean) => void): void;
    emit(event: "login", success: boolean): void;
}
export class LiveSession extends EventEmitter {
    connection: MixeryLive;

    constructor() {super();}

    get isLoggedIn() {return this.connection !== undefined && this.connection.authorized;}

    login(host: string, username: string, password: string) {
        if (this.isLoggedIn) return;
        username = username || "USER";
        password = password || "PASSWORD_HERE";

        const hostname = host.split(":")[0] || window.location.hostname;
        const port = parseInt(host.substr(hostname.length + 1) || window.location.port);

        if (this.connection?.isSameConnection(hostname, port)) this.connection.login(username, password);
        else {
            this.connection = new MixeryLive(hostname, port, {
                username, password
            });

            this.connection.on("login", success => {
                this.emit("login", success);
                if (success) this.loginSuccess();
            });
        }
    }

    private loginSuccess() {
        this.connection.changeState("dvtype.sender");
    }
}
export default LiveSession;