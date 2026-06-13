const { app, BrowserWindow, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 620,
    backgroundColor: "#eaf6ff",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile("index.html");
  return mainWindow;
}

function configureAutoUpdates(mainWindow) {
  if (!app.isPackaged) {
    return;
  }

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-available", async (info) => {
    const result = await dialog.showMessageBox(mainWindow, {
      type: "info",
      buttons: ["下载更新", "稍后再说"],
      defaultId: 0,
      cancelId: 1,
      title: "发现新版本",
      message: `Priority Planner ${info.version} 已发布`,
      detail: "是否现在下载更新？下载期间可以继续使用软件。"
    });

    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });

  autoUpdater.on("update-downloaded", async (info) => {
    const result = await dialog.showMessageBox(mainWindow, {
      type: "info",
      buttons: ["重启并安装", "稍后安装"],
      defaultId: 0,
      cancelId: 1,
      title: "更新已下载",
      message: `Priority Planner ${info.version} 已准备完成`,
      detail: "重启软件即可完成更新，现有任务数据不会被删除。"
    });

    if (result.response === 0) {
      autoUpdater.quitAndInstall(false, true);
    }
  });

  autoUpdater.on("error", (error) => {
    console.error("自动更新检查失败：", error);
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      console.error("无法检查自动更新：", error);
    });
  }, 3000);
}

app.whenReady().then(() => {
  const mainWindow = createWindow();
  configureAutoUpdates(mainWindow);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
