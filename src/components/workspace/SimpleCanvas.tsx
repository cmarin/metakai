import { useEffect, useRef } from 'react'
import { useStore } from '../../store'

export function SimpleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const image = useStore((state) => state.workspace.image)
  const zoom = useStore((state) => state.workspace.zoom)
  const pan = useStore((state) => state.workspace.pan)
  
  // Draw image on canvas
  const drawImage = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const img = imageRef.current
    
    if (!canvas || !ctx || !img || !img.complete) return
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Save context state
    ctx.save()
    
    // Apply transformations
    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y)
    ctx.scale(zoom, zoom)
    
    // Calculate image position to center it
    const imgWidth = img.width
    const imgHeight = img.height
    const scale = Math.min(
      (canvas.width * 0.8) / imgWidth,
      (canvas.height * 0.8) / imgHeight
    )
    
    const drawWidth = imgWidth * scale
    const drawHeight = imgHeight * scale
    
    // Draw image centered
    ctx.drawImage(
      img,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    )
    
    // Restore context state
    ctx.restore()
  }
  
  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return
      const container = canvasRef.current.parentElement
      if (!container) return
      
      canvasRef.current.width = container.clientWidth
      canvasRef.current.height = container.clientHeight
      
      drawImage()
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Load and draw image when it changes
  useEffect(() => {
    if (!image?.url) return
    
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      imageRef.current = img
      drawImage()
      console.log('Image loaded and drawn:', img.width, 'x', img.height)
    }
    
    img.onerror = (e) => {
      console.error('Failed to load image:', e)
      alert('Failed to load image. Please try another one.')
    }
    
    img.src = image.url
  }, [image])
  
  // Redraw when zoom or pan changes
  useEffect(() => {
    drawImage()
  }, [zoom, pan])
  
  // Mouse/touch interactions
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    let isDragging = false
    let lastX = 0
    let lastY = 0
    
    const handleStart = (e: MouseEvent | TouchEvent) => {
      isDragging = true
      const point = 'touches' in e ? e.touches[0] : e
      lastX = point.clientX
      lastY = point.clientY
      canvas.style.cursor = 'grabbing'
    }
    
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return
      
      const point = 'touches' in e ? e.touches[0] : e
      const deltaX = point.clientX - lastX
      const deltaY = point.clientY - lastY
      
      const currentPan = useStore.getState().workspace.pan
      useStore.getState().setPan({
        x: currentPan.x + deltaX,
        y: currentPan.y + deltaY
      })
      
      lastX = point.clientX
      lastY = point.clientY
    }
    
    const handleEnd = () => {
      isDragging = false
      canvas.style.cursor = 'grab'
    }
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const currentZoom = useStore.getState().workspace.zoom
      useStore.getState().setZoom(currentZoom * delta)
    }
    
    // Mouse events
    canvas.addEventListener('mousedown', handleStart)
    canvas.addEventListener('mousemove', handleMove)
    canvas.addEventListener('mouseup', handleEnd)
    canvas.addEventListener('mouseleave', handleEnd)
    canvas.addEventListener('wheel', handleWheel)
    
    // Touch events
    canvas.addEventListener('touchstart', handleStart)
    canvas.addEventListener('touchmove', handleMove)
    canvas.addEventListener('touchend', handleEnd)
    
    canvas.style.cursor = 'grab'
    
    return () => {
      canvas.removeEventListener('mousedown', handleStart)
      canvas.removeEventListener('mousemove', handleMove)
      canvas.removeEventListener('mouseup', handleEnd)
      canvas.removeEventListener('mouseleave', handleEnd)
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('touchstart', handleStart)
      canvas.removeEventListener('touchmove', handleMove)
      canvas.removeEventListener('touchend', handleEnd)
    }
  }, [])
  
  return (
    <div className="w-full h-full bg-gray-100">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      />
      {!image && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 text-lg">Upload an image to get started</p>
          </div>
        </div>
      )}
    </div>
  )
}