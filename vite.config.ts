import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'node:path';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    electron([
      {
        entry: 'src/main/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: ['electron', 'child_process', 'fs', 'path', 'os']
            }
          }
        }
      },
      {
        entry: 'src/preload/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron/preload'
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    reportCompressedSize: false,
    rollupOptions: {
      input: {
        frame: path.resolve(__dirname, 'frame.html'),
        toolbar: path.resolve(__dirname, 'toolbar.html'),
        overlay: path.resolve(__dirname, 'overlay.html'),
        main: path.resolve(__dirname, 'index.html'),
        hud: path.resolve(__dirname, 'hud.html'),
        region: path.resolve(__dirname, 'region.html'),
        webcam: path.resolve(__dirname, 'webcam.html'),
        preview: path.resolve(__dirname, 'preview.html')
      }
    }
  },
  server: {
    port: 5173
  }
});
