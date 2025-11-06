import { useState } from 'react'
import ScreenSelector from './components/ScreenSelector'
import ScreenRenderer from './components/ScreenRenderer'
import './App.css'

function App() {
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)

  const handleSelectSource = (sourceId: string) => {
    setSelectedSourceId(sourceId)
  }

  const handleBack = () => {
    setSelectedSourceId(null)
  }

  return (
    <div className="App">
      {selectedSourceId ? (
        <ScreenRenderer
          sourceId={selectedSourceId}
          onBack={handleBack}
        />
      ) : (
        <>
          <div className="app-header">
            <h1>Screen Render</h1>
            <p className="description">
              Select a screen or window to start capturing
            </p>
          </div>
          <ScreenSelector onSelectSource={handleSelectSource} />
        </>
      )}
    </div>
  )
}

export default App
