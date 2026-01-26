import { WebMidi, Input, Output } from 'webmidi';
import type {
  BluetoothRemoteGATTCharacteristic
} from '../types';

export interface DeviceConnection {
  connect(): Promise<void>;
  disconnect(): void;
  send(data: number[]): Promise<void> | void;
  onMessage(callback: (data: Uint8Array) => void): void;
  onDisconnect(callback: () => void): void;
  name: string;
  type: 'usb' | 'bluetooth';
  sysexEnabled: boolean;
}

const MIDI_SERVICE_UID = '0000a002-0000-1000-8000-00805f9b34fb';
const MIDI_CHARACTERISTIC_UID = '0000c302-0000-1000-8000-00805f9b34fb';


/**
 * USB MIDI implementation using WebMidi.js
 */
export class WebMidiConnection implements DeviceConnection {
  private inputs: Input[] = [];
  private outputs: Output[] = [];
  public name: string = '';
  public type: 'usb' = 'usb';
  private disconnectCallback: (() => void) | null = null;

  async connect(): Promise<void> {
    await WebMidi.enable({ sysex: true });

    console.log('🔍 All available MIDI inputs:', WebMidi.inputs.map(i => `${i.name} (${i.id})`));
    console.log('🔍 All available MIDI outputs:', WebMidi.outputs.map(o => `${o.name} (${o.id})`));

    // IMPORTANT: MIDI port naming is from the DEVICE's perspective:
    // - "Nano Cortex MIDI OUT" is where the device SENDS data (we RECEIVE from it)
    // - "Nano Cortex MIDI IN" is where the device RECEIVES data (we SEND to it)

    // So we need to:
    // - Listen to inputs that contain "OUT" in the name (device's output = our input)
    // - Send to outputs that contain "IN" in the name (device's input = our output)

    this.inputs = WebMidi.inputs.filter(i =>
      (i.name.toLowerCase().includes('nano') || i.name.toLowerCase().includes('cortex')) &&
      i.name.toLowerCase().includes('out')
    );
    this.outputs = WebMidi.outputs.filter(o =>
      (o.name.toLowerCase().includes('nano') || o.name.toLowerCase().includes('cortex')) &&
      o.name.toLowerCase().includes('in')
    );

    // Fallback: if no specific ports found, use all Nano Cortex ports
    if (this.inputs.length === 0) {
      this.inputs = WebMidi.inputs.filter(i =>
        i.name.toLowerCase().includes('nano') || i.name.toLowerCase().includes('cortex')
      );
    }
    if (this.outputs.length === 0) {
      this.outputs = WebMidi.outputs.filter(o =>
        o.name.toLowerCase().includes('nano') || o.name.toLowerCase().includes('cortex')
      );
    }

    if (this.outputs.length === 0) throw new Error('No MIDI device detected.');

    this.name = this.inputs[0]?.name || this.outputs[0].name;
    console.log(`🔌 USB Connection: ${this.name}`);
    console.log(`📤 Sending to outputs:`, this.outputs.map(o => o.name));
    console.log(`📥 Listening to inputs:`, this.inputs.map(i => i.name));
  }

  get sysexEnabled(): boolean {
    return WebMidi.sysexEnabled;
  }

  disconnect() {
    this.inputs.forEach(i => i.removeListener());
    WebMidi.disable();
    this.inputs = [];
    this.outputs = [];
    this.disconnectCallback?.();
  }

  onDisconnect(callback: () => void) {
    this.disconnectCallback = callback;
  }

  send(data: number[]) {
    // Broadcast to all outputs
    this.outputs.forEach(o => o.send(data));
  }

