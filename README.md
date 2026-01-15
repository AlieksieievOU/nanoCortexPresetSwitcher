# Nano Cortex Preset Switcher

A web-based MIDI controller for the Nano Cortex, built with React, Vite, and WebMIDI. This application allows you to switch presets, toggle effects, and control parameters on your Nano Cortex device directly from your browser.

![Nano Cortex Preset Switcher](public/vite.svg)

## Features

- **Preset Management:** Instantly switch between presets 1-64.
- **Effect Control:** Toggle individual effects (Stomp, Amp, Cab, FX, etc.) on and off.
- **Real-time Feedback:** Two-way MIDI communication ensures the UI stays in sync with your physical device (changes on the device reflect in the app).
- **Expression Control:** Virtual expression pedal support.
- **Tap Tempo:** Set the tempo directly from the interface.
- **Keyboard Shortcuts:**
  - `1`-`9`: Select presets 1-9 directly.
  - `ArrowLeft` / `ArrowRight`: Navigate through presets.
- **Responsive Design:** Works beautifully on desktop and tablet.

## Prerequisites

- A **Nano Cortex** device.
- A WebMIDI-supported browser (Chrome, Edge, Opera). **Firefox and Safari do not support WebMIDI directly without polyfills.**
- **USB Connection:** Connect your Nano Cortex to your computer via USB.

## Installation & Running Locally

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd nanoCortexPresetSwitcher
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173` (or the port shown in your terminal).

## Usage

1. **Connect Device:** Click the "Connect MIDI" button in the top navigation bar.
2. **Select Device:** The app will automatically attempt to find a device named "Nano Cortex". If found, it will connect.
3. **Control:**
   - Click on preset buttons to change presets.
   - Click on effect blocks to toggle them.
   - Use the expression slider to control the assigned parameter.

## Technology Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS
- **MIDI:** WebMIDI API

## Troubleshooting

- **"WebMIDI is not supported":** Ensure you are using a Chromium-based browser (Chrome, Edge).
- **"No MIDI devices found":** Check your USB connection. Ensure the Nano Cortex is powered on.
- **"MIDI blocked by permissions policy":** You may need to allow MIDI permissions for the site in your browser settings.
- **Changes not reflecting:** Ensure no other software (like the official Cortex Cloud app) has exclusive control over the MIDI port, although WebMIDI often allows shared access on some OSs.

## License

MIT
