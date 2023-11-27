import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  close: () => {
    electronAPI.ipcRenderer.send("close")
  },
  app_send: (action: string, ...argv :any[]) => {
    electronAPI.ipcRenderer.send('app.' + action, ...argv)
  },
  app_invoke: (action: string, ...argv :any[]) => {
    return electronAPI.ipcRenderer.invoke('app.' + action, ...argv);
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
