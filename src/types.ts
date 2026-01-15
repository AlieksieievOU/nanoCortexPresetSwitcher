export type CCState = Record<number, boolean>;

// Re-export global Web MIDI types to avoid conflicts with locally defined interfaces
// and ensure compatibility with the global Navigator type.
export type MIDIAccess = globalThis.MIDIAccess;
export type MIDIInput = globalThis.MIDIInput;
export type MIDIOutput = globalThis.MIDIOutput;
export type MIDIMessageEvent = globalThis.MIDIMessageEvent;
export type MIDIPort = globalThis.MIDIPort;

// Extend Navigator. We use the global MIDIAccess type to match the native signature.
export interface NavigatorWithMIDI extends Navigator {
  requestMIDIAccess(options?: any): Promise<MIDIAccess>;
}