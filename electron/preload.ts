// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron'

// React側から呼び出すためのAPIを定義
contextBridge.exposeInMainWorld('electronAPI', {
    /**
     * ローカルにファイルを保存する
     * @param data - 保存するJSON文字列
     * @param filePath - (Optional) 上書き保存先のパス
     * @param projectName - (Optional) プロジェクト名（デフォルトファイル名に使用）
     * @returns 保存結果オブジェクト { success, filePath, error }
     */
    saveProjectFile: (data: string, filePath?: string, projectName?: string): Promise<{ success: boolean; filePath?: string; error?: string }> =>
        ipcRenderer.invoke('save-project-file', data, filePath, projectName),

    /**
     * ローカルファイルを開くダイアログを表示し、ファイルの内容を読み込む
     * @returns 読み込んだデータとパス、または失敗した場合は null
     */
    openProjectFile: (): Promise<{ data: string; filePath: string } | null> =>
        ipcRenderer.invoke('open-project-file'),

    // ★追加: 画像選択
    selectImageFile: () => ipcRenderer.invoke('select-image-file'),
})

// TypeScriptの型定義ファイルを用意（React側で使うため）
// ※このファイルはプロジェクトルートに手動で作成します (Step 3)
export type ElectronAPI = {
    saveProjectFile: (data: string) => Promise<boolean>;
    openProjectFile: () => Promise<string | null>;

}