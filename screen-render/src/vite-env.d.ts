/// <reference types="vite/client" />

export interface ScreenSource {
  id: string
  name: string
  thumbnail: string
  display_id?: string
  appIcon?: string
}

interface Window {
  electronAPI: {
    getScreenSources: () => Promise<ScreenSource[]>
  }
}
