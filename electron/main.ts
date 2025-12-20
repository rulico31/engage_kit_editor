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
    ipcMain.handle('save-project-file', async (event, data: string) => {
        if (!mainWindow) return false;

        try {
            const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
                title: 'EngageKit プロジェクトを保存',
                defaultPath: path.join(app.getPath('documents'), 'New Project.engage'),
                filters: [
                    { name: 'EngageKit Project', extensions: ['engage'] },
                ]
            });

            if (canceled || !filePath) {
                return false; // キャンセルされた
            }

            await fs.writeFile(filePath, data, 'utf-8');
            return true;

        } catch (error) {
            console.error('ファイル保存エラー:', error);
            return false;
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
            return data; // ファイルの内容を返す

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
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL as string)
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    }
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
