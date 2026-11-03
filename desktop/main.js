const { app, BrowserWindow, Tray, Menu, Notification, ipcMain, shell, nativeImage } = require("electron");
const path = require("path");
const fs = require("fs");

const startHidden = process.argv.includes("--hidden");
let win = null, tray = null, timers = [], quitting = false;

if (!app.requestSingleInstanceLock()) { app.quit(); }
app.setAppUserModelId("br.modomissao.app"); // necessário pras notificações no Windows

function show() { if (!win) return; win.show(); win.focus(); }

function createWindow() {
  win = new BrowserWindow({
    width: 460, height: 860, minWidth: 360, minHeight: 500,
    backgroundColor: "#000000", autoHideMenuBar: true, show: !startHidden,
    title: "Modo Missão",
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
  });
  win.loadFile(path.join(__dirname, "www", "index.html"));
  // links externos (YouTube Music) abrem no navegador padrão
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: "deny" }; });
  win.webContents.on("will-navigate", (e, url) => { if (/^https?:/.test(url)) { e.preventDefault(); shell.openExternal(url); } });
  // fechar a janela só esconde: o app continua na bandeja cobrando as missões
  win.on("close", e => { if (!quitting) { e.preventDefault(); win.hide(); } });
}

function createTray() {
  tray = new Tray(nativeImage.createFromPath(path.join(__dirname, "build", "tray.png")));
  tray.setToolTip("Modo Missão");
  const menu = () => Menu.buildFromTemplate([
    { label: "Abrir Modo Missão", click: show },
    { label: "Iniciar com o Windows", type: "checkbox", checked: app.getLoginItemSettings().openAtLogin,
      click: item => app.setLoginItemSettings({ openAtLogin: item.checked, args: ["--hidden"] }) },
    { type: "separator" },
    { label: "Sair", click: () => { quitting = true; app.quit(); } }
  ]);
  tray.setContextMenu(menu());
  tray.on("click", show);
}

ipcMain.handle("schedule", (_e, list) => {
  timers.forEach(clearTimeout); timers = [];
  for (const n of Array.isArray(list) ? list : []) {
    const ms = n.at - Date.now();
    if (ms > 0 && ms < 2147483647) {
      timers.push(setTimeout(() => {
        if (!Notification.isSupported()) return;
        const nt = new Notification({ title: String(n.title), body: String(n.body), icon: path.join(__dirname, "build", "icon.png") });
        nt.on("click", show); nt.show();
      }, ms));
    }
  }
  return timers.length;
});

app.on("second-instance", show);
app.on("before-quit", () => { quitting = true; });
app.on("window-all-closed", () => { /* continua rodando na bandeja */ });

app.whenReady().then(() => {
  // na primeira execução, já liga "iniciar com o Windows" (dá pra desligar no ícone da bandeja)
  const flag = path.join(app.getPath("userData"), "primeira-execucao.ok");
  if (!fs.existsSync(flag)) {
    app.setLoginItemSettings({ openAtLogin: true, args: ["--hidden"] });
    try { fs.writeFileSync(flag, String(Date.now())); } catch (e) {}
  }
  createWindow();
  createTray();
});
