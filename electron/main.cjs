const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'GameVault - Diário de Jogos Zerados',
    icon: path.join(__dirname, '../public/pwa-512x512.png'),
    backgroundColor: '#09090b',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    autoHideMenuBar: true
  });

  // Load production build or development URL
  const devUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL(devUrl);
  } else {
    const distPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(distPath).catch(() => {
      mainWindow.loadURL(devUrl);
    });
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
