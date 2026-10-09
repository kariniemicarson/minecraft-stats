const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("minecraftAPI", {
  getStats: () => ipcRenderer.invoke("get-stats"),

  selectStatsFolder: () => ipcRenderer.invoke("select-stats-folder"),

  importStats: (folderPath) =>
    ipcRenderer.invoke("import-stats", folderPath),
  
  onStatsFolderSelected: (callback) => {
    ipcRenderer.on("stats-folder-selected", (_event, folder) => {
      callback(folder);
    });
  }

  //next ones here
});