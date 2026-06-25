const path = require("path");
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
      preload: path.join(__dirname, "preload.js"),
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

  const sendUpdateProgress = function (payload) {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-progress", payload);
    }
  };

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
      sendUpdateProgress({
        percent: 0,
        status: "downloading"
      });
      mainWindow.setProgressBar(0);
      autoUpdater.downloadUpdate().catch((error) => {
        mainWindow.setProgressBar(-1);
        sendUpdateProgress({
          message: "更新下载失败",
          status: "error"
        });
        console.error("Update download failed:", error);
      });
    }
  });

  autoUpdater.on("download-progress", (progress) => {
    const percent = Math.max(0, Math.min(100, progress.percent || 0));

    mainWindow.setProgressBar(percent / 100);
    sendUpdateProgress({
      bytesPerSecond: progress.bytesPerSecond,
      percent,
      status: "downloading",
      total: progress.total,
      transferred: progress.transferred
    });
  });

  autoUpdater.on("update-downloaded", async (info) => {
    mainWindow.setProgressBar(-1);
    sendUpdateProgress({
      message: "更新已下载，等待安装",
      percent: 100,
      status: "downloaded"
    });

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
    mainWindow.setProgressBar(-1);
    sendUpdateProgress({
      message: "更新检查失败",
      status: "error"
    });
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
