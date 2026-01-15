import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createHtmlPlugin } from 'vite-plugin-html'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/nanoCortexPresetSwitcher/',
  plugins: [
    react(),
    tailwindcss(),
    createHtmlPlugin({
      minify: true,
    })
  ],
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  build: {
    minify: 'esbuild', 
    cssMinify: true,
  },
})