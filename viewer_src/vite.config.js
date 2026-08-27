import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [
    wasm()
  ],
  build: {
    outDir: '../app/static/viewer3d',
    emptyOutDir: true,
    target: 'es2022',
    lib: {
      entry: 'main.js',
      name: 'LiteVaultViewer',
      fileName: 'litevault-viewer',
      formats: ['es']
    }
  },
  worker: {
    plugins: () => [wasm()],
    format: 'es'
  },
  optimizeDeps: {
    exclude: ['nucleation', 'schematic-renderer']
  }
});
