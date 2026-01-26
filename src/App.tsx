import  { useState, useRef, useCallback, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Header } from './components/Header';
import { EffectControls } from './components/EffectControls';
import { PresetGrid } from './components/PresetGrid';
import { InfoBox } from './components/InfoBox';
import { Footer } from './components/Footer';
import { CC, DEFAULT_CC_STATE } from './constants';
import { WebMidiConnection, BluetoothMidiConnection, type DeviceConnection } from './services/MidiService';
import type { CCState } from './types';

function App(){
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [currentPreset, setCurrentPreset] = useState(0);
  const [ccState, setCcState] = useState<CCState>(DEFAULT_CC_STATE);
  const [expressionValue, setExpressionValue] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const FACTORY_PRESETS = [
    "Clean One", "Clean Two", "Crunch One", "Clean My Dreams", "Lead One", "Lead Two", "High Gain One", "High Gain Two",
    "Brit Plexi", "Brit 800", "US Gold", "US Clean", "US Tweed", "Jazz Clean", "Bass One", "Bass Two",
    "Brit Brown", "Cali Dual", "Cali Lead", "US Bassman", "US Deluxe", "US Twin", "Vox AC30", "Vox AC15",
    "Capture 1", "Capture 2", "Capture 3", "Capture 4", "Capture 5", "Capture 6", "Capture 7", "Capture 8"
  ];

  const [presetNames, setPresetNames] = useState<string[]>(() => {
    const names = Array.from({ length: 64 }, (_, i) => `Preset ${i + 1}`);
    FACTORY_PRESETS.forEach((name, i) => { if (i < names.length) names[i] = name; });
    return names;
  });

  const [showMonitor, setShowMonitor] = useState(true);
  const [midiLog, setMidiLog] = useState<string[]>([]);
  const connectionRef = useRef<DeviceConnection | null>(null);
  const currentPresetRef = useRef<number>(0);

  const showError = useCallback((message: string) => {
    setError(message);
    setTimeout(() => setError(null), 6000);
  }, []);

  const handleMidiMessage = useCallback((data: Uint8Array) => {
    if (!data || data.length === 0) return;
    const hex = Array.from(data).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
    setMidiLog(prev => [hex, ...prev].slice(0, 50));

    const status = data[0];
    const type = status & 0xF0;

    if (type === 0xB0) {
      if (Object.prototype.hasOwnProperty.call(DEFAULT_CC_STATE, data[1])) {
        setCcState(prev => ({ ...prev, [data[1]]: data[2] >= 64 }));
      }
      if (data[1] === CC.EXPRESSION) setExpressionValue(data[2]);
    } else if (type === 0xC0) {
      const pc = data[1];
      if (pc < 64) {
        setCurrentPreset(pc);
        currentPresetRef.current = pc;
      }
    } else if (status === 0xF0) {
      const strings: string[] = [];
      let current = '';
      for (let i = 1; i < data.length - 1; i++) {
        const b = data[i];
        if (b >= 32 && b <= 126) current += String.fromCharCode(b);
        else {
          if (current.trim().length >= 3) strings.push(current.trim());
          current = '';
        }
      }
      if (current.trim().length >= 3) strings.push(current.trim());

      if (strings.length > 0) {
        setPresetNames(prev => {
          const next = [...prev];
          if (strings.length >= 8) {
             const bank = Math.floor(currentPresetRef.current / 8) * 8;
             strings.forEach((s, idx) => { if (bank + idx < 64) next[bank + idx] = s; });
          } else {
             next[currentPresetRef.current] = strings[0];
          }
          return next;
        });
      }
    }
  }, []);

  const fetchPresetNames = useCallback(async () => {
    if (!connectionRef.current) return;
    const send = (d: number[]) => connectionRef.current?.send(d);
    
    // Identity & Handshake
    send([0xF0, 0x7E, 0x7F, 0x06, 0x01, 0xF7]);
    
    // Neural IDs: 00 21 7D
    [0x7D, 0x7C].forEach(id => {
       send([0xF0, 0x00, 0x21, id, 0x00, 0x42, 0x00, 0xF7]);
       send([0xF0, 0x00, 0x21, id, 0x00, 0x44, 0x00, 0xF7]);
    });

    let bank = 0;
    const interval = setInterval(() => {
        if (bank >= 8 || !connectionRef.current) return clearInterval(interval);
        send([0xB0, 0x20, bank]);
        send([0xC0, bank * 8]);
        bank++;
    }, 1500);
  }, []);

  const connect = async (type: 'usb' | 'bluetooth') => {
    setError(null);
    setIsConnecting(true);
    if (connectionRef.current) connectionRef.current.disconnect();

    try {
        const connection = type === 'bluetooth' ? new BluetoothMidiConnection() : new WebMidiConnection();
        await connection.connect();
        connection.onMessage(handleMidiMessage);
        connectionRef.current = connection;
        setDeviceName(connection.name);
        setIsConnected(true);
        setTimeout(fetchPresetNames, 500);
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

            {isConnected && (
              <div className="mb-8 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-linear-to-br from-cyan-500/5 to-transparent pointer-events-none" />
                <div className="flex justify-between items-center mb-6 relative">
                    <div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-500/50">Neural Protocol Monitor</h3>
                        <p className="text-[10px] text-zinc-500 italic mt-1 font-mono">{deviceName}</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={fetchPresetNames} className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all bg-zinc-800 px-3 py-1.5 rounded-md border border-zinc-700">↻ Reset Scan</button>
                        <button onClick={() => setShowMonitor(!showMonitor)} className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">{showMonitor ? 'Hide Data' : 'Show Data'}</button>
                    </div>
                </div>

                <div className="mb-6 bg-black/50 border border-zinc-800 rounded-xl p-4 relative group">
                    <input 
                        type="text" 
                        id="manualCommand"
                        placeholder="SEND CUSTOM HEX: F0 00 21 7D 00 42 00 F7"
                        className="w-full bg-transparent text-sm font-mono text-cyan-400 outline-none placeholder:text-zinc-800"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const bytes = (e.currentTarget as HTMLInputElement).value.split(/[ ,]+/).map(h => parseInt(h, 16)).filter(n => !isNaN(n));
                            connectionRef.current?.send(bytes);
                          }
                        }}
                    />
                </div>

                {showMonitor && (
                  <div className="p-4 bg-black/80 border border-zinc-800 rounded-xl font-mono text-[11px] h-64 overflow-y-auto custom-scrollbar">
                        {midiLog.length === 0 ? <div className="h-full flex items-center justify-center text-zinc-700 italic">Listening for Neural SysEx names...</div> : 
                        midiLog.map((log, i) => (
                            <div key={i} className={`mb-1 py-1 border-b border-white/5 last:border-0 flex gap-6 ${log.startsWith('F0') ? 'text-amber-400 font-bold' : 'text-zinc-600'}`}>
                                <span className="w-8 opacity-20 select-none">#{midiLog.length - i}</span>
                                <span className="flex-1 tracking-wider">{log}</span>
                            </div>
                        ))}
                  </div>
                )}
              </div>
            )}

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

            <PresetGrid currentPreset={currentPreset} onSelectPreset={switchPreset} isConnected={isConnected} presetNames={presetNames} />
            <InfoBox />
            <Footer />
        </div>
      </main>
    </div>
  );
}

export default App;