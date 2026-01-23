import React, { useEffect, useState } from 'react';

interface NavigationProps {
  isConnected: boolean;
  deviceName: string;
  onConnect: (type: 'usb' | 'bluetooth') => void;
  isConnecting: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  isConnected, 
  onConnect,
  isConnecting,
  deviceName
}) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
        setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
        className="sticky top-0 left-0 right-0 z-50 border-b border-neural-n40 backdrop-blur-[10px] transition-colors duration-300"
        style={{
            background: scrolled ? 'rgba(0, 0, 0, 0.98)' : 'rgba(0, 0, 0, 0.95)'
        }}
    >
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-6">
          
          {/* Status and Connect Button */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Status Indicator */}
            <div className="items-center hidden gap-3 sm:flex">
              <span className={`status-dot ${isConnected ? 'connected' : ''}`}></span>
              <span className="text-sm font-medium text-neural-n100">
                {isConnected ? `Connected: ${deviceName}` : 'Not connected'}
              </span>
            </div>
            
            {/* Connect Buttons */}
            {!isConnected ? (
              <div className="flex gap-2">
                <button 
                  onClick={() => onConnect('usb')}
                  disabled={isConnecting}
                  className="text-sm btn-connect md:text-base"
                  title="Connect via USB MIDI"
                >
                  {isConnecting ? '...' : 'USB'}
                </button>
                <button 
                  onClick={() => onConnect('bluetooth')}
                  disabled={isConnecting}
                  className="text-sm btn-connect md:text-base"
                  title="Connect via Bluetooth MIDI"
                >
                  {isConnecting ? '...' : 'BLE'}
                </button>
              </div>
            ) : (
              <button 
                className="text-sm btn-connect md:text-base cursor-default"
              >
                Connected ✓
              </button>
            )}
          </div>

          {/* Link */}
          <div className="shrink-0">
            <span className="hidden px-6 sm:inline text-neural-n80">I'm unemployed, please buy my song on</span> 
            <a 
              target="_blank" 
              href="https://projectlira.bandcamp.com/track/i-dwell" 
              className="text-sm btn-connect md:text-base"
              rel="noreferrer"
            > 
              Bandcamp
            </a>  
          </div>
          
        </div>
      </div>
    </nav>
  );
};