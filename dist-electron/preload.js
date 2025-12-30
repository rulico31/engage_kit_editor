import { contextBridge as l, ipcRenderer as e } from "electron";
l.exposeInMainWorld("electronAPI", {
  /**
   * ローカルにファイルを保存する
   * @param data - 保存するJSON文字列
   * @param filePath - (Optional) 上書き保存先のパス
   * @param projectName - (Optional) プロジェクト名（デフォルトファイル名に使用）
   * @returns 保存結果オブジェクト { success, filePath, error }
   */
  saveProjectFile: (o, i, r) => e.invoke("save-project-file", o, i, r),
  /**
   * ローカルファイルを開くダイアログを表示し、ファイルの内容を読み込む
   * @returns 読み込んだデータとパス、または失敗した場合は null
   */
  openProjectFile: () => e.invoke("open-project-file"),
  // ★追加: 画像選択
  selectImageFile: () => e.invoke("select-image-file")
});
