import { app, BrowserWindow, ipcMain, desktopCapturer, Tray, Menu, nativeImage } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

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

// Create system tray icon
async function createTray() {
  // Create a simple icon for the tray (you can replace this with an actual icon file)
  const icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAEfSURBVDiNpZMxSsRAFIa/l2QXYmFhYWFhYWFhYWFhIRYWFhYWFhYWFhYWFhYWFhYWFhYW4gGEQDyAYGFhYWEhHkAQT+ABRK9gYWFhYWFhYSFew8IkZnezm+wk+8q8/9/3v/m8YRiGYRiGYRiGYRiGYRiGYfwvAG4BXoCv4Av4BG6BC+AcOAN2gR1gG9gCNoENYB1YA1aBFWAZWAIWgQVgHpgD0sAMMAksABPA+BhgDhgDRoFRYAQYBoaAQWAAiAPdQBfoADqBdqAN6AS6gA6gHWgD2oAWoAVoBlqBZqAJaASagEagAagH6oB6oA6oBWqBGqAaqAKqgEqgAqgAyoFyoAwoA0qBUqAEKAaKgUKgECgA8oE8IBfIAXKAbCALyASygQwgHUgDUoFUIBlIApKBJCAR+AUxvXVkVQeMqgAAAABJRU5ErkJggg==')

  tray = new Tray(icon)
  tray.setToolTip('Screen Selector')

  await updateTrayMenu()
}

// Update tray menu with available screens
async function updateTrayMenu() {
  if (!tray) return

  try {
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'],
      thumbnailSize: { width: 50, height: 50 }
    })

    const menuItems = sources.map(source => ({
      label: source.name,
      click: () => {
        // Send selected screen to renderer process
        if (mainWindow) {
          mainWindow.webContents.send('screen-selected', source.id)
        }
      }
    }))

    // Add separator and refresh option
    menuItems.push(
      { type: 'separator' as const },
      {
        label: 'Refresh List',
        click: () => updateTrayMenu()
      },
      { type: 'separator' as const },
      {
        label: 'Quit',
        click: () => app.quit()
      }
    )

    const contextMenu = Menu.buildFromTemplate(menuItems)
    tray.setContextMenu(contextMenu)
  } catch (error) {
    console.error('Error updating tray menu:', error)
  }
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
  createTray()

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
