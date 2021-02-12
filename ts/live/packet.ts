export namespace MixeryLivePackets {
    export interface Packet {
        type: "auth" | "changestate" | "error";
        [x: string]: any;
    }

    export interface Login extends Packet {
        type: "auth";
        username: string;
        password: string;
    }
    export interface ChangeState extends Packet {
        type: "changestate";
        state: 
            | "auth.loginfail"
            | "auth.login"
            | "dvtype.sender"
            | "dvtype.reciever";
    }
    export interface Error extends Packet {
        type: "error";
        code: ErrorCodes;
        ref?: any;
    }

    export enum ErrorCodes {
        INVAILD_PACKET_TYPE
    }
}