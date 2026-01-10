import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  plugins: [react()],
  esbuild: {
    drop: ['console', 'debugger'],
  },
  optimizeDeps: {
    include: ['ua-parser-js'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false, // 本番環境ではソースコードを隠す
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        viewer: resolve(__dirname, 'viewer.html'),
      },
    },
  },
})