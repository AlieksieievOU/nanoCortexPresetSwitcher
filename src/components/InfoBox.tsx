import React from 'react';

export const InfoBox: React.FC = () => {
  return (
    <div className="info-box">
        <h3>Setup Instructions</h3>
        <ul className="mb-6">
            <li>Connect your Nano Cortex to your computer via USB-C</li>
            <li>Click "Connect to Nano Cortex" and select your device</li>
            <li>Click any preset button to switch (presets 1-64)</li>
            <li>Use keyboard numbers 1-9 for quick preset access</li>
            <li>Use arrow keys ← → to navigate presets</li>
            <li>Works in Chrome, Edge, and Opera (WebMIDI API required)</li>
            <li>Known issue: Bypass Slots toggling from the 2nd time...still figuring this out</li>
        </ul>
        <a 
            className="inline-block mt-6 btn-connect" 
            href="https://neuraldsp.com/manual/nano-cortex#Incoming-MIDI-CC-List" 
            target="_blank"
            rel="noreferrer"
        >
            Official Neural Dsp Nano Cortex Midi manual
        </a> 
    </div>
  );
};
