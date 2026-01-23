import  { useState, useEffect, useRef, useCallback } from 'react';
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
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [currentPreset, setCurrentPreset] = useState(0);
  const [ccState, setCcState] = useState<CCState>(DEFAULT_CC_STATE);
  const [expressionValue, setExpressionValue] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Refs for Connection
  const connectionRef = useRef<DeviceConnection | null>(null);

  // Error handling
  const showError = useCallback((message: string) => {
    setError(message);
    console.error(message);
    setTimeout(() => setError(null), 6000);
  }, []);

  // MIDI Message Handler
  const handleMidiMessage = useCallback((data: Uint8Array) => {
    const [status, data1, data2] = data;
    const messageType = status & 0xF0;

    // Control Change (0xB0)
    if (messageType === 0xB0) {
      const ccNumber = data1;
      const value = data2;

      console.log(`📥 Received CC${ccNumber} = ${value} (${value >= 64 ? 'ON' : 'OFF'})`);

      // Update CC State
      if (Object.prototype.hasOwnProperty.call(DEFAULT_CC_STATE, ccNumber)) {
        const isOn = value >= 64;
        setCcState((prev: CCState) => ({
          ...prev,
          [ccNumber]: isOn
        }));
      }

      // Expression Pedal
      if (ccNumber === CC.EXPRESSION) {
        setExpressionValue(value);
      }
    }
    // Program Change (0xC0)
    else if (messageType === 0xC0) {
      const presetNumber = data1;
      console.log(`📥 Received Preset Change: ${presetNumber + 1}`);
      if (presetNumber >= 0 && presetNumber < 64) {
        setCurrentPreset(presetNumber);
      }
    }
  }, []);

  // Connect
  const connect = async (type: 'usb' | 'bluetooth') => {
    setError(null);
    setIsConnecting(true);
    
    // Disconnect existing
    if (connectionRef.current) {
        connectionRef.current.disconnect();
        connectionRef.current = null;
        setIsConnected(false);
    }

    try {
        let connection: DeviceConnection;
        
        if (type === 'bluetooth') {
            connection = new BluetoothMidiConnection();
        } else {
            if (window.location.protocol === 'file:') {
                throw new Error('Cannot use WebMIDI on file:// protocol.');
            }
            connection = new WebMidiConnection();
        }

        await connection.connect();
        
        connection.onMessage(handleMidiMessage);
        
        connectionRef.current = connection;
        setDeviceName(connection.name);
        setIsConnected(true);
        console.log(`🎹 Connection established via ${type}`);

    } catch (err: unknown) {
        if (err instanceof Error) {
            if (err.message.includes('permissions policy')) {
                showError('⚠️ MIDI blocked by permissions policy.');
            } else {
                showError(`Connection failed: ${err.message}`);
            }
        } else {
            showError('Connection failed: Unknown error');
        }
    } finally {
        setIsConnecting(false);
    }
  };

  // Send CC
  const sendCC = useCallback((ccNumber: number, value: number) => {
    if (!connectionRef.current) {
      return;
    }
    try {
      connectionRef.current.send([0xB0, ccNumber, value]);
      console.log(`📤 Sent CC${ccNumber} = ${value}`);
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error(`Failed to send CC: ${err.message}`);
        }
    }
  }, []);

  // Send Program Change
  const switchPreset = useCallback((presetNumber: number) => {
    // Always update local state for responsiveness
    setCurrentPreset(presetNumber);

    if (connectionRef.current) {
        try {
            connectionRef.current.send([0xC0, presetNumber]);
            console.log(`📤 Sent Preset Change: ${presetNumber + 1}`);
        } catch (err: unknown) {
             if (err instanceof Error) {
                showError(`Failed to send MIDI message: ${err.message}`);
             }
        }
    }
  }, [showError]);

  // Handlers
  const handleToggleCC = (ccNumber: number) => {
    const newState = !ccState[ccNumber];
    // Update local state immediately
    setCcState((prev: CCState) => ({
        ...prev,
        [ccNumber]: newState
    }));
    // Send MIDI
    sendCC(ccNumber, newState ? 127 : 0);
  };

  const handleTapTempo = () => {
    // Tap tempo sends 127
    sendCC(CC.TAP, 127);
  };

  const handleExpressionChange = (value: number) => {
    setExpressionValue(value);
    sendCC(CC.EXPRESSION, value);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!connectionRef.current) return;

      const key = parseInt(e.key);
      if (!isNaN(key) && key >= 1 && key <= 9) {
        switchPreset(key - 1);
      } else if (e.key === 'ArrowLeft') {
        switchPreset(Math.max(0, currentPreset - 1));
      } else if (e.key === 'ArrowRight') {
        switchPreset(Math.min(63, currentPreset + 1));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPreset, switchPreset]);

  return (
    <div className="min-h-screen text-white bg-black font-primary">
      <Navigation 
        isConnected={isConnected} 
        deviceName={deviceName} 
        onConnect={connect}
        isConnecting={isConnecting}
      />

      <main className="min-h-screen pt-24 pb-16">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <Header />

            {/* Error Message */}
            <div 
                className={`mb-6 bg-[rgba(240,10,5,0.1)] border border-error text-[#ff6b6b] rounded-md transition-all duration-300 ease-out overflow-hidden ${error ? 'p-5 opacity-100 max-h-50' : 'p-0 opacity-0 max-h-0'}`}
            >
                {error}
            </div>

            <EffectControls 
                ccState={ccState}
                onToggleCC={handleToggleCC}
                onTapTempo={handleTapTempo}
                onExpressionChange={handleExpressionChange}
                expressionValue={expressionValue}
                isConnected={isConnected}
            />

            <PresetGrid 
                currentPreset={currentPreset}
                onSelectPreset={switchPreset}
                isConnected={isConnected}
            />

            <InfoBox />
            
            <Footer />
        </div>
      </main>
    </div>
  );
}

export default App;