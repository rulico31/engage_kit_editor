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
             * @returns 保存が成功した場合は true、失敗またはキャンセルの場合は false を返す Promise
             */
            saveProjectFile: (data: string) => Promise<boolean>;

            /**
             * ローカルファイル(.engage)を開くダイアログを表示し、内容を読み込みます。
             * @returns 読み込んだファイルのJSON文字列、キャンセル時は null を返す Promise
             */
            openProjectFile: () => Promise<string | null>;

            /**
             * ローカルの画像ファイルを選択するダイアログを表示します。
             * @returns 選択された画像の絶対パス、キャンセル時は null を返す Promise
             */
            selectImageFile: () => Promise<string | null>;
        };
    }
}