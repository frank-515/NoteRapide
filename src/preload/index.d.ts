import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      close: () => void
      app_send: (action: string, ...argv: any[]) => void
      app_invoke: (action: string, ...argv: any[]) => Promise<any>
    }
  }
}
