// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron'

// React側から呼び出すためのAPIを定義
contextBridge.exposeInMainWorld('electronAPI', {
    /**
     * ローカルにファイルを保存する
     * @param data - 保存するJSON文字列
     * @returns 保存が成功した場合は true
     */
    saveProjectFile: (data: string): Promise<boolean> =>
        ipcRenderer.invoke('save-project-file', data), // ★追加

    /**
     * ローカルファイルを開くダイアログを表示し、ファイルの内容を読み込む
     * @returns 読み込んだJSON文字列、または失敗した場合は null
     */
    openProjectFile: (): Promise<string | null> =>
        ipcRenderer.invoke('open-project-file'), // ★追加

    // ★追加: 画像選択
    selectImageFile: () => ipcRenderer.invoke('select-image-file'),
})

// TypeScriptの型定義ファイルを用意（React側で使うため）
// ※このファイルはプロジェクトルートに手動で作成します (Step 3)
export type ElectronAPI = {
    saveProjectFile: (data: string) => Promise<boolean>;
    openProjectFile: () => Promise<string | null>;

}