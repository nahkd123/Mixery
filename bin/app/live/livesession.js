import { MixeryLive } from "../../live/client/index.js";
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
export class LiveSession extends EventEmitter {
    constructor() { super(); }
    get isLoggedIn() { return this.connection !== undefined && this.connection.authorized; }
    login(host, username, password) {
        if (this.isLoggedIn)
            return;
        username = username || "USER";
        password = password || "PASSWORD_HERE";
        const hostname = host.split(":")[0] || window.location.hostname;
        const port = parseInt(host.substr(hostname.length + 1) || window.location.port);
        if (this.connection?.isSameConnection(hostname, port))
            this.connection.login(username, password);
        else {
            this.connection = new MixeryLive(hostname, port, {
                username, password
            });
            this.connection.on("login", success => {
                this.emit("login", success);
                if (success)
                    this.loginSuccess();
            });
        }
    }
    loginSuccess() {
        this.connection.changeState("dvtype.sender");
    }
}
export default LiveSession;