import * as _ws from "websocket";
import * as http from "http";
import { MixeryLivePackets } from "../packet.js";
import { EventEmitter } from "events";

// @ts-ignore
declare namespace ws {
    class server extends _ws.server {}
    class client extends _ws.client {}
    class connection extends _ws.connection {}
}

// @ts-ignore
const ws = _ws.default;

interface LoginInfo {
    username: string;
    password?: string;
    passwordHash?: string;
}

export class MixeryLiveServer {
    ws: ws.server;

    constructor(src: http.Server, logins: LoginInfo[] = []) {
        this.ws = new ws.server({
            httpServer: src,
            autoAcceptConnections: false
        });
        this.ws.on("request", req => {
            // TODO: do cross origin check here

            if (req.httpRequest.url === "/live/ws") {
                if (req.requestedProtocols.includes("live")) {
                    req.accept("live");
                } else req.reject(403, "Missing requested protocol");
            } else req.reject(404, "WebSocket endpoint not found");
        });
        this.ws.on("connect", (wssk) => {
            let connection = new MixeryLiveClientConnection(wssk);
            connection.on("login", (username, password) => {
                console.log(username, password);
                for (let i = 0; i < logins.length; i++) if (logins[i].username === username && logins[i].password === password) {
                    connection.loginSuccess();
                    return;
                }

                connection.loginFailed();
            });
        });
    }
}

export type MixeryLiveClientType = "unknown" | "reciever" | "sender";
export interface MixeryLiveClientConnection {
    on(event: "login", listener: (username: string, password: string) => void);
    emit(event: "login", username: string, password: string);
    
    on(event: "changestate", listener: (state: "auth.loginfail" | "auth.login" | "dvtype.sender" | "dvtype.reciever") => void);
    emit(event: "changestate", state: "auth.loginfail" | "auth.login" | "dvtype.sender" | "dvtype.reciever");
}
export class MixeryLiveClientConnection extends EventEmitter {
    type: MixeryLiveClientType = "unknown";

    constructor(
        public ws: ws.connection
    ) {
        super();
        this.ws.on("message", (msg) => {
            if (msg.type === "utf8") {
                let pk = <MixeryLivePackets.Packet> JSON.parse(msg.utf8Data);

                switch (pk.type) {
                    case "auth": this.emit("login", pk.username, pk.password); break;
                    case "changestate": this.emit("changestate", pk.state); break;
                    default:
                        this.error(MixeryLivePackets.ErrorCodes.INVAILD_PACKET_TYPE, pk);
                        break;
                }
            }
        });

        this.on("changestate", state => {
            if (state === "dvtype.sender") this.type = "sender";
            else if (state === "dvtype.reciever") this.type = "reciever";
        });
    }

    sendPacket(packet: MixeryLivePackets.Packet) {this.ws.sendUTF(JSON.stringify(packet));}
    error(code: MixeryLivePackets.ErrorCodes, ref?: any) {this.sendPacket(<MixeryLivePackets.Error> {
        type: "error",
        code, ref
    })}

    loginStatus = false;
    loginFailed() {
        if (this.loginStatus) throw new Error("Cannot send login fail packet: Successfully logged in before");
        this.sendPacket(<MixeryLivePackets.ChangeState> {
            type: "changestate",
            state: "auth.loginfail"
        });
    }
    loginSuccess() {
        this.sendPacket(<MixeryLivePackets.ChangeState> {
            type: "changestate",
            state: "auth.login"
        });
        this.loginStatus = true;
    }
}