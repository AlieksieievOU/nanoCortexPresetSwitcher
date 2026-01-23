import type { 
  NavigatorWithMIDI, 
  BluetoothRemoteGATTCharacteristic,
  MIDIAccess,
  MIDIInput,
  MIDIOutput,
  MIDIMessageEvent
} from '../types';

export interface DeviceConnection {
  connect(): Promise<void>;
  disconnect(): void;
  send(data: number[]): void;
  onMessage(callback: (data: Uint8Array) => void): void;
  name: string;
  type: 'usb' | 'bluetooth';
}

const MIDI_SERVICE_UID = '0000a002-0000-1000-8000-00805f9b34fb';
const MIDI_CHARACTERISTIC_UID = '0000c305-0000-1000-8000-00805f9b34fb';

export class WebMidiConnection implements DeviceConnection {
  private midiAccess: MIDIAccess | null = null;
  private input: MIDIInput | null = null;
  private output: MIDIOutput | null = null;
  public name: string = '';
  public type: 'usb' = 'usb';

  async connect(): Promise<void> {
    const nav = navigator as unknown as NavigatorWithMIDI;
    if (!nav.requestMIDIAccess) throw new Error('WebMIDI not supported');

    this.midiAccess = await nav.requestMIDIAccess({ sysex: true });
    
    // Auto-select Nano Cortex
    const outputs = Array.from(this.midiAccess.outputs.values());
    const inputs = Array.from(this.midiAccess.inputs.values());

    const output = outputs.find(o => o.name?.toLowerCase().includes('nano') || o.name?.toLowerCase().includes('cortex')) || outputs[0];
    const input = inputs.find(i => i.name?.toLowerCase().includes('nano') || i.name?.toLowerCase().includes('cortex')) || inputs[0];

    if (!output) throw new Error('No MIDI device found');

    this.output = output;
    this.name = output.name || 'MIDI Device';
    
    if (input) {
      this.input = input;
    }
  }

  disconnect() {
    if (this.input) this.input.onmidimessage = null;
    this.input = null;
    this.output = null;
    this.midiAccess = null;
  }

  send(data: number[]) {
    if (this.output) this.output.send(data);
  }

  onMessage(callback: (data: Uint8Array) => void) {
    if (this.input) {
      this.input.onmidimessage = (e: MIDIMessageEvent) => {
        if (e.data) callback(e.data);
      };
    }
  }
}

export class BluetoothMidiConnection implements DeviceConnection {
  private device: any = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private writeCharacteristics: BluetoothRemoteGATTCharacteristic[] = [];
  private sendQueue: Promise<void> = Promise.resolve();
  public name: string = '';
  public type: 'bluetooth' = 'bluetooth';

  async connect(): Promise<void> {
    const nav = navigator as unknown as NavigatorWithMIDI;
    if (!nav.bluetooth) throw new Error('Web Bluetooth not supported');

    this.device = await nav.bluetooth.requestDevice({
      filters: [
        { services: [MIDI_SERVICE_UID] },
        { namePrefix: 'Nano' },
        { namePrefix: 'Cortex' }
      ],
      optionalServices: [MIDI_SERVICE_UID]
    });

    if (!this.device || !this.device.gatt) throw new Error('Device not found or not supported');

    this.device.addEventListener('gattserverdisconnected', () => {
        console.log('Device disconnected');
    });

    const server = await this.device.gatt.connect();
    const service = await server.getPrimaryService(MIDI_SERVICE_UID);
    
    const characteristics = await service.getCharacteristics();
    this.writeCharacteristics = [];
    console.log('--- 🔍 Configuring Characteristics ---');

    for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
            this.writeCharacteristics.push(char);
            console.log(`  📝 Added Write Char: ${char.uuid}`);
        }
        
        if (char.properties.notify) {
             try {
                 await char.startNotifications();
                 console.log(`  🔔 Started notifications on ${char.uuid}`);
             } catch (e) {
                 console.warn(`  ❌ Failed to start notifications on ${char.uuid}`, e);
             }
        }
    }
    
    if (this.writeCharacteristics.length === 0) {
        throw new Error('No writeable characteristics found on service');
    }

    this.characteristic = this.writeCharacteristics[0];
    this.name = this.device.name || 'Bluetooth MIDI';
    console.log(`--- Ready with ${this.writeCharacteristics.length} write targets ---`);
  }

  disconnect() {
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.characteristic = null;
    this.writeCharacteristics = [];
    this.device = null;
  }

  async send(data: number[]) {
    if (!this.writeCharacteristics.length) {
      console.warn('No write characteristics available');
      return;
    }

    const blePacket = this.midiEncoder(data);
    const buffer = new Uint8Array(blePacket);

    const promises = this.writeCharacteristics.map(async (char) => {
      try {
        await char.writeValueWithoutResponse(buffer);
      } catch (err) {
        console.warn(`Failed to send to ${char.uuid}`, err);
      }
    });

    await Promise.all(promises);
  }

  private midiEncoder(midiData: number[]): number[] {
    const localTime = performance.now() & 8191;
    const header = ((localTime >> 7) | 0x80) & 0xBF;
    const timestamp = (localTime & 0x7F) | 0x80;
    
    const midiBLEmessage: number[] = [];
    midiBLEmessage.push(header);
    
    for (const byte of midiData) {
      if ((byte >>> 7) === 1) {
        midiBLEmessage.push(timestamp);
      }
      midiBLEmessage.push(byte);
    }
    
    return midiBLEmessage;
  }



  onMessage(callback: (data: Uint8Array) => void) {
    // Reading/Notification logic omitted as Nano Cortex implementation 
    // for reading is not yet clear/verified.
  }
}

