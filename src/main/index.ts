import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { dialog } from 'electron'
import {
  duplicate,
  FileItem,
  init_storage,
  loadUserPreference,
  move,
  read,
  read_dir,
  remove,
  rename,
  saveUserPreference,
  UserPreference,
  write,
  write_absolute
} from './localfile'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
      // devTools: true
    }
  })

  // mainWindow.webContents.openDevTools()

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  init_storage()
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('close', () => {
  app.quit()
})

ipcMain.on('app.write', (_, path: string, data: string) => {
  write(path, data)
})

ipcMain.on('app.writeAbsolute', (_, path: string, data: string) => {
  write_absolute(path, data)
})

ipcMain.handle('app.read', async (_, path: string) => {
  return read(path)
})

ipcMain.handle('app.getUserPreference', async (_): Promise<UserPreference> => {
  return loadUserPreference()
})

ipcMain.on('app.saveUserPreference', (_, preference: UserPreference) => {
  saveUserPreference(preference)
})

ipcMain.handle('app.list', async (_): Promise<FileItem[]> => {
  return read_dir()
})

ipcMain.on('app.move', (_, oldPath: string, newPath: string) => {
  move(oldPath, newPath)
})

ipcMain.on('app.rename', (_, oldPath: string, name: string) => {
  rename(oldPath, name)
})

ipcMain.on('app.duplicate', (_, p: string, destination: string) => {
  duplicate(p, destination)
})

ipcMain.on('app.remove', (_, path: string) => {
  remove(path)
})

ipcMain.on('app.saveTo', (_, content: string) => {
  dialog
    .showSaveDialog({
      title: 'Save document',
      defaultPath: app.getPath('desktop')
    })
    .then((cb) => {
      if (cb.canceled) {
        return
      } else {
        write_absolute(cb.filePath!, content)
      }
    })
})
