import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../store'

export function FilteredImageDisplay() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const image = useStore((state) => state.workspace.image)
  const activeFilter = useStore((state) => state.filter.activeFilter)
  const controls = useStore((state) => state.filter.controls)
  
  // Load image when it changes
  useEffect(() => {
    if (!image?.url) return
    
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageRef.current = img
      applyFilter()
    }
    img.src = image.url
  }, [image])
  
  // Apply filter when controls change
  useEffect(() => {
    applyFilter()
  }, [activeFilter, controls])
  
  const applyFilter = () => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size to match image
    canvas.width = img.width
    canvas.height = img.height
    
    // Draw original image
    ctx.drawImage(img, 0, 0)
    
    // Apply filter based on active filter
    if (!activeFilter) return
    
    setIsProcessing(true)
    
    try {
      switch (activeFilter.id) {
        case 'liquify':
          applyLiquifyFilter(ctx, canvas.width, canvas.height)
          break
        case 'convolve':
          applyConvolveFilter(ctx, canvas.width, canvas.height)
          break
        case 'gel-paint':
          applyGelPaintFilter(ctx, canvas.width, canvas.height)
          break
      }
    } catch (error) {
      console.error('Filter error:', error)
    }
    
    setIsProcessing(false)
  }
  
  const applyLiquifyFilter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Simple swirl effect for demo
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    const newImageData = ctx.createImageData(width, height)
    const newData = newImageData.data
    
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 3
    const strength = (controls.find(c => c.id === 'strength')?.value as number) / 100 || 0.5
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - centerX
        const dy = y - centerY
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        let sourceX = x
        let sourceY = y
        
        if (dist < radius) {
          const angle = Math.atan2(dy, dx)
          const swirl = (1 - dist / radius) * strength * Math.PI
          const newAngle = angle + swirl
          
          sourceX = centerX + dist * Math.cos(newAngle)
          sourceY = centerY + dist * Math.sin(newAngle)
        }
        
        // Clamp coordinates
        sourceX = Math.max(0, Math.min(width - 1, Math.round(sourceX)))
        sourceY = Math.max(0, Math.min(height - 1, Math.round(sourceY)))
        
        const targetIndex = (y * width + x) * 4
        const sourceIndex = (sourceY * width + sourceX) * 4
        
        newData[targetIndex] = data[sourceIndex]
        newData[targetIndex + 1] = data[sourceIndex + 1]
        newData[targetIndex + 2] = data[sourceIndex + 2]
        newData[targetIndex + 3] = data[sourceIndex + 3]
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
    
    ctx.putImageData(newImageData, 0, 0)
  }
  
  const applyGelPaintFilter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Simple glossy effect for demo
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    const depth = (controls.find(c => c.id === 'depth')?.value as number) / 100 || 0.5
    
    for (let i = 0; i < data.length; i += 4) {
      // Add highlight
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
      const highlight = brightness * depth * 0.5
      
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
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      {isProcessing && (
        <div className="absolute top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg">
          Processing...
        </div>
      )}
      <canvas 
        ref={canvasRef}
        className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
        style={{ maxHeight: '80vh' }}
      />
      <button
        onClick={() => {
          const canvas = canvasRef.current
          if (!canvas) return
          
          const link = document.createElement('a')
          link.download = `filtered-${image.name}`
          link.href = canvas.toDataURL()
          link.click()
        }}
        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Download Image
      </button>
    </div>
  )
}