const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("minecraftAPI", {
  getStats: () => ipcRenderer.invoke("get-stats"),

  importStats: (folderPath) => ipcRenderer.invoke("import-stats", folderPath),
  
  onStatsFolderSelected: (callback) => {
    ipcRenderer.on("stats-folder-selected", (_event, folder) => {
      callback(folder);
    });
  },

  restartApp: () => ipcRenderer.invoke("restart"),

  //next ones here
});