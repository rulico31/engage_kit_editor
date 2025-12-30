// electron/main.ts
import { app, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron' // ★protocol, net を追加
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url' // ★pathToFileURL を追加
import * as fs from 'fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const isDev = process.env.VITE_DEV_SERVER_URL !== undefined

// ★プロトコルの登録（アプリ起動前に行う必要があるためここで定義）
protocol.registerSchemesAsPrivileged([
    { scheme: 'engage', privileges: { secure: true, standard: true, supportFetchAPI: true, stream: true } }
])

let mainWindow: BrowserWindow | null

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false, // 開発中はfalse推奨ですが、本番ではtrueにしてカスタムプロトコルのみ許可するのがベスト
            sandbox: false,
        },
    })

    // --- IPCハンドラ ---

    // --- ★IPCハンドラの登録 (ここから) ---
    // --- ★IPCハンドラの登録 (ここから) ---
    ipcMain.handle('save-project-file', async (event, data: string, filePath?: string, projectName?: string) => {
        if (!mainWindow) return { success: false };

        let targetPath = filePath;

        // パスが渡されていない場合（初回保存、または「名前を付けて保存」）のみダイアログを出す
        if (!targetPath) {
            try {
                // プロジェクト名が渡されていればそれを使用、なければデフォルト名
                const defaultFileName = projectName ? `${projectName}.engage` : 'New Project.engage';
                const { canceled, filePath: selectedPath } = await dialog.showSaveDialog(mainWindow, {
                    title: 'EngageKit プロジェクトを保存',
                    defaultPath: path.join(app.getPath('documents'), defaultFileName),
                    filters: [
                        { name: 'EngageKit Project', extensions: ['engage'] },
                    ]
                });

                if (canceled || !selectedPath) {
                    return { success: false }; // キャンセルされた
                }
                targetPath = selectedPath;
            } catch (error) {
                console.error('保存ダイアログエラー:', error);
                return { success: false, error: String(error) };
            }
        }

        try {
            await fs.writeFile(targetPath, data, 'utf-8');
            return { success: true, filePath: targetPath };
        } catch (error: any) {
            console.error('ファイル保存エラー:', error);
            // エラーが発生した場合（パスが無効など）、失敗を返す
            // Renderer側でこれを検知して、再度ダイアログを出すなどのフォールバックを行う想定
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle('open-project-file', async (event) => {
        if (!mainWindow) return null;

        try {
            const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
                title: 'EngageKit プロジェクトを開く',
                properties: ['openFile'],
                filters: [
                    { name: 'EngageKit Project', extensions: ['engage'] },
                ]
            });

            if (canceled || filePaths.length === 0) {
                return null; // キャンセルされた
            }

            const filePath = filePaths[0];
            const data = await fs.readFile(filePath, 'utf-8');
            // パス情報も返す
            return { data, filePath };

        } catch (error) {
            console.error('ファイル読込エラー:', error);
            return null;
        }
    });
    // --- ★IPCハンドラの登録 (ここまで) ---

    // ★追加: 画像選択ダイアログを開くハンドラ
    ipcMain.handle('select-image-file', async () => {
        if (!mainWindow) return null;
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            title: '画像を選択',
            filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp', 'svg'] }],
            properties: ['openFile']
        });
        if (canceled || filePaths.length === 0) return null;
        return filePaths[0]; // 選択された画像のフルパスを返す
    });

    if (isDev) {
        console.log('[Main] 開発モード: Dev Serverから読み込みます')
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL as string)
        mainWindow.webContents.openDevTools()
    } else {
        console.log('[Main] 本番モード: ビルド済みファイルから読み込みます')
        // パッケージング後は __dirname が resources/app.asar/dist-electron になるため
        // index.htmlは dist-electron から見て ../index.html にある
        const indexPath = path.join(__dirname, '../index.html')
        console.log('[Main] __dirname:', __dirname)
        console.log('[Main] index.htmlのパス:', indexPath)
        mainWindow.loadFile(indexPath)
        // ★デバッグ用：本番ビルドでも開発者ツールを開く
        mainWindow.webContents.openDevTools()
    }

    // ★ページ読み込み完了時のログ
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('[Main] ページの読み込みが完了しました')
    })

    // ★ページ読み込み失敗時のログ
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('[Main] ページの読み込みに失敗:', errorCode, errorDescription)
    })

    // ★コンソールメッセージをメインプロセスにも表示
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log(`[Renderer Console] ${message}`)
    })
}

app.whenReady().then(() => {
    // ★engage:// プロトコルの処理を定義
    protocol.handle('engage', (request) => {
        // URL "engage://C:/path/to/image.png" を "file:///C:/path/to/image.png" に変換
        const filePath = request.url.slice('engage://'.length);
        // Windowsの場合、パスの先頭のスラッシュ調整が必要な場合があるため fileURLToPath などを使うのが安全ですが
        // 今回はシンプルに net.fetch で file:// URL を叩きます
        return net.fetch(pathToFileURL(decodeURIComponent(filePath)).toString());
    });

    createWindow();
})