  onMessage(callback: (data: Uint8Array) => void) {
    this.inputs.forEach(i => {
      console.log(`🎧 Listening to MIDI input: ${i.name}`);
      i.addListener('midimessage', (e) => {
        console.log(`🎵 Raw MIDI received from ${i.name}:`, e);
        if (e.data) {
          console.log(`📨 MIDI data:`, Array.from(e.data).map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(' '));
          callback(e.data);
        }
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
  private notifyCharacteristics: BluetoothRemoteGATTCharacteristic[] = [];
  private messageCallback: ((data: Uint8Array) => void) | null = null;
  private writeQueue: Promise<void> = Promise.resolve();
  private disconnectCallback: (() => void) | null = null;
  public name: string = '';
  public type: 'bluetooth' = 'bluetooth';
  public sysexEnabled: boolean = true;

  async connect(): Promise<void> {
    const nav = navigator as any;
    if (!nav.bluetooth) throw new Error('Web Bluetooth not supported');

    // Request device with proper filters
    // The Nano Cortex advertises the service UUID 0xA002
    this.device = await nav.bluetooth.requestDevice({
      filters: [
        { services: [MIDI_SERVICE_UID] }
      ],
      optionalServices: [MIDI_SERVICE_UID]
    });

    // Add disconnect listener
    this.device.addEventListener('gattserverdisconnected', () => {
      console.log('📶 BLE Device disconnected');
      this.writeCharacteristics = [];
      this.notifyCharacteristics = [];
      this.disconnectCallback?.();
    });

    const server = await this.device.gatt.connect();
    const service = await server.getPrimaryService(MIDI_SERVICE_UID);
    const characteristics = await service.getCharacteristics();

    console.log(`🔍 Found ${characteristics.length} characteristics:`);

    // Store characteristics and set up notifications
    for (const char of characteristics) {
      const writeType = char.properties.write ? 'write' : (char.properties.writeWithoutResponse ? 'writeWithoutResponse' : 'none');
      console.log(`  - UUID: ${char.uuid}, Write: ${writeType}, Notify: ${char.properties.notify}`);

      if (char.properties.write || char.properties.writeWithoutResponse) {
        this.writeCharacteristics.push(char);
        console.log(`    ✅ Added to write characteristics`);
      }
      if (char.properties.notify) {
        this.notifyCharacteristics.push(char);
        await char.startNotifications();
        console.log(`    ✅ Started notifications`);

        // Set up the event listener if callback is already registered
        if (this.messageCallback) {
          char.addEventListener('characteristicvaluechanged', (e: any) => {
            const val = new Uint8Array(e.target.value.buffer);
            // Pass through raw data - Nano Cortex may use custom format
            this.messageCallback?.(val);
          });
        }
      }
    }

    this.name = this.device.name || 'Bluetooth MIDI';
    console.log(`📶 BLE Connected: ${this.name}`);
  }

  disconnect() {
    if (this.device?.gatt?.connected) this.device.gatt.disconnect();
    this.writeCharacteristics = [];
    this.notifyCharacteristics = [];
    this.writeQueue = Promise.resolve();
    this.device = null;
    this.disconnectCallback?.();
  }

  onDisconnect(callback: () => void) {
    this.disconnectCallback = callback;
  }

  async send(data: number[]) {
    if (!this.writeCharacteristics.length) {
      console.error('❌ No write characteristics available');
      return;
    }

    // Queue the write operation to prevent "GATT operation already in progress" errors
    this.writeQueue = this.writeQueue.then(async () => {
      // Try different characteristics - the Nano Cortex has multiple write characteristics
      // 0xC302 (write with response) is most likely the MIDI I/O characteristic
      let char = this.writeCharacteristics.find(c =>
        c.uuid === MIDI_CHARACTERISTIC_UID || c.uuid.includes('c302')
      );
      if (!char) {
        char = this.writeCharacteristics.find(c => c.uuid.includes('c304'));
      }
      if (!char) {
        char = this.writeCharacteristics[0];
      }

      console.log(`📝 Using characteristic: ${char.uuid}`);

      try {
        // Nano Cortex BLE expect INDIVIDUAL BYTES sent sequentially
        // rather than a full MIDI packet.
        for (const byte of data) {
          const buffer = new Uint8Array([byte]);
          await char.writeValueWithoutResponse(buffer);
        }
        console.log(`📤 Sent BLE MIDI (Sequential): [${data.map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(', ')}]`);
      } catch (err) {
        console.error('❌ BLE write error:', err);
        throw err;
      }
    });

    // Wait for this write to complete
    await this.writeQueue;
  }

  onMessage(callback: (data: Uint8Array) => void) {
    this.messageCallback = callback;

    // If already connected, set up listeners on existing notify characteristics
    if (this.notifyCharacteristics.length > 0) {
      this.notifyCharacteristics.forEach(char => {
        char.addEventListener('characteristicvaluechanged', (e: any) => {
          const val = new Uint8Array(e.target.value.buffer);
          // Pass through raw data - Nano Cortex may use custom format
          callback(val);
        });
      });
    }
  }
}
