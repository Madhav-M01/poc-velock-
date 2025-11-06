import { useEffect, useRef, useState } from 'react'
import './ScreenRenderer.css'

// Props for ScreenRenderer component
// sourceId: ID of the screen source to render
// onBack: function called when user wants to go back to selection
interface ScreenRendererProps {
  sourceId: string
  onBack: () => void
}

export default function ScreenRenderer({ sourceId, onBack }: ScreenRendererProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    let stream: MediaStream | null = null

    const startCapture = async () => {
      try {
        setError(null)

        // Get the screen stream using getUserMedia with the sourceId
        const constraints: any = {
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId,
              minWidth: 1280,
              maxWidth: 1920,
              minHeight: 720,
              maxHeight: 1080
            }
          }
        }

        stream = await navigator.mediaDevices.getUserMedia(constraints)

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
            setIsPlaying(true)
          }
        }
      } catch (err) {
        console.error('Error capturing screen:', err)
        setError('Failed to capture screen. Please try selecting another source.')
      }
    }

    startCapture()

    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      setIsPlaying(false)
    }
  }, [sourceId])

  return (
    <div className="screen-renderer">
      <div className="renderer-controls">
        <button onClick={onBack} className="back-button">
          ← Back to Selection
        </button>
        {isPlaying && (
          <div className="status-indicator">
            <span className="recording-dot"></span>
            Screen Capture Active
          </div>
        )}
      </div>

      {error ? (
        <div className="renderer-error">
          <p>{error}</p>
          <button onClick={onBack}>Go Back</button>
        </div>
      ) : (
        <div className="video-container">
          <video
            ref={videoRef}
            autoPlay
            className="screen-video"
          />
        </div>
      )}
    </div>
  )
}
