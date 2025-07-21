import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../store'

export function InteractiveFilterDisplay() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const originalImageRef = useRef<HTMLImageElement | null>(null)
  const currentImageDataRef = useRef<ImageData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [brushPosition, setBrushPosition] = useState({ x: 0, y: 0, visible: false })
  
  const image = useStore((state) => state.workspace.image)
  const activeFilter = useStore((state) => state.filter.activeFilter)
  const controls = useStore((state) => state.filter.controls)
  
  // Load image when it changes
  useEffect(() => {
    if (!image?.url) return
    
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      originalImageRef.current = img
      resetToOriginal()
    }
    img.src = image.url
  }, [image])
  
  const resetToOriginal = () => {
    const canvas = canvasRef.current
    const img = originalImageRef.current
    if (!canvas || !img) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size to match image
    canvas.width = img.width
    canvas.height = img.height
    
    // Draw original image
    ctx.drawImage(img, 0, 0)
    
    // Store current state
    currentImageDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
  }
  
  // Apply filter when controls change
  useEffect(() => {
    if (activeFilter?.id !== 'liquify') {
      applyFilter()
    }
  }, [controls])
  
  const applyFilter = () => {
    const canvas = canvasRef.current
    const img = originalImageRef.current
    if (!canvas || !img) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // For non-liquify filters, always start from original
    if (activeFilter?.id !== 'liquify') {
      ctx.drawImage(img, 0, 0)
    }
    
    if (!activeFilter) return
    
    setIsProcessing(true)
    
    try {
      switch (activeFilter.id) {
        case 'liquify':
          // Liquify is handled by touch/mouse events
          break
        case 'convolve':
          applyConvolveFilter(ctx, canvas.width, canvas.height)
          break
        case 'gel-paint':
          applyGelPaintFilter(ctx, canvas.width, canvas.height)
          break
      }
      
      // Store current state
      currentImageDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
    } catch (error) {
      console.error('Filter error:', error)
    }
    
    setIsProcessing(false)
  }
  
  // Touch/Mouse handling for Liquify
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || activeFilter?.id !== 'liquify') return
    
    let isDrawing = false
    let lastPos = { x: 0, y: 0 }
    
    const getPos = (e: MouseEvent | Touch) => {
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      }
    }
    
    const startDraw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      isDrawing = true
      const pos = 'touches' in e ? getPos(e.touches[0]) : getPos(e)
      lastPos = pos
      setBrushPosition({ ...pos, visible: true })
    }
    
    const draw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      const pos = 'touches' in e && e.touches[0] ? getPos(e.touches[0]) : 'touches' in e ? null : getPos(e)
      if (!pos) return
      
      setBrushPosition({ ...pos, visible: isDrawing })
      
      if (!isDrawing) return
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      // Apply liquify effect
      const brushSize = controls.find(c => c.id === 'brushSize')?.value as number || 50
      const strength = (controls.find(c => c.id === 'strength')?.value as number || 50) / 100
      const mode = controls.find(c => c.id === 'mode')?.value as string || 'smear'
      
      applyLiquifyBrush(ctx, canvas.width, canvas.height, lastPos, pos, brushSize, strength, mode)
      
      lastPos = pos
    }
    
    const stopDraw = () => {
      isDrawing = false
      setBrushPosition(prev => ({ ...prev, visible: false }))
    }
    
    // Mouse events
    canvas.addEventListener('mousedown', startDraw)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', stopDraw)
    canvas.addEventListener('mouseleave', stopDraw)
    
    // Touch events
    canvas.addEventListener('touchstart', startDraw, { passive: false })
    canvas.addEventListener('touchmove', draw, { passive: false })
    canvas.addEventListener('touchend', stopDraw)
    canvas.addEventListener('touchcancel', stopDraw)
    
    return () => {
      canvas.removeEventListener('mousedown', startDraw)
      canvas.removeEventListener('mousemove', draw)
      canvas.removeEventListener('mouseup', stopDraw)
      canvas.removeEventListener('mouseleave', stopDraw)
      canvas.removeEventListener('touchstart', startDraw)
      canvas.removeEventListener('touchmove', draw)
      canvas.removeEventListener('touchend', stopDraw)
      canvas.removeEventListener('touchcancel', stopDraw)
    }
  }, [activeFilter, controls])
  
  const applyLiquifyBrush = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    lastPos: { x: number; y: number },
    currentPos: { x: number; y: number },
    brushSize: number,
    strength: number,
    mode: string
  ) => {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    const newImageData = ctx.createImageData(width, height)
    const newData = newImageData.data
    
    // Copy original data
    for (let i = 0; i < data.length; i++) {
      newData[i] = data[i]
    }
    
    const dx = currentPos.x - lastPos.x
    const dy = currentPos.y - lastPos.y
    
    // Apply effect in brush area
    const minY = Math.max(0, Math.floor(currentPos.y - brushSize))
    const maxY = Math.min(height, Math.ceil(currentPos.y + brushSize))
    const minX = Math.max(0, Math.floor(currentPos.x - brushSize))
    const maxX = Math.min(width, Math.ceil(currentPos.x + brushSize))
    
    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
        const dist = Math.sqrt((x - currentPos.x) ** 2 + (y - currentPos.y) ** 2)
        
        if (dist < brushSize) {
          const effect = (1 - dist / brushSize) * strength
          let sourceX = x
          let sourceY = y
          
          switch (mode) {
            case 'smear':
              sourceX = x - dx * effect * 2
              sourceY = y - dy * effect * 2
              break
            case 'twirl':
              const angle = Math.atan2(y - currentPos.y, x - currentPos.x)
              const newAngle = angle + effect * Math.PI / 2
              sourceX = currentPos.x + dist * Math.cos(newAngle)
              sourceY = currentPos.y + dist * Math.sin(newAngle)
              break
            case 'pinch':
              sourceX = x + (currentPos.x - x) * effect * 0.5
              sourceY = y + (currentPos.y - y) * effect * 0.5
              break
            case 'swell':
              sourceX = x - (currentPos.x - x) * effect * 0.5
              sourceY = y - (currentPos.y - y) * effect * 0.5
              break
          }
          
          // Bilinear interpolation for smoother results
          const x0 = Math.floor(sourceX)
          const x1 = Math.ceil(sourceX)
          const y0 = Math.floor(sourceY)
          const y1 = Math.ceil(sourceY)
          
          if (x0 >= 0 && x1 < width && y0 >= 0 && y1 < height) {
            const dx = sourceX - x0
            const dy = sourceY - y0
            
            const targetIdx = (y * width + x) * 4
            
            for (let c = 0; c < 4; c++) {
              const tl = data[(y0 * width + x0) * 4 + c]
              const tr = data[(y0 * width + x1) * 4 + c]
              const bl = data[(y1 * width + x0) * 4 + c]
              const br = data[(y1 * width + x1) * 4 + c]
              
              const top = tl * (1 - dx) + tr * dx
              const bottom = bl * (1 - dx) + br * dx
              const value = top * (1 - dy) + bottom * dy
              
              newData[targetIdx + c] = Math.round(value)
            }
          }
        }
      }
    }
    
    ctx.putImageData(newImageData, 0, 0)
  }
  
  const applyConvolveFilter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const preset = controls.find(c => c.id === 'preset')?.value || 'sharpen'
    const intensity = (controls.find(c => c.id === 'intensity')?.value as number) / 100 || 0.5
    
    const kernels: Record<string, number[][]> = {
      sharpen: [
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
      ],
      blur: [
        [1/9, 1/9, 1/9],
        [1/9, 1/9, 1/9],
        [1/9, 1/9, 1/9]
      ],
      edge: [
        [-1, -1, -1],
        [-1, 8, -1],
        [-1, -1, -1]
      ],
      emboss: [
        [-2, -1, 0],
        [-1, 1, 1],
        [0, 1, 2]
      ]
    }
    
    const kernel = kernels[preset as string] || kernels.sharpen
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    const newImageData = ctx.createImageData(width, height)
    const newData = newImageData.data
    
    // Apply convolution
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let r = 0, g = 0, b = 0
        
        // Apply kernel
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4
            const weight = kernel[ky + 1][kx + 1]
            r += data[idx] * weight
            g += data[idx + 1] * weight
            b += data[idx + 2] * weight
          }
        }
        
        const idx = (y * width + x) * 4
        
        // Mix with original based on intensity
        newData[idx] = Math.min(255, Math.max(0, data[idx] * (1 - intensity) + r * intensity))
        newData[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] * (1 - intensity) + g * intensity))
        newData[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] * (1 - intensity) + b * intensity))
        newData[idx + 3] = data[idx + 3]
      }
    }
    
    // Copy edges
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
          const idx = (y * width + x) * 4
          for (let c = 0; c < 4; c++) {
            newData[idx + c] = data[idx + c]
          }
        }
      }
    }
    
    ctx.putImageData(newImageData, 0, 0)
  }
  
  const applyGelPaintFilter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    const depth = (controls.find(c => c.id === 'depth')?.value as number) / 100 || 0.5
    const viscosity = (controls.find(c => c.id === 'viscosity')?.value as number) / 100 || 0.5
    
    // Create highlight layer
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
      const highlight = Math.pow(brightness / 255, 1 - viscosity) * depth * 128
      
      data[i] = Math.min(255, data[i] + highlight)
      data[i + 1] = Math.min(255, data[i + 1] + highlight)
      data[i + 2] = Math.min(255, data[i + 2] + highlight)
    }
    
    ctx.putImageData(imageData, 0, 0)
  }
  
  if (!image) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-8">
          <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 text-lg">Upload an image to get started</p>
        </div>
      </div>
    )
  }
  
  const brushSize = controls.find(c => c.id === 'brushSize')?.value as number || 50
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      {isProcessing && (
        <div className="absolute top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg z-10">
          Processing...
        </div>
      )}
      
      {/* Brush indicator for Liquify */}
      {activeFilter?.id === 'liquify' && brushPosition.visible && (
        <div
          className="absolute pointer-events-none border-2 border-blue-500 rounded-full opacity-50"
          style={{
            width: brushSize + 'px',
            height: brushSize + 'px',
            left: brushPosition.x - brushSize / 2 + 'px',
            top: brushPosition.y - brushSize / 2 + 'px',
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
      
      <div className="relative">
        <canvas 
          ref={canvasRef}
          className="max-w-full max-h-full object-contain rounded-lg shadow-xl cursor-crosshair"
          style={{ 
            maxHeight: '70vh',
            touchAction: 'none'
          }}
        />
      </div>
      
      <div className="mt-4 flex gap-3">
        <button
          onClick={resetToOriginal}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Reset Image
        </button>
        
        <button
          onClick={() => {
            const canvas = canvasRef.current
            if (!canvas) return
            
            const link = document.createElement('a')
            link.download = `filtered-${image.name}`
            link.href = canvas.toDataURL()
            link.click()
          }}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Download
        </button>
      </div>
    </div>
  )
}