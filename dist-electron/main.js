import { protocol as u, app as h, net as m, BrowserWindow as w, ipcMain as l, dialog as c } from "electron";
import s from "path";
import { fileURLToPath as P, pathToFileURL as v } from "url";
import * as f from "fs/promises";
const E = P(import.meta.url), g = s.dirname(E), R = process.env.VITE_DEV_SERVER_URL !== void 0;
u.registerSchemesAsPrivileged([
  { scheme: "engage", privileges: { secure: !0, standard: !0, supportFetchAPI: !0, stream: !0 } }
]);
let n;
function _() {
  if (n = new w({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: s.join(g, "preload.js"),
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !1,
      sandbox: !1
    }
  }), l.handle("save-project-file", async (t, e, o, a) => {
    if (!n) return { success: !1 };
    let i = o;
    if (!i)
      try {
        const r = a ? `${a}.engage` : "New Project.engage", { canceled: p, filePath: d } = await c.showSaveDialog(n, {
          title: "EngageKit プロジェクトを保存",
          defaultPath: s.join(h.getPath("documents"), r),
          filters: [
            { name: "EngageKit Project", extensions: ["engage"] }
          ]
        });
        if (p || !d)
          return { success: !1 };
        i = d;
      } catch (r) {
        return console.error("保存ダイアログエラー:", r), { success: !1, error: String(r) };
      }
    try {
      return await f.writeFile(i, e, "utf-8"), { success: !0, filePath: i };
    } catch (r) {
      return console.error("ファイル保存エラー:", r), { success: !1, error: String(r) };
    }
  }), l.handle("open-project-file", async (t) => {
    if (!n) return null;
    try {
      const { canceled: e, filePaths: o } = await c.showOpenDialog(n, {
        title: "EngageKit プロジェクトを開く",
        properties: ["openFile"],
        filters: [
          { name: "EngageKit Project", extensions: ["engage"] }
        ]
      });
      if (e || o.length === 0)
        return null;
      const a = o[0];
      return { data: await f.readFile(a, "utf-8"), filePath: a };
    } catch (e) {
      return console.error("ファイル読込エラー:", e), null;
    }
  }), l.handle("select-image-file", async () => {
    if (!n) return null;
    const { canceled: t, filePaths: e } = await c.showOpenDialog(n, {
      title: "画像を選択",
      filters: [{ name: "Images", extensions: ["jpg", "png", "gif", "webp", "svg"] }],
      properties: ["openFile"]
    });
    return t || e.length === 0 ? null : e[0];
  }), R)
    console.log("[Main] 開発モード: Dev Serverから読み込みます"), n.loadURL(process.env.VITE_DEV_SERVER_URL), n.webContents.openDevTools();
  else {
    console.log("[Main] 本番モード: ビルド済みファイルから読み込みます");
    const t = s.join(g, "../dist/index.html");
    console.log("[Main] __dirname:", g), console.log("[Main] index.htmlのパス:", t), n.loadFile(t);
  }
  n.webContents.on("did-finish-load", () => {
    console.log("[Main] ページの読み込みが完了しました");
  }), n.webContents.on("did-fail-load", (t, e, o) => {
    console.error("[Main] ページの読み込みに失敗:", e, o);
  }), n.webContents.on("console-message", (t, e, o, a, i) => {
    console.log(`[Renderer Console] ${o}`);
  });
}
h.whenReady().then(() => {
  u.handle("engage", (t) => {
    const e = t.url.slice(9);
    return m.fetch(v(decodeURIComponent(e)).toString());
  }), _();
});
