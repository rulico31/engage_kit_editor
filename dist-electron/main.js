import { protocol as d, app as h, net as m, BrowserWindow as w, ipcMain as l, dialog as c } from "electron";
import s from "path";
import { fileURLToPath as P, pathToFileURL as v } from "url";
import * as f from "fs/promises";
const E = P(import.meta.url), u = s.dirname(E), R = process.env.VITE_DEV_SERVER_URL !== void 0;
d.registerSchemesAsPrivileged([
  { scheme: "engage", privileges: { secure: !0, standard: !0, supportFetchAPI: !0, stream: !0 } }
]);
let t;
function _() {
  t = new w({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: s.join(u, "preload.js"),
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !1,
      // 開発中はfalse推奨ですが、本番ではtrueにしてカスタムプロトコルのみ許可するのがベスト
      sandbox: !1
    }
  }), l.handle("save-project-file", async (r, e, o, a) => {
    if (!t) return { success: !1 };
    let i = o;
    if (!i)
      try {
        const n = a ? `${a}.engage` : "New Project.engage", { canceled: p, filePath: g } = await c.showSaveDialog(t, {
          title: "EngageKit プロジェクトを保存",
          defaultPath: s.join(h.getPath("documents"), n),
          filters: [
            { name: "EngageKit Project", extensions: ["engage"] }
          ]
        });
        if (p || !g)
          return { success: !1 };
        i = g;
      } catch (n) {
        return console.error("保存ダイアログエラー:", n), { success: !1, error: String(n) };
      }
    try {
      return await f.writeFile(i, e, "utf-8"), { success: !0, filePath: i };
    } catch (n) {
      return console.error("ファイル保存エラー:", n), { success: !1, error: String(n) };
    }
  }), l.handle("open-project-file", async (r) => {
    if (!t) return null;
    try {
      const { canceled: e, filePaths: o } = await c.showOpenDialog(t, {
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
    if (!t) return null;
    const { canceled: r, filePaths: e } = await c.showOpenDialog(t, {
      title: "画像を選択",
      filters: [{ name: "Images", extensions: ["jpg", "png", "gif", "webp", "svg"] }],
      properties: ["openFile"]
    });
    return r || e.length === 0 ? null : e[0];
  }), R ? (t.loadURL(process.env.VITE_DEV_SERVER_URL), t.webContents.openDevTools()) : t.loadFile(s.join(u, "../dist/index.html"));
}
h.whenReady().then(() => {
  d.handle("engage", (r) => {
    const e = r.url.slice(9);
    return m.fetch(v(decodeURIComponent(e)).toString());
  }), _();
});
