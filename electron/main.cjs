// Backend Controller //

const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");
const { execFile } = require("node:child_process");

function createWindow() {
  const win = new BrowserWindow({ // Create window
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const minecraftPath = path.join( // path for Minecraft folder
    app.getPath("appData"),
    ".minecraft",
    "saves"
  );

  win.loadURL("http://localhost:5173");

  win.webContents.once("did-finish-load", async () => { // auto-open minecraft worlds folder upon boot-up
  
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

app.whenReady().then(() => { // ready-to-go functions in the app

  ipcMain.handle("import-stats", async (_event, folderPath) => { // using stats_extract.py to import stats to db
  const scriptPath = path.join(app.getAppPath(), "python", "stats_extract.py");

  return new Promise((resolve, reject) => { // Promise to open the file once selected
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

  ipcMain.handle("get-stats", () => { // getting stats from the db and displaying them
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

  ipcMain.handle("restart", () => { // restart the app
    app.relaunch();
    app.quit();
});

  createWindow();
});

app.on("window-all-closed", () => { // shut down app if window is closed
  if (process.platform !== "darwin") app.quit();
});