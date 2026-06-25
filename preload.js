const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("priorityPlannerUpdates", {
  onProgress(callback) {
    if (typeof callback !== "function") {
      return function () {};
    }

    const listener = function (_event, payload) {
      callback(payload);
    };

    ipcRenderer.on("update-progress", listener);

    return function () {
      ipcRenderer.removeListener("update-progress", listener);
    };
  }
});
