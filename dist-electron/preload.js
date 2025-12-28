import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
  /**
   * ローカルにファイルを保存する
   * @param data - 保存するJSON文字列
   * @param filePath - (Optional) 上書き保存先のパス
   * @param projectName - (Optional) プロジェクト名（デフォルトファイル名に使用）
   * @returns 保存結果オブジェクト { success, filePath, error }
   */
  saveProjectFile: (data, filePath, projectName) => ipcRenderer.invoke("save-project-file", data, filePath, projectName),
  /**
   * ローカルファイルを開くダイアログを表示し、ファイルの内容を読み込む
   * @returns 読み込んだデータとパス、または失敗した場合は null
   */
  openProjectFile: () => ipcRenderer.invoke("open-project-file"),
  // ★追加: 画像選択
  selectImageFile: () => ipcRenderer.invoke("select-image-file")
});
