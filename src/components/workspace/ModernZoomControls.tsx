import { useStore } from '../../store'

export function ModernZoomControls() {
  const zoom = useStore((state) => state.workspace.zoom)
  const setZoom = useStore((state) => state.setZoom)
  const setPan = useStore((state) => state.setPan)
  
  const handleZoomIn = () => setZoom(Math.min(zoom * 1.2, 5))
  const handleZoomOut = () => setZoom(Math.max(zoom / 1.2, 0.1))
  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }
  
  return (
    <div className="absolute bottom-6 right-6 bg-white dark:bg-gray-900 rounded-2xl shadow-xl 
                    border border-gray-200 dark:border-gray-800 p-1 flex items-center gap-1">
      <button
        onClick={handleZoomOut}
        className="btn-icon"
        title="Zoom out"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      
      <div className="px-3 py-2 min-w-[80px] text-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {Math.round(zoom * 100)}%
        </span>
      </div>
      
      <button
        onClick={handleZoomIn}
        className="btn-icon"
        title="Zoom in"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      
      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />
      
      <button
        onClick={handleReset}
        className="btn-icon"
        title="Reset view"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
    </div>
  )
}