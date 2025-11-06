import { app, BrowserWindow, ipcMain, desktopCapturer } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })
 
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC Handlers
// what windows and screens are available for capture
// returns an array of sources with id, name, thumbnail (as data URL), display_id, and appIcon (as data URL)
// thumbnail and appIcon are optional and may not be available for all sources
// example return value:
// [
//   {     id: 'screen:0:0',
//     name: 'Entire Screen',
//     thumbnail: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
//     display_id: '0',
//     appIcon: null
//   }, 
// desktopcapturer source for a window
// that captures the entire screen
ipcMain.handle('get-screen-sources', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'],
      thumbnailSize: { width: 300, height: 200 }
    })

    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
      display_id: source.display_id,
      appIcon: source.appIcon?.toDataURL()
    }))
  } catch (error) {
    console.error('Error getting screen sources:', error)
    return []
  }
})

app.whenReady().then(() => {
  createWindow()
    // for macOS specific behavior
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
