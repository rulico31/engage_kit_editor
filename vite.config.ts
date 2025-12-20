// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron' // ★追加
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    // ★追加: Electronのビルド設定
    electron([
      {
        // Main process のエントリポイント
        entry: 'electron/main.ts',
      },
      {
        // Preload script のエントリポイント
        entry: 'electron/preload.ts',
        onstart(options) {
          // Preloadスクリプトの変更時にリロードを通知
          options.reload()
        },
      },
    ]),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        viewer: resolve(__dirname, 'viewer.html'),
      },
    },
  },
})