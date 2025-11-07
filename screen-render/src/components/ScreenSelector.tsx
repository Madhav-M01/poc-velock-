import { useEffect } from 'react'
import './ScreenSelector.css'

// Props for ScreenSelector component
// onSelectSource: function called when a source is selected, receives the source ID
// Note: Screen selection is now handled via menubar
interface ScreenSelectorProps {
  onSelectSource: (sourceId: string) => void
}

export default function ScreenSelector({ onSelectSource }: ScreenSelectorProps) {
  useEffect(() => {
    // Listen for screen selection events from the system tray
    const cleanup = window.electronAPI.onScreenSelected((sourceId: string) => {
      console.log('Screen selected from tray:', sourceId)
      onSelectSource(sourceId)
    })

    // Cleanup listener on unmount
    return cleanup
  }, [onSelectSource])

  return (
    <div className="screen-selector">
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Screen Selection</h2>
        <p>Click the tray icon in your system tray to select a screen or window to capture.</p>
        <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          Look for the screen selector icon in your taskbar (Windows) or menu bar (Mac).
        </p>
      </div>
    </div>
  )
}
