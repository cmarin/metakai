import React, { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Play, Pause, Download, RotateCcw } from 'lucide-react'

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
            <X size={20} className="text-gray-500" />
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
              <RotateCcw size={20} />
            </button>
            
            {isPlaying ? (
              <button
                onClick={onPause}
                className="p-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                title="Pause"
              >
                <Pause size={24} />
              </button>
            ) : (
              <button
                onClick={onPlay}
                className="p-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                title="Play"
              >
                <Play size={24} />
              </button>
            )}
            
            <button
              onClick={onExport}
              className="p-3 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
              title="Download"
            >
              <Download size={20} />
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