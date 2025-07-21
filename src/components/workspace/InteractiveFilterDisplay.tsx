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
        case 'projection':
          applyProjectionFilter(ctx, canvas.width, canvas.height)
          break
        case 'reaction':
          applyReactionFilter(ctx, canvas.width, canvas.height)
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
    
    // Enhanced kernels with stronger effects
    const kernels: Record<string, number[][]> = {
      sharpen: [
        [-1, -1, -1],
        [-1, 9, -1],
        [-1, -1, -1]
      ],
      blur: [
        [1/16, 2/16, 1/16],
        [2/16, 4/16, 2/16],
        [1/16, 2/16, 1/16]
      ],
      edge: [
        [-2, -2, -2],
        [-2, 16, -2],
        [-2, -2, -2]
      ],
      emboss: [
        [-4, -2, 0],
        [-2, 1, 2],
        [0, 2, 4]
      ]
    }
    
    const kernel = kernels[preset as string] || kernels.sharpen
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    const newImageData = ctx.createImageData(width, height)
    const newData = newImageData.data
    
    // Apply convolution with enhanced intensity
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
        
        // Enhanced intensity application for more pronounced effects
        const enhancedIntensity = Math.min(1, intensity * 1.5)
        
        if (preset === 'edge') {
          // For edge detection, use absolute values for more visible edges
          r = Math.abs(r)
          g = Math.abs(g)
          b = Math.abs(b)
        }
        
        newData[idx] = Math.min(255, Math.max(0, data[idx] * (1 - enhancedIntensity) + r * enhancedIntensity))
        newData[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] * (1 - enhancedIntensity) + g * enhancedIntensity))
        newData[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] * (1 - enhancedIntensity) + b * enhancedIntensity))
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
    const newImageData = ctx.createImageData(width, height)
    const newData = newImageData.data
    
    // Get control values
    const material = controls.find(c => c.id === 'material')?.value || 'glass'
    const lensSize = (controls.find(c => c.id === 'lensSize')?.value as number) / 100 || 0.5
    const refraction = (controls.find(c => c.id === 'refraction')?.value as number) / 100 || 0.3
    const reflection = (controls.find(c => c.id === 'reflection')?.value as number) / 100 || 0.2
    
    const centerX = width / 2
    const centerY = height / 2
    const maxRadius = Math.min(width, height) * lensSize * 0.5
    
    // Copy original data first
    for (let i = 0; i < data.length; i++) {
      newData[i] = data[i]
    }
    
    // KPT Glass Lens effect
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        
        // Calculate distance from center
        const dx = x - centerX
        const dy = y - centerY
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (dist < maxRadius) {
          // Calculate lens curvature
          const normalizedDist = dist / maxRadius
          const z = Math.sqrt(Math.max(0, 1 - normalizedDist * normalizedDist))
          
          // Calculate refraction based on lens curvature
          const refractionStrength = refraction * z
          const angle = Math.atan2(dy, dx)
          
          // Calculate source position with lens distortion
          let sourceX = x
          let sourceY = y
          
          if (material === 'glass') {
            // Glass lens refraction - bends light through the lens
            const bendFactor = 1 - normalizedDist * refractionStrength
            sourceX = centerX + dx * bendFactor
            sourceY = centerY + dy * bendFactor
            
            // Add subtle chromatic aberration
            const chromaticShift = refractionStrength * 2
            const rSourceX = centerX + dx * (bendFactor - chromaticShift * 0.01)
            const bSourceX = centerX + dx * (bendFactor + chromaticShift * 0.01)
            
            // Sample with bounds checking
            const rX = Math.max(0, Math.min(width - 1, Math.round(rSourceX)))
            const bX = Math.max(0, Math.min(width - 1, Math.round(bSourceX)))
            const sY = Math.max(0, Math.min(height - 1, Math.round(sourceY)))
            
            const rIdx = (sY * width + rX) * 4
            const bIdx = (sY * width + bX) * 4
            const gIdx = (sY * width + Math.round(sourceX)) * 4
            
            // Apply refracted colors
            newData[idx] = data[rIdx]
            newData[idx + 1] = data[gIdx + 1]
            newData[idx + 2] = data[bIdx + 2]
            
          } else if (material === 'sphere') {
            // Spherical lens - stronger distortion
            const sphereFactor = Math.pow(z, 0.5)
            sourceX = centerX + dx / (1 + refractionStrength * sphereFactor * 2)
            sourceY = centerY + dy / (1 + refractionStrength * sphereFactor * 2)
            
          } else if (material === 'water') {
            // Water drop effect - ripple distortion
            const ripple = Math.sin(normalizedDist * Math.PI * 3) * refractionStrength
            sourceX = x + Math.cos(angle) * ripple * maxRadius * 0.1
            sourceY = y + Math.sin(angle) * ripple * maxRadius * 0.1
          }
          
          // Sample from source position for non-glass materials
          if (material !== 'glass') {
            sourceX = Math.max(0, Math.min(width - 1, Math.round(sourceX)))
            sourceY = Math.max(0, Math.min(height - 1, Math.round(sourceY)))
            const sourceIdx = (sourceY * width + sourceX) * 4
            
            newData[idx] = data[sourceIdx]
            newData[idx + 1] = data[sourceIdx + 1]
            newData[idx + 2] = data[sourceIdx + 2]
          }
          
          // Add subtle reflection/highlight
          if (reflection > 0) {
            const highlightStrength = Math.pow(z, 3) * reflection * 255
            const edgeHighlight = Math.pow(1 - normalizedDist, 8) * reflection * 128
            
            newData[idx] = Math.min(255, newData[idx] + highlightStrength + edgeHighlight)
            newData[idx + 1] = Math.min(255, newData[idx + 1] + highlightStrength + edgeHighlight)
            newData[idx + 2] = Math.min(255, newData[idx + 2] + highlightStrength + edgeHighlight)
          }
        }
        
        newData[idx + 3] = data[idx + 3] // Preserve alpha
      }
    }
    
    ctx.putImageData(newImageData, 0, 0)
  }
  
  const applyProjectionFilter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const type = controls.find(c => c.id === 'type')?.value || 'sphere'
    const fov = (controls.find(c => c.id === 'fov')?.value as number) || 90
    const rotation = ((controls.find(c => c.id === 'rotation')?.value as number) || 0) * Math.PI / 180
    const distortion = (controls.find(c => c.id === 'distortion')?.value as number) / 100 || 0.5
    
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    const newImageData = ctx.createImageData(width, height)
    const newData = newImageData.data
    
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 2
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        
        // Normalize coordinates to -1 to 1
        let nx = (x - centerX) / radius
        let ny = (y - centerY) / radius
        
        // Apply rotation
        const rotX = nx * Math.cos(rotation) - ny * Math.sin(rotation)
        const rotY = nx * Math.sin(rotation) + ny * Math.cos(rotation)
        nx = rotX
        ny = rotY
        
        let sourceX = x
        let sourceY = y
        
        switch (type) {
          case 'sphere':
            const r = Math.sqrt(nx * nx + ny * ny)
            if (r < 1) {
              const z = Math.sqrt(1 - r * r)
              const phi = Math.atan2(ny, nx)
              const theta = Math.acos(z) * (fov / 180)
              
              sourceX = centerX + radius * Math.sin(theta) * Math.cos(phi) * (1 + distortion * z)
              sourceY = centerY + radius * Math.sin(theta) * Math.sin(phi) * (1 + distortion * z)
            }
            break
            
          case 'cylinder':
            if (Math.abs(nx) < 1) {
              const angle = Math.asin(nx) * (fov / 90)
              sourceX = centerX + radius * angle * (1 + distortion * Math.cos(angle))
              sourceY = y + ny * radius * distortion * 0.5
            }
            break
            
          case 'cone':
            const dist = Math.sqrt(nx * nx + ny * ny)
            if (dist > 0) {
              const angle = Math.atan2(ny, nx)
              const newDist = dist * (1 - distortion * (1 - dist))
              sourceX = centerX + newDist * radius * Math.cos(angle)
              sourceY = centerY + newDist * radius * Math.sin(angle)
            }
            break
            
          case 'plane':
            const warpX = Math.sin(ny * Math.PI) * distortion * radius * 0.3
            const warpY = Math.sin(nx * Math.PI) * distortion * radius * 0.3
            sourceX = x + warpX
            sourceY = y + warpY
            break
        }
        
        // Bilinear interpolation for smooth sampling
        sourceX = Math.max(0, Math.min(width - 1, sourceX))
        sourceY = Math.max(0, Math.min(height - 1, sourceY))
        
        const x0 = Math.floor(sourceX)
        const x1 = Math.min(x0 + 1, width - 1)
        const y0 = Math.floor(sourceY)
        const y1 = Math.min(y0 + 1, height - 1)
        
        const fx = sourceX - x0
        const fy = sourceY - y0
        
        const idx00 = (y0 * width + x0) * 4
        const idx01 = (y0 * width + x1) * 4
        const idx10 = (y1 * width + x0) * 4
        const idx11 = (y1 * width + x1) * 4
        
        for (let c = 0; c < 4; c++) {
          const v00 = data[idx00 + c]
          const v01 = data[idx01 + c]
          const v10 = data[idx10 + c]
          const v11 = data[idx11 + c]
          
          const v0 = v00 * (1 - fx) + v01 * fx
          const v1 = v10 * (1 - fx) + v11 * fx
          const v = v0 * (1 - fy) + v1 * fy
          
          newData[idx + c] = Math.round(v)
        }
      }
    }
    
    ctx.putImageData(newImageData, 0, 0)
  }
  
  const applyReactionFilter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const pattern = controls.find(c => c.id === 'pattern')?.value || 'flame'
    const iterations = (controls.find(c => c.id === 'iterations')?.value as number) || 3
    const scale = (controls.find(c => c.id === 'scale')?.value as number) / 100 || 1
    const chaos = (controls.find(c => c.id === 'chaos')?.value as number) / 100 || 0.5
    
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    const newImageData = ctx.createImageData(width, height)
    const newData = newImageData.data
    
    // Initialize with original image
    for (let i = 0; i < data.length; i++) {
      newData[i] = data[i]
    }
    
    // Fractal flame algorithm
    const centerX = width / 2
    const centerY = height / 2
    
    for (let iter = 0; iter < iterations; iter++) {
      const tempData = new Uint8ClampedArray(newData)
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4
          
          // Normalize coordinates
          let nx = (x - centerX) / (width / 2)
          let ny = (y - centerY) / (height / 2)
          
          // Apply fractal transformations based on pattern
          let transformX = nx
          let transformY = ny
          
          switch (pattern) {
            case 'flame':
              // Flame pattern using sinusoidal variations
              transformX = nx + Math.sin(ny * Math.PI * scale) * chaos
              transformY = ny + Math.cos(nx * Math.PI * scale) * chaos
              
              // Add turbulence
              const turbulence = Math.sin(x * 0.05) * Math.cos(y * 0.05) * chaos
              transformX += turbulence
              transformY -= turbulence * 0.5
              break
              
            case 'electric':
              // Electric pattern using exponential functions
              const angle = Math.atan2(ny, nx)
              const dist = Math.sqrt(nx * nx + ny * ny)
              
              transformX = nx + Math.sin(angle * scale * 4) * Math.exp(-dist) * chaos
              transformY = ny + Math.cos(angle * scale * 4) * Math.exp(-dist) * chaos
              break
              
            case 'organic':
              // Organic pattern using Perlin noise-like effect
              const noise1 = Math.sin(x * 0.02 * scale) * Math.cos(y * 0.02 * scale)
              const noise2 = Math.sin(x * 0.05 * scale + 1.5) * Math.cos(y * 0.05 * scale + 1.5)
              
              transformX = nx + (noise1 + noise2 * 0.5) * chaos
              transformY = ny + (noise2 - noise1 * 0.5) * chaos
              break
              
            case 'crystal':
              // Crystal pattern using geometric transformations
              const facets = 6
              const facetAngle = Math.floor(Math.atan2(ny, nx) / (Math.PI * 2 / facets)) * (Math.PI * 2 / facets)
              
              transformX = nx * Math.cos(facetAngle) + ny * Math.sin(facetAngle)
              transformY = -nx * Math.sin(facetAngle) + ny * Math.cos(facetAngle)
              
              // Add crystalline distortion
              transformX = transformX * (1 + Math.abs(transformX) * chaos * 0.5)
              transformY = transformY * (1 + Math.abs(transformY) * chaos * 0.5)
              break
          }
          
          // Convert back to pixel coordinates
          const sourceX = Math.round(transformX * (width / 2) + centerX)
          const sourceY = Math.round(transformY * (height / 2) + centerY)
          
          if (sourceX >= 0 && sourceX < width && sourceY >= 0 && sourceY < height) {
            const sourceIdx = (sourceY * width + sourceX) * 4
            
            // Blend with original using iteration-based weighting
            const weight = 1 / (iter + 1)
            
            for (let c = 0; c < 3; c++) {
              newData[idx + c] = tempData[idx + c] * (1 - weight) + tempData[sourceIdx + c] * weight
            }
            
            // Add color variation based on pattern
            if (pattern === 'flame') {
              // Enhance reds and yellows
              newData[idx] = Math.min(255, newData[idx] * 1.2)
              newData[idx + 1] = Math.min(255, newData[idx + 1] * 1.1)
            } else if (pattern === 'electric') {
              // Enhance blues and whites
              newData[idx + 2] = Math.min(255, newData[idx + 2] * 1.3)
              newData[idx] = Math.min(255, newData[idx] * 0.9)
            } else if (pattern === 'organic') {
              // Enhance greens
              newData[idx + 1] = Math.min(255, newData[idx + 1] * 1.2)
            } else if (pattern === 'crystal') {
              // Add prismatic effect
              const prism = (x + y) % 3
              newData[idx + prism] = Math.min(255, newData[idx + prism] * 1.2)
            }
          }
        }
      }
    }
    
    ctx.putImageData(newImageData, 0, 0)
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