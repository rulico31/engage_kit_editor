import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  return {
    base: '/',
    plugins: [react()],
    server: {
      host: true,  // LAN内の他デバイスからアクセス可能にする
    },
    esbuild: {
      // 本番ビルド時のみconsoleとdebuggerを削除
      drop: mode === 'production' ? ['console', 'debugger'] : [],
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
  }
})