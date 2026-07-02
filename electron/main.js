const path = require("path");
let isQuiting = false;

require("dotenv").config({
  path: path.join(__dirname, "..", ".env")
});

console.log("ENV FILE:", path.join(__dirname, "..", ".env"));
console.log("ENV SECRET:", process.env.AGENT_SECRET);

const { app, BrowserWindow } = require("electron");
const { createTray } = require("./tray");
const queueManager = require("./queueManager");

let mainWindow;

function createWindow() {

  mainWindow = new BrowserWindow({

    width: 800,

    height: 600,
    show:false,

    title: "PrintFlow Agent",

    webPreferences: {

      nodeIntegration: true,

      contextIsolation: false

    }

  });

  mainWindow.loadURL(

    "data:text/html,<html><body style='font-family:Arial;padding:30px'><h1>PrintFlow Agent Running</h1><p>Waiting for print jobs...</p></body></html>"

  );

mainWindow.on("close", (e) => {

  if (!isQuiting) {

    e.preventDefault();

    mainWindow.hide();

  }

});

}

app.whenReady().then(async () => {

  app.setLoginItemSettings({

    openAtLogin: true,

    openAsHidden: true

  });

  createWindow();
 if (process.platform === "darwin" && app.dock) {

  app.dock.hide();

}

  createTray();

  try {
    await queueManager.start();
    console.log("PrintFlow Queue Manager Started");
  } catch (err) {
    console.error("Queue Manager Error:", err);
  }
});

app.on("before-quit", () => {

  isQuiting = true;

  queueManager.stop();

});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {

  if (mainWindow) {

    mainWindow.show();

  }

});