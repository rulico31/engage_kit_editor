import { protocol as u, app as h, net as m, BrowserWindow as w, ipcMain as l, dialog as c } from "electron";
import i from "path";
import { fileURLToPath as v, pathToFileURL as P } from "url";
import * as f from "fs/promises";
const E = v(import.meta.url), g = i.dirname(E), R = process.env.VITE_DEV_SERVER_URL !== void 0;
u.registerSchemesAsPrivileged([
  { scheme: "engage", privileges: { secure: !0, standard: !0, supportFetchAPI: !0, stream: !0 } }
]);
let e;
function _() {
  if (e = new w({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: i.join(g, "preload.js"),
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !1,
      // 開発中はfalse推奨ですが、本番ではtrueにしてカスタムプロトコルのみ許可するのがベスト
      sandbox: !1
    }
  }), l.handle("save-project-file", async (t, n, o, a) => {
    if (!e) return { success: !1 };
    let s = o;
    if (!s)
      try {
        const r = a ? `${a}.engage` : "New Project.engage", { canceled: p, filePath: d } = await c.showSaveDialog(e, {
          title: "EngageKit プロジェクトを保存",
          defaultPath: i.join(h.getPath("documents"), r),
          filters: [
            { name: "EngageKit Project", extensions: ["engage"] }
          ]
        });
        if (p || !d)
          return { success: !1 };
        s = d;
      } catch (r) {
        return console.error("保存ダイアログエラー:", r), { success: !1, error: String(r) };
      }
    try {
      return await f.writeFile(s, n, "utf-8"), { success: !0, filePath: s };
    } catch (r) {
      return console.error("ファイル保存エラー:", r), { success: !1, error: String(r) };
    }
  }), l.handle("open-project-file", async (t) => {
    if (!e) return null;
    try {
      const { canceled: n, filePaths: o } = await c.showOpenDialog(e, {
        title: "EngageKit プロジェクトを開く",
        properties: ["openFile"],
        filters: [
          { name: "EngageKit Project", extensions: ["engage"] }
        ]
      });
      if (n || o.length === 0)
        return null;
      const a = o[0];
      return { data: await f.readFile(a, "utf-8"), filePath: a };
    } catch (n) {
      return console.error("ファイル読込エラー:", n), null;
    }
  }), l.handle("select-image-file", async () => {
    if (!e) return null;
    const { canceled: t, filePaths: n } = await c.showOpenDialog(e, {
      title: "画像を選択",
      filters: [{ name: "Images", extensions: ["jpg", "png", "gif", "webp", "svg"] }],
      properties: ["openFile"]
    });
    return t || n.length === 0 ? null : n[0];
  }), R)
    console.log("[Main] 開発モード: Dev Serverから読み込みます"), e.loadURL(process.env.VITE_DEV_SERVER_URL), e.webContents.openDevTools();
  else {
    console.log("[Main] 本番モード: ビルド済みファイルから読み込みます");
    const t = i.join(g, "../index.html");
    console.log("[Main] __dirname:", g), console.log("[Main] index.htmlのパス:", t), e.loadFile(t), e.webContents.openDevTools();
  }
  e.webContents.on("did-finish-load", () => {
    console.log("[Main] ページの読み込みが完了しました");
  }), e.webContents.on("did-fail-load", (t, n, o) => {
    console.error("[Main] ページの読み込みに失敗:", n, o);
  }), e.webContents.on("console-message", (t, n, o, a, s) => {
    console.log(`[Renderer Console] ${o}`);
  });
}
h.whenReady().then(() => {
  u.handle("engage", (t) => {
    const n = t.url.slice(9);
    return m.fetch(P(decodeURIComponent(n)).toString());
  }), _();
});
