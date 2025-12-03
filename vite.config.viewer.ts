import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        // エディタとは別の場所に出力する
        outDir: 'dist/viewer',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                // ビューワー専用のHTMLをエントリーポイントにする
                main: resolve(__dirname, 'viewer.html'),
            },
        },
    },
})