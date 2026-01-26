import { WebMidi, Input, Output } from 'webmidi';
import type {
  BluetoothRemoteGATTCharacteristic
} from '../types';

export interface DeviceConnection {
  connect(): Promise<void>;
  disconnect(): void;
  send(data: number[]): void;
  onMessage(callback: (data: Uint8Array) => void): void;
  name: string;
  type: 'usb' | 'bluetooth';
  sysexEnabled: boolean;
}

const MIDI_SERVICE_UID = '0000a002-0000-1000-8000-00805f9b34fb';

/**
 * USB MIDI implementation using WebMidi.js
 */
export class WebMidiConnection implements DeviceConnection {
  private inputs: Input[] = [];
  private outputs: Output[] = [];
  public name: string = '';
  public type: 'usb' = 'usb';

  async connect(): Promise<void> {
    await WebMidi.enable({ sysex: true });

    // Enroll ALL Nano Cortex ports
    this.inputs = WebMidi.inputs.filter(i =>
      i.name.toLowerCase().includes('nano') || i.name.toLowerCase().includes('cortex')
    );
    this.outputs = WebMidi.outputs.filter(o =>
      o.name.toLowerCase().includes('nano') || o.name.toLowerCase().includes('cortex')
    );

    // If no ports match, take all available as fallback
    if (this.inputs.length === 0) this.inputs = WebMidi.inputs;
    if (this.outputs.length === 0) this.outputs = WebMidi.outputs;

    if (this.outputs.length === 0) throw new Error('No MIDI device detected.');

    this.name = this.outputs[0].name;
    console.log(`🔌 USB Connection: ${this.name} (${this.inputs.length} inputs active)`);
  }

  get sysexEnabled(): boolean {
    return WebMidi.sysexEnabled;
  }

  disconnect() {
    this.inputs.forEach(i => i.removeListener());
    WebMidi.disable();
    this.inputs = [];
    this.outputs = [];
  }

  send(data: number[]) {
    // Broadcast to all outputs
    this.outputs.forEach(o => o.send(data));
  }

  onMessage(callback: (data: Uint8Array) => void) {
    this.inputs.forEach(i => {
      i.addListener('midimessage', (e) => {
        if (e.data) callback(e.data);
      });
    });
  }
}

/**
 * Bluetooth MIDI implementation
 */
export class BluetoothMidiConnection implements DeviceConnection {
  private device: any = null;
  private writeCharacteristics: BluetoothRemoteGATTCharacteristic[] = [];
  public name: string = '';
  public type: 'bluetooth' = 'bluetooth';
  public sysexEnabled: boolean = true;

  async connect(): Promise<void> {
    const nav = navigator as any;
    if (!nav.bluetooth) throw new Error('Web Bluetooth not supported');

    this.device = await nav.bluetooth.requestDevice({
      filters: [{ namePrefix: 'Nano' }, { namePrefix: 'Cortex' }],
      optionalServices: [MIDI_SERVICE_UID]
    });

    const server = await this.device.gatt.connect();
    const service = await server.getPrimaryService(MIDI_SERVICE_UID);
    const characteristics = await service.getCharacteristics();

    for (const char of characteristics) {
      if (char.properties.write || char.properties.writeWithoutResponse) this.writeCharacteristics.push(char);
      if (char.properties.notify) await char.startNotifications();
    }

    this.name = this.device.name || 'Bluetooth MIDI';
  }

  disconnect() {
    if (this.device?.gatt?.connected) this.device.gatt.disconnect();
    this.writeCharacteristics = [];
    this.device = null;
  }

  async send(data: number[]) {
    if (!this.writeCharacteristics.length) return;
    const buffer = new Uint8Array([0x00, ...data]);
    const char = this.writeCharacteristics.find(c => c.uuid.includes('c302')) || this.writeCharacteristics[0];
    await char.writeValueWithoutResponse(buffer);
  }

  onMessage(callback: (data: Uint8Array) => void) {
    if (!this.device?.gatt?.connected) return;
    this.device.gatt.getPrimaryService(MIDI_SERVICE_UID).then((service: any) => {
      service.getCharacteristics().then((chars: any[]) => {
        chars.forEach(char => {
          if (char.properties.notify) {
            char.addEventListener('characteristicvaluechanged', (e: any) => {
              const val = new Uint8Array(e.target.value.buffer);
              // Passthrough raw for now
              callback(val);
            });
          }
        });
      });
    });
  }
}
