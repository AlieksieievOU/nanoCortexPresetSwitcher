import React from 'react';

interface PresetGridProps {
    currentPreset: number;
    onSelectPreset: (preset: number) => void;
    isConnected: boolean;
}

export const PresetGrid: React.FC<PresetGridProps> = ({ currentPreset, onSelectPreset, isConnected }) => {
    // Generate array [0..63]
    const presets = Array.from({ length: 64 }, (_, i) => i);


    const handlePrev = () => {
        onSelectPreset(Math.max(0, currentPreset - 1));
    };

    const handleNext = () => {
        onSelectPreset(Math.min(63, currentPreset + 1));
    };

    return (
        <div className="section-card">
            <h2 className="flex items-center gap-3 mb-6 text-2xl font-bold text-neural-n100">
                All Presets (0-63)
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-3 lg:grid-cols-5 ">
                <button
                    className="btn-quick"
                    onClick={handlePrev}
                    disabled={!isConnected || currentPreset === 0}
                >
                    <span className="inline-block mr-2">←</span> Previous
                </button>
                <button
                    className="btn-quick"
                    onClick={handleNext}
                    disabled={!isConnected || currentPreset === 63}
                >
                    Next <span className="inline-block ml-2">→</span>
                </button>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2 sm:gap-3">
                {presets.map((preset) => (
                    <button
                        key={preset}
                        className={`btn-preset ${currentPreset === preset ? 'active' : ''}`}
                        onClick={() => onSelectPreset(preset)}
                        disabled={!isConnected}
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-bold">{preset}</span>
                        </div>
                    </button>

                ))}
            </div>
        </div>
    );
};