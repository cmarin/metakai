import { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface VideoGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  videoFrames: { imageData: ImageData; timestamp: number }[]
  currentFrame: number
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onFrameChange: (frame: number) => void
  onExport: () => void
  fps: number
  width: number
  height: number
}

export function VideoGenerationModal({
  isOpen,
  onClose,
  videoFrames,
  currentFrame,
  isPlaying,
  onPlay,
  onPause,
  onReset,
  onFrameChange,
  onExport,
  fps,
  width,
  height
}: VideoGenerationModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    if (!isOpen) return
    
    const canvas = canvasRef.current
    if (!canvas || videoFrames.length === 0) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const frame = videoFrames[currentFrame]
    if (frame) {
      ctx.putImageData(frame.imageData, 0, 0)
    }
  }, [currentFrame, videoFrames, isOpen])
  
  if (!isOpen) return null
  
  const duration = videoFrames.length / fps
  const currentTime = currentFrame / fps
  
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Video Preview
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {/* Video canvas */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              className="max-w-full h-auto rounded-lg shadow-lg"
              style={{ maxHeight: 'calc(90vh - 300px)' }}
            />
          </div>
        </div>
        
        {/* Controls */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>{currentTime.toFixed(1)}s</span>
              <span>{duration.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min={0}
              max={videoFrames.length - 1}
              value={currentFrame}
              onChange={(e) => onFrameChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
          
          {/* Control buttons */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={onReset}
              className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
              title="Reset"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
            </button>
            
            {isPlaying ? (
              <button
                onClick={onPause}
                className="p-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                title="Pause"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              </button>
            ) : (
              <button
                onClick={onPlay}
                className="p-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                title="Play"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </button>
            )}
            
            <button
              onClick={onExport}
              className="p-3 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
              title="Download"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          </div>
          
          {/* Info */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            {videoFrames.length} frames at {fps} FPS
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}