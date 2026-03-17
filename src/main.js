const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const updateElectronApp = require('update-electron-app');
const store = new Store();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  updateElectronApp({
    logger: console.log,
    updateInterval: '1 hour',
    notifyUser: true
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-client-id', async () => store.get('client_id'));
ipcMain.handle('set-client-id', async (e, id) => store.set('client_id', id));
// Add more IPC handlers as needed for your downloader logic