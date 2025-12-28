/**
 * global.d.ts
 * アプリケーション全体で利用するグローバルな型定義を行います。
 * Windowインターフェースを拡張し、ElectronのIPC通信用API (electronAPI) の型を定義します。
 */

export { };

declare global {
    interface Window {
        electronAPI?: {
            /**
             * プロジェクトデータをローカルファイル(.engage)として保存します。
             * @param data 保存するプロジェクトデータのJSON文字列
             * @param filePath (Optional) 上書き保存先のパス。指定がない場合は「名前を付けて保存」ダイアログが表示されます。
             * @returns 保存結果オブジェクト { success, filePath, error }
             */
            saveProjectFile: (data: string, filePath?: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;

            /**
             * ローカルファイル(.engage)を開くダイアログを表示し、内容を読み込みます。
             * @returns 読み込んだデータとパスオブジェクト { data, filePath }、キャンセル時は null を返す Promise
             */
            openProjectFile: () => Promise<{ data: string; filePath: string } | null>;

            /**
             * ローカルの画像ファイルを選択するダイアログを表示します。
             * @returns 選択された画像の絶対パス、キャンセル時は null を返す Promise
             */
            selectImageFile: () => Promise<string | null>;
        };
    }
}