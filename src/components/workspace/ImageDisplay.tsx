import { useRef, useEffect } from 'react'
import { useStore } from '../../store'

export function ImageDisplay() {
  const containerRef = useRef<HTMLDivElement>(null)
  const image = useStore((state) => state.workspace.image)
  const zoom = useStore((state) => state.workspace.zoom)
  const pan = useStore((state) => state.workspace.pan)
  const setPan = useStore((state) => state.setPan)
  const setZoom = useStore((state) => state.setZoom)
  
  console.log('ImageDisplay render:', { image, zoom, pan })
  
  if (!image) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 text-lg">Upload an image to get started</p>
          <button 
            onClick={() => {
              // Test the store directly
              const testImage = {
                url: 'https://via.placeholder.com/400x300',
                width: 400,
                height: 300,
                name: 'test.jpg',
                type: 'image/jpeg'
              }
              console.log('Setting test image:', testImage)
              useStore.getState().setImage(testImage)
            }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Test with placeholder image
          </button>
        </div>
      </div>
    )
  }
  
  // Add drag and zoom functionality
  useEffect(() => {
    const container = containerRef.current
    if (!container || !image) return
    
    let isDragging = false
    let startX = 0
    let startY = 0
    
    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true
      startX = e.clientX - pan.x
      startY = e.clientY - pan.y
      container.style.cursor = 'grabbing'
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      setPan({
        x: e.clientX - startX,
        y: e.clientY - startY
      })
    }
    
    const handleMouseUp = () => {
      isDragging = false
      container.style.cursor = 'grab'
    }
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setZoom(zoom * delta)
    }
    
    container.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('wheel', handleWheel)
    container.style.cursor = 'grab'
    
    return () => {
      container.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('wheel', handleWheel)
    }
  }, [image, pan.x, pan.y, zoom, setPan, setZoom])
  
  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-gray-100 dark:bg-gray-900 relative"
    >
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center',
          transition: 'none'
        }}
      >
        <img 
          src={image.url} 
          alt={image.name}
          className="max-w-[90%] max-h-[90%] object-contain shadow-2xl"
          draggable={false}
          onError={(e) => {
            console.error('Image failed to load:', e)
            alert('Failed to display image. Please try another one.')
          }}
          onLoad={() => {
            console.log('Image loaded successfully!')
          }}
        />
      </div>
    </div>
  )
}