import { contextBridge, ipcRenderer } from 'electron'

export interface ScreenSource {
  id: string
  name: string
  thumbnail: string
  display_id?: string
  appIcon?: string
}

contextBridge.exposeInMainWorld('electronAPI', {
  getScreenSources: async (): Promise<ScreenSource[]> => {
    return await ipcRenderer.invoke('get-screen-sources')
  },
  onScreenSelected: (callback: (sourceId: string) => void) => {
    ipcRenderer.on('screen-selected', (_event, sourceId) => callback(sourceId))
    // Return cleanup function
    return () => {
      ipcRenderer.removeAllListeners('screen-selected')
    }
  },
})
