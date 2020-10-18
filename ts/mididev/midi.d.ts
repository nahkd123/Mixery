export {};

declare global {
    interface Navigator {
        requestMIDIAccess(options?: MIDIOptions): Promise<MIDIAccess>;
    }

    interface MIDIOptions {
        sysex: boolean;
    }
    
    interface MIDIAccess extends EventTarget {
        readonly inputs: MIDIInputMap;
        readonly outputs: MIDIOutputMap;
        readonly sysexEnabled: boolean;
    
        onstatechange(event: MIDIConnectionEvent): void;
        addEventListener(type: "statechange", listener: (this: this, event: MIDIConnectionEvent) => any, options?: boolean | AddEventListenerOptions);
        addEventListener(type: string, listener: (event: EventListenerOrEventListenerObject) => any, options?: boolean | AddEventListenerOptions);
    }
    
    type MIDIInputMap = Map<string, MIDIInput>;
    type MIDIOutputMap = Map<string, MIDIOutput>;
    type MIDIPortType = "input" | "output";
    type MIDIPortDeviceState = 'disconnected' | 'connected';
    type MIDIPortConnectionState = 'open' | 'closed' | 'pending';
    
    interface MIDIPort extends EventTarget {
        id: string;
        manufacturer?: string;
        name?: string;
        type: MIDIPortType;
        version?: string;
        state: MIDIPortDeviceState;
        connection: MIDIPortConnectionState;
            
        onstatechange(event: MIDIConnectionEvent): void;
        addEventListener(type: "statechange", listener: (this: this, event: MIDIConnectionEvent) => any, options?: boolean | AddEventListenerOptions);
        addEventListener(type: string, listener: (event: EventListenerOrEventListenerObject) => any, options?: boolean | AddEventListenerOptions);
    
        open(): Promise<MIDIPort>;
        close(): Promise<MIDIPort>;
    }
    
    interface MIDIInput extends MIDIPort {
        type: "input";
    
        onmidimessage(event: MIDIMessageEvent): void;
        addEventListener(type: "statechange", listener: (this: this, event: MIDIConnectionEvent) => any, options?: boolean | AddEventListenerOptions): void;
        addEventListener(type: "midimessage", listener: (this: this, event: MIDIMessageEvent) => any, options?: boolean | AddEventListenerOptions): void;
        addEventListener(type: string, listener: (event: EventListenerOrEventListenerObject) => any, options?: boolean | AddEventListenerOptions): void;
    }
    
    interface MIDIOutput extends MIDIPort {
        type: "output";
    
        send(data: number[] | Uint8Array, timestamp?: number): void;
        clear(): void;
    }
    
    //#region Events
    interface MIDIConnectionEvent extends Event {
        port: MIDIPort;
    }
    interface MIDIMessageEvent extends Event {
        receivedTime: number;
        data: Uint8Array;
    }
    //#endregion
}