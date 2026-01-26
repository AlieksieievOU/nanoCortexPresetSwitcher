import { useState, useRef, useCallback, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Header } from './components/Header';
import { EffectControls } from './components/EffectControls';
import { PresetGrid } from './components/PresetGrid';
import { InfoBox } from './components/InfoBox';
import { Footer } from './components/Footer';
import { CC, DEFAULT_CC_STATE } from './constants';
import { WebMidiConnection, BluetoothMidiConnection, type DeviceConnection } from './services/MidiService';
import type { CCState } from './types';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [currentPreset, setCurrentPreset] = useState(0);
  const [ccState, setCcState] = useState<CCState>(DEFAULT_CC_STATE);
  const [expressionValue, setExpressionValue] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const connectionRef = useRef<DeviceConnection | null>(null);
  const currentPresetRef = useRef<number>(0);

  const showError = useCallback((message: string) => {
    setError(message);
    setTimeout(() => setError(null), 6000);
  }, []);

  const handleMidiMessage = useCallback((data: Uint8Array) => {
    if (!data || data.length === 0) return;
    const hex = Array.from(data).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');

    const status = data[0];
    const type = status & 0xF0;

    if (type === 0xB0) {
      console.log(`📥 CC Message: CC${data[1]} = ${data[2]}`);
      if (Object.prototype.hasOwnProperty.call(DEFAULT_CC_STATE, data[1])) {
        setCcState(prev => ({ ...prev, [data[1]]: data[2] >= 64 }));
      }
      if (data[1] === CC.EXPRESSION) setExpressionValue(data[2]);
    } else if (type === 0xC0) {
      const pc = data[1];
      console.log(`📥 Program Change: Preset ${pc}`);
      if (pc < 64) {
        setCurrentPreset(pc);
        currentPresetRef.current = pc;
      }
    } else if (status === 0xF0) {
      console.log(`📥 SysEx received (${data.length} bytes):`, hex);
    }
  }, []);

  const connect = async (type: 'usb' | 'bluetooth') => {
    setError(null);
    setIsConnecting(true);
    if (connectionRef.current) connectionRef.current.disconnect();

    try {
      const connection = type === 'bluetooth' ? new BluetoothMidiConnection() : new WebMidiConnection();
      await connection.connect();
      connection.onMessage(handleMidiMessage);
      connection.onDisconnect(() => {
        setIsConnected(false);
        setDeviceName('');
        connectionRef.current = null;
      });
      connectionRef.current = connection;
      setDeviceName(connection.name);
      setIsConnected(true);

      console.log('✅ Connected! The Nano Cortex does not support querying preset names or current state via MIDI.');
      console.log('💡 Configure "USB MIDI Out" in Cortex Cloud app to receive preset/effect changes from hardware.');
    } catch (err: any) {
      showError(`Link Error: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const switchPreset = useCallback((id: number) => {
    setCurrentPreset(id);
    currentPresetRef.current = id;
    connectionRef.current?.send([0xC0, id]);
  }, []);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!connectionRef.current) return;
      const key = parseInt(e.key);
      if (!isNaN(key) && key >= 1 && key <= 9) switchPreset(key - 1);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [switchPreset]);

  return (
    <div className="min-h-screen text-white bg-black font-primary selection:bg-cyan-500/30">
      <Navigation isConnected={isConnected} deviceName={deviceName} onConnect={connect} isConnecting={isConnecting} />

      <main className="min-h-screen pt-24 pb-16">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <Header />

          {error && <div className="mb-6 bg-red-900/20 border border-red-500 text-red-400 p-4 rounded-md font-bold">{error}</div>}

          <EffectControls
            ccState={ccState}
            onToggleCC={(cc) => {
              const next = !ccState[cc];
              setCcState(prev => ({ ...prev, [cc]: next }));
              connectionRef.current?.send([0xB0, cc, next ? 127 : 0]);
            }}
            onTapTempo={() => connectionRef.current?.send([0xB0, CC.TAP, 127])}
            onExpressionChange={(v) => {
              setExpressionValue(v);
              connectionRef.current?.send([0xB0, CC.EXPRESSION, v]);
            }}
            expressionValue={expressionValue}
            isConnected={isConnected}
          />

          <PresetGrid currentPreset={currentPreset} onSelectPreset={switchPreset} isConnected={isConnected} />
          <InfoBox />
          <Footer />
        </div>
      </main>
    </div>
  );
}

export default App;