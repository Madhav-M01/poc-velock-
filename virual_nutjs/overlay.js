const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let overlayWindow;

function createOverlay() {
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  overlayWindow = new BrowserWindow({
    width: width,
    height: height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  overlayWindow.loadFile('overlay.html');
  overlayWindow.setIgnoreMouseEvents(true);
  overlayWindow.maximize();

  // Optional: Open DevTools for debugging
  // overlayWindow.webContents.openDevTools({ mode: 'detach' });
}

// Handle cursor position updates
ipcMain.on('update-cursor', (event, data) => {
  if (overlayWindow && overlayWindow.webContents) {
    overlayWindow.webContents.send('cursor-update', data);
  }
});

// Handle cursor visibility
ipcMain.on('set-visibility', (event, visible) => {
  if (overlayWindow && overlayWindow.webContents) {
    overlayWindow.webContents.send('set-visibility', visible);
  }
});

// Handle cursor shape
ipcMain.on('set-shape', (event, shape) => {
  if (overlayWindow && overlayWindow.webContents) {
    overlayWindow.webContents.send('set-shape', shape);
  }
});

// Handle cursor color
ipcMain.on('set-color', (event, color) => {
  if (overlayWindow && overlayWindow.webContents) {
    overlayWindow.webContents.send('set-color', color);
  }
});

// Handle cursor state (clicking, dragging, etc.)
ipcMain.on('set-state', (event, state) => {
  if (overlayWindow && overlayWindow.webContents) {
    overlayWindow.webContents.send('set-state', state);
  }
});

app.whenReady().then(() => {
  createOverlay();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createOverlay();
  }
});

module.exports = { overlayWindow };
