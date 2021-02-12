import * as _ws from "websocket";
import { MixeryLivePackets } from "../packet.js";
import { EventEmitter } from "events";
const ws = _ws.default;
export class MixeryLiveServer {
    constructor(src, logins = []) {
        this.ws = new ws.server({
            httpServer: src,
            autoAcceptConnections: false
        });
        this.ws.on("request", req => {
            if (req.httpRequest.url === "/live/ws") {
                if (req.requestedProtocols.includes("live")) {
                    req.accept("live");
                }
                else
                    req.reject(403, "Missing requested protocol");
            }
            else
                req.reject(404, "WebSocket endpoint not found");
        });
        this.ws.on("connect", (wssk) => {
            let connection = new MixeryLiveClientConnection(wssk);
            connection.on("login", (username, password) => {
                console.log(username, password);
                for (let i = 0; i < logins.length; i++)
                    if (logins[i].username === username && logins[i].password === password) {
                        connection.loginSuccess();
                        return;
                    }
                connection.loginFailed();
            });
        });
    }
}
export class MixeryLiveClientConnection extends EventEmitter {
    constructor(ws) {
        super();
        this.ws = ws;
        this.type = "unknown";
        this.loginStatus = false;
        this.ws.on("message", (msg) => {
            if (msg.type === "utf8") {
                let pk = JSON.parse(msg.utf8Data);
                switch (pk.type) {
                    case "auth":
                        this.emit("login", pk.username, pk.password);
                        break;
                    case "changestate":
                        this.emit("changestate", pk.state);
                        break;
                    default:
                        this.error(MixeryLivePackets.ErrorCodes.INVAILD_PACKET_TYPE, pk);
                        break;
                }
            }
        });
        this.on("changestate", state => {
            if (state === "dvtype.sender")
                this.type = "sender";
            else if (state === "dvtype.reciever")
                this.type = "reciever";
        });
    }
    sendPacket(packet) { this.ws.sendUTF(JSON.stringify(packet)); }
    error(code, ref) {
        this.sendPacket({
            type: "error",
            code, ref
        });
    }
    loginFailed() {
        if (this.loginStatus)
            throw new Error("Cannot send login fail packet: Successfully logged in before");
        this.sendPacket({
            type: "changestate",
            state: "auth.loginfail"
        });
    }
    loginSuccess() {
        this.sendPacket({
            type: "changestate",
            state: "auth.login"
        });
        this.loginStatus = true;
    }
}