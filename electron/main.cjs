const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { opendir } = require("node:fs");
const { resourceLimits } = require("node:worker_threads");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const minecraftPath = path.join(
    app.getPath("appData"),
    ".minecraft",
    "saves"
  );

  win.loadURL("http://localhost:5173");

  win.webContents.once("did-finish-load", async () => {
  
    const result = await dialog.showOpenDialog(win, {
    title: "Select Minecraft Stats Folder",
    defaultPath: minecraftPath,
    properties: ["openDirectory"]
  });

  if (!result.canceled) {
    win.webContents.send("stats-folder-selected", result.filePaths[0]);
  }
});
}

app.whenReady().then(() => {

  ipcMain.handle("select-stats-folder", async () => {
    const result = await dialog.showOpenDialog({
      title: "Pick Statistics Folder",
      properties: ["openDirectory"]
    });

    if (result.canceled) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle("import-stats", async (_event, folderPath) => {
  const scriptPath = path.join(app.getAppPath(), "python", "stats_extract.py");

  return new Promise((resolve, reject) => {
    execFile(
      "python",
      [scriptPath, folderPath],
      { cwd: app.getAppPath() },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }

        console.log(stdout);
        resolve(stdout);
      }
    );
  });
});

  ipcMain.handle("get-stats", () => {
    const dbPath = path.join(app.getAppPath(), "minecraft_stats.db");
    const db = new DatabaseSync(dbPath);

    try {
      return db.prepare(`
        SELECT player_uuid, category, statistic, value
        FROM player_stats
        ORDER BY value DESC
        LIMIT 100
      `).all();
    } finally {
      db.close();
    }
  });

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});