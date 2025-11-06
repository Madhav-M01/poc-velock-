import { useState, useEffect } from 'react'
import type { ScreenSource } from '../vite-env'
import './ScreenSelector.css'

// Props for ScreenSelector component
// onSelectSource: function called when a source is selected, receives the source ID
// Example usage:
// <ScreenSelector onSelectSource={(sourceId) => { console.log(sourceId); }} />
interface ScreenSelectorProps {
  onSelectSource: (sourceId: string) => void
}

export default function ScreenSelector({ onSelectSource }: ScreenSelectorProps) {
  const [sources, setSources] = useState<ScreenSource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

    // Function to fetch screen sources from the main process
  const fetchSources = async () => {
    setLoading(true)
    setError(null)
    try {
      const screenSources = await window.electronAPI.getScreenSources()
      setSources(screenSources)
    } catch (err) {
      setError('Failed to fetch screen sources')
      console.error('Error fetching sources:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSources()
  }, [])
  // Handler for selecting a source
  // calls the onSelectSource prop with the selected source ID
  const handleSelectSource = (sourceId: string) => {
    onSelectSource(sourceId)
  }

  if (loading) {
    return <div className="screen-selector-loading">Loading available screens...</div>
  }

  if (error) {
    return (
      <div className="screen-selector-error">
        <p>{error}</p>
        <button onClick={fetchSources}>Retry</button>
      </div>
    )
  }

  return (
    <div className="screen-selector">
      <h2>Select a Screen or Window</h2>
      <button onClick={fetchSources} className="refresh-button">
        Refresh List
      </button>
      <div className="sources-grid">
        {sources.map((source) => (
          <div
            key={source.id}
            className="source-item"
            onClick={() => handleSelectSource(source.id)}
          >
            <img
              src={source.thumbnail}
              alt={source.name}
              className="source-thumbnail"
            />
            <div className="source-info">
              {source.appIcon && (
                <img src={source.appIcon} alt="" className="source-icon" />
              )}
              <span className="source-name">{source.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
