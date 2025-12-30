import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import { resolve } from 'path'

export default defineConfig({
  // ★★★ ここが最重要！これがないと真っ白になります ★★★
  base: './', 
  
  plugins: [
    react(),
    electron([
      {
        // Main process のエントリポイント
        entry: 'electron/main.ts',
      },
      {
        // Preload script のエントリポイント
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload()
        },
      },
    ]),
  ],
  build: {
    // ビューワーとエディタを同時にビルドするための設定
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        viewer: resolve(__dirname, 'viewer.html'), 
      },
    },
  },
})