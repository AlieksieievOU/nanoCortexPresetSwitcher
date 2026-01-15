export interface MIDIOptions {
    sysex?: boolean;
    software?: boolean;
}

export interface MIDIInputMap extends ReadonlyMap<string, MIDIInput> {}
export interface MIDIOutputMap extends ReadonlyMap<string, MIDIOutput> {}

export interface MIDIAccess extends EventTarget {
    readonly inputs: MIDIInputMap;
    readonly outputs: MIDIOutputMap;
    onstatechange: ((this: MIDIAccess, ev: MIDIConnectionEvent) => any) | null;
    readonly sysexEnabled: boolean;
}

export interface MIDIPort extends EventTarget {
    readonly id: string;
    readonly manufacturer?: string;
    readonly name?: string;
    readonly type: "input" | "output";
    readonly version?: string;
    readonly state: "disconnected" | "connected";
    readonly connection: "open" | "closed" | "pending";
    onstatechange: ((this: MIDIPort, ev: MIDIConnectionEvent) => any) | null;
    open(): Promise<MIDIPort>;
    close(): Promise<MIDIPort>;
}

export interface MIDIInput extends MIDIPort {
    readonly type: "input";
    onmidimessage: ((this: MIDIInput, ev: MIDIMessageEvent) => any) | null;
}

export interface MIDIOutput extends MIDIPort {
    readonly type: "output";
    send(data: number[] | Uint8Array, timestamp?: number): void;
    clear(): void;
}

export interface MIDIMessageEvent extends Event {
    readonly data: Uint8Array;
}

export interface MIDIConnectionEvent extends Event {
    readonly port: MIDIPort;
}

// Helper interface for casting navigator
export interface NavigatorWithMIDI extends Navigator {
    requestMIDIAccess(options?: MIDIOptions): Promise<MIDIAccess>;
}

export type CCState = Record<number, boolean>;
