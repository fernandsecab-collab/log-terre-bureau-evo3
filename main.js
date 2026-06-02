const { app, BrowserWindow, shell, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 920,
    minWidth: 1050,
    minHeight: 700,
    title: 'SECAB Couplage Expert V5 PRO',
    icon: path.join(__dirname, 'resources', 'icon.ico'),
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  });

  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (!fs.existsSync(indexPath)) {
    dialog.showErrorBox('Erreur SECAB', 'Fichier dist/index.html introuvable. La compilation Vite n’a pas été intégrée.');
  }

  win.loadFile(indexPath);
  win.maximize();

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    dialog.showErrorBox('Erreur de chargement', String(errorDescription || errorCode));
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => callback(true));
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
