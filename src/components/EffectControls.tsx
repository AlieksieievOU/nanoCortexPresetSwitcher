import React from 'react';
import { CC } from '../constants';

interface EffectControlsProps {
  ccState: Record<number, boolean>;
  onToggleCC: (ccNumber: number) => void;
  onTapTempo: () => void;
  onExpressionChange: (value: number) => void;
  expressionValue: number;
  isConnected: boolean;
}

export const EffectControls: React.FC<EffectControlsProps> = ({
  ccState,
  onToggleCC,
  onTapTempo,
  onExpressionChange,
  expressionValue,
  isConnected
}) => {
  return (
    <div className="section-card">
      <h2 className="flex items-center gap-3 mb-6 text-2xl font-bold text-neural-n100">
        Effect & Utility Controls
      </h2>
      
      {/* Utilities */}
      <div className="mb-8">
         <h3 className="mb-3 text-lg font-semibold text-neural-n90">Utility</h3>
         <div className="flex flex-wrap gap-3">
            <button 
                className="btn-quick" 
                onMouseDown={onTapTempo}
                disabled={!isConnected}
            >
                Tap Tempo
            </button>
            <button 
                className={`btn-quick ${ccState[CC.TUNER] ? 'active-state' : ''}`}
                onClick={() => onToggleCC(CC.TUNER)}
                disabled={!isConnected}
            >
                Tuner
            </button>
         </div>
      </div>

      {/* Bypass Slots */}
      <div className="mb-8">
        <h3 className="mb-3 text-lg font-semibold text-neural-n90">Bypass Slots</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <BypassButton label="Input Gate" cc={CC.GATE} state={ccState} onClick={onToggleCC} disabled={!isConnected} />
            <BypassButton label="Capture" cc={CC.CAPTURE} state={ccState} onClick={onToggleCC} disabled={!isConnected} />
            <BypassButton label="Cab/IR" cc={CC.CAB} state={ccState} onClick={onToggleCC} disabled={!isConnected} />
            <BypassButton label="FX Slot 1" cc={CC.FX1} state={ccState} onClick={onToggleCC} disabled={!isConnected} />
            <BypassButton label="FX Slot 2" cc={CC.FX2} state={ccState} onClick={onToggleCC} disabled={!isConnected} />
            <BypassButton label="FX Slot 3" cc={CC.FX3} state={ccState} onClick={onToggleCC} disabled={!isConnected} />
            <BypassButton label="FX Slot 4" cc={CC.FX4} state={ccState} onClick={onToggleCC} disabled={!isConnected} />
            <BypassButton label="FX Slot 5" cc={CC.FX5} state={ccState} onClick={onToggleCC} disabled={!isConnected} />
        </div>
      </div>

      {/* Expression */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-neural-n90">Expression Pedal</h3>
        <div className="relative pt-1">
            <input 
                type="range" 
                min="0" 
                max="127" 
                value={expressionValue} 
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-neural-n40"
                onChange={(e) => onExpressionChange(parseInt(e.target.value))}
                disabled={!isConnected}
            />
            <div className="flex justify-between mt-2 text-xs text-neural-n80">
                <span>Heel (0)</span>
                <span>Toe (127)</span>
            </div>
        </div>
      </div>
    </div>
  );
};

const BypassButton = ({ 
    label, 
    cc, 
    state, 
    onClick,
    disabled
}: { 
    label: string, 
    cc: number, 
    state: Record<number, boolean>, 
    onClick: (cc: number) => void,
    disabled: boolean
}) => (
    <button 
        className={`btn-quick ${state[cc] ? 'active-state' : ''}`}
        onClick={() => onClick(cc)}
        disabled={disabled}
    >
        {label}
    </button>
);