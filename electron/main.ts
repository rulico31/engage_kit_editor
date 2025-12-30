// electron/main.ts
import { app, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import * as fs from 'fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const isDev = process.env.VITE_DEV_SERVER_URL !== undefined

// プロトコルの登録
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
            webSecurity: false,
            sandbox: false,
        },
    })

    // --- IPCハンドラ ---
    ipcMain.handle('save-project-file', async (event, data: string, filePath?: string, projectName?: string) => {
        if (!mainWindow) return { success: false };

        let targetPath = filePath;

        if (!targetPath) {
            try {
                const defaultFileName = projectName ? `${projectName}.engage` : 'New Project.engage';
                const { canceled, filePath: selectedPath } = await dialog.showSaveDialog(mainWindow, {
                    title: 'EngageKit プロジェクトを保存',
                    defaultPath: path.join(app.getPath('documents'), defaultFileName),
                    filters: [
                        { name: 'EngageKit Project', extensions: ['engage'] },
                    ]
                });

                if (canceled || !selectedPath) {
                    return { success: false };
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
                return null;
            }

            const filePath = filePaths[0];
            const data = await fs.readFile(filePath, 'utf-8');
            return { data, filePath };

        } catch (error) {
            console.error('ファイル読込エラー:', error);
            return null;
        }
    });

    ipcMain.handle('select-image-file', async () => {
        if (!mainWindow) return null;
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            title: '画像を選択',
            filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp', 'svg'] }],
            properties: ['openFile']
        });
        if (canceled || filePaths.length === 0) return null;
        return filePaths[0];
    });

    if (isDev) {
        console.log('[Main] 開発モード: Dev Serverから読み込みます')
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL as string)
        mainWindow.webContents.openDevTools()
    } else {
        console.log('[Main] 本番モード: ビルド済みファイルから読み込みます')
        
        // ★★★ ここが修正ポイント！ ★★★
        // 修正前: path.join(__dirname, '../index.html') 
        // 修正後: distフォルダの中を見るように変更
        const indexPath = path.join(__dirname, '../dist/index.html') 

        console.log('[Main] __dirname:', __dirname)
        console.log('[Main] index.htmlのパス:', indexPath)
        
        mainWindow.loadFile(indexPath)
    }

    mainWindow.webContents.on('did-finish-load', () => {
        console.log('[Main] ページの読み込みが完了しました')
    })

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('[Main] ページの読み込みに失敗:', errorCode, errorDescription)
    })

    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log(`[Renderer Console] ${message}`)
    })
}

app.whenReady().then(() => {
    protocol.handle('engage', (request) => {
        const filePath = request.url.slice('engage://'.length);
        return net.fetch(pathToFileURL(decodeURIComponent(filePath)).toString());
    });

    createWindow();
})