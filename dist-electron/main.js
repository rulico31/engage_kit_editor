import { protocol, app, net, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import * as fs from "fs/promises";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.VITE_DEV_SERVER_URL !== void 0;
protocol.registerSchemesAsPrivileged([
  { scheme: "engage", privileges: { secure: true, standard: true, supportFetchAPI: true, stream: true } }
]);
let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      // 開発中はfalse推奨ですが、本番ではtrueにしてカスタムプロトコルのみ許可するのがベスト
      sandbox: false
    }
  });
  ipcMain.handle("save-project-file", async (event, data, filePath, projectName) => {
    if (!mainWindow) return { success: false };
    let targetPath = filePath;
    if (!targetPath) {
      try {
        const defaultFileName = projectName ? `${projectName}.engage` : "New Project.engage";
        const { canceled, filePath: selectedPath } = await dialog.showSaveDialog(mainWindow, {
          title: "EngageKit プロジェクトを保存",
          defaultPath: path.join(app.getPath("documents"), defaultFileName),
          filters: [
            { name: "EngageKit Project", extensions: ["engage"] }
          ]
        });
        if (canceled || !selectedPath) {
          return { success: false };
        }
        targetPath = selectedPath;
      } catch (error) {
        console.error("保存ダイアログエラー:", error);
        return { success: false, error: String(error) };
      }
    }
    try {
      await fs.writeFile(targetPath, data, "utf-8");
      return { success: true, filePath: targetPath };
    } catch (error) {
      console.error("ファイル保存エラー:", error);
      return { success: false, error: String(error) };
    }
  });
  ipcMain.handle("open-project-file", async (event) => {
    if (!mainWindow) return null;
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: "EngageKit プロジェクトを開く",
        properties: ["openFile"],
        filters: [
          { name: "EngageKit Project", extensions: ["engage"] }
        ]
      });
      if (canceled || filePaths.length === 0) {
        return null;
      }
      const filePath = filePaths[0];
      const data = await fs.readFile(filePath, "utf-8");
      return { data, filePath };
    } catch (error) {
      console.error("ファイル読込エラー:", error);
      return null;
    }
  });
  ipcMain.handle("select-image-file", async () => {
    if (!mainWindow) return null;
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: "画像を選択",
      filters: [{ name: "Images", extensions: ["jpg", "png", "gif", "webp", "svg"] }],
      properties: ["openFile"]
    });
    if (canceled || filePaths.length === 0) return null;
    return filePaths[0];
  });
  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}
app.whenReady().then(() => {
  protocol.handle("engage", (request) => {
    const filePath = request.url.slice("engage://".length);
    return net.fetch(pathToFileURL(decodeURIComponent(filePath)).toString());
  });
  createWindow();
});
