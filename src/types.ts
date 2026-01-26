export type CCState = Record<number, boolean>;
export type PresetNames = string[];


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
  bluetooth?: Bluetooth;
}

export interface Bluetooth {
  requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
}

export interface RequestDeviceOptions {
  filters?: BluetoothLEScanFilter[];
  optionalServices?: BluetoothServiceUUID[];
  acceptAllDevices?: boolean;
}

export interface BluetoothLEScanFilter {
  name?: string;
  namePrefix?: string;
  services?: BluetoothServiceUUID[];
}

export type BluetoothServiceUUID = number | string;

export interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

export interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
}

export interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: BluetoothServiceUUID): Promise<BluetoothRemoteGATTCharacteristic>;
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

export interface BluetoothRemoteGATTCharacteristic {
  uuid: string;
  properties: BluetoothCharacteristicProperties;
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithoutResponse(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  addEventListener(type: string, listener: EventListener): void;
  value?: DataView;
}

export interface BluetoothCharacteristicProperties {
  write: boolean;
  writeWithoutResponse: boolean;
  notify: boolean;
}