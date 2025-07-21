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
        case 'materializer':
          applyMaterializerFilter(ctx, canvas.width, canvas.height)
          break
        case 'fractal':
          applyFractalFilter(ctx, canvas.width, canvas.height)
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
              
            case 'spiral':
              // Spiral pattern using logarithmic spirals
              const spiralAngle = Math.atan2(ny, nx)
              const spiralDist = Math.sqrt(nx * nx + ny * ny)
              const spiralTwist = spiralAngle + Math.log(spiralDist + 0.1) * scale
              
              transformX = spiralDist * Math.cos(spiralTwist) * (1 + chaos * 0.5)
              transformY = spiralDist * Math.sin(spiralTwist) * (1 + chaos * 0.5)
              break
              
            case 'phoenix':
              // Phoenix pattern - rising flame with wing-like structures
              const wingSpread = Math.sin(nx * Math.PI * scale) * chaos
              const rise = -Math.abs(ny) * 2 + Math.sin(x * 0.1) * 0.5
              
              transformX = nx + wingSpread * Math.exp(-Math.abs(ny))
              transformY = ny + rise * chaos * 0.3
              
              // Add feather-like texture
              const feather = Math.sin(x * 0.2 * scale) * Math.cos(y * 0.1 * scale) * 0.1
              transformX += feather * chaos
              break
              
            case 'dragon':
              // Dragon pattern - serpentine curves with scale texture
              const dragonCurve = Math.sin(nx * Math.PI * 2 * scale) * Math.cos(ny * Math.PI)
              const scalePattern = Math.sin(x * 0.15 * scale) * Math.sin(y * 0.15 * scale)
              
              transformX = nx + dragonCurve * chaos
              transformY = ny + Math.sin(dragonCurve * 3) * chaos * 0.5
              
              // Add scale texture
              transformX += scalePattern * 0.1 * chaos
              transformY += scalePattern * 0.05 * chaos
              break
              
            case 'cosmic':
              // Cosmic pattern - galaxy spirals and nebula clouds
              const cosmicDist = Math.sqrt(nx * nx + ny * ny)
              const galacticAngle = Math.atan2(ny, nx) + cosmicDist * scale * 0.5
              const nebula = Math.sin(x * 0.03 * scale) * Math.cos(y * 0.03 * scale)
              const stars = Math.random() * 0.1
              
              transformX = cosmicDist * Math.cos(galacticAngle) + nebula * chaos
              transformY = cosmicDist * Math.sin(galacticAngle) + nebula * chaos * 0.7
              
              // Add starburst effect
              if (Math.random() < 0.01 * chaos) {
                transformX += stars
                transformY += stars
              }
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
            } else if (pattern === 'spiral') {
              // Psychedelic spiral colors
              const spiralColor = Math.atan2(transformY - centerY, transformX - centerX)
              newData[idx] = Math.min(255, newData[idx] * (1 + Math.sin(spiralColor * 3) * 0.3))
              newData[idx + 1] = Math.min(255, newData[idx + 1] * (1 + Math.cos(spiralColor * 3) * 0.3))
              newData[idx + 2] = Math.min(255, newData[idx + 2] * (1 + Math.sin(spiralColor * 3 + Math.PI) * 0.3))
            } else if (pattern === 'phoenix') {
              // Phoenix colors - orange to yellow gradient
              newData[idx] = Math.min(255, newData[idx] * 1.3)  // Red
              newData[idx + 1] = Math.min(255, newData[idx + 1] * (0.8 + transformY * 0.4))  // Green fades up
              newData[idx + 2] = Math.min(255, newData[idx + 2] * 0.6)  // Less blue
            } else if (pattern === 'dragon') {
              // Dragon colors - emerald greens with gold highlights
              newData[idx] = Math.min(255, newData[idx] * 0.8)
              newData[idx + 1] = Math.min(255, newData[idx + 1] * 1.2)
              newData[idx + 2] = Math.min(255, newData[idx + 2] * 0.7)
              // Add gold highlights
              if (Math.abs(transformX - nx) > chaos * 0.5) {
                newData[idx] = Math.min(255, newData[idx] * 1.4)
                newData[idx + 1] = Math.min(255, newData[idx + 1] * 1.2)
              }
            } else if (pattern === 'cosmic') {
              // Cosmic colors - deep blues and purples with star highlights
              newData[idx] = Math.min(255, newData[idx] * 0.7)
              newData[idx + 1] = Math.min(255, newData[idx + 1] * 0.6)
              newData[idx + 2] = Math.min(255, newData[idx + 2] * 1.3)
              // Star highlights
              if (Math.random() < 0.001) {
                newData[idx] = 255
                newData[idx + 1] = 255
                newData[idx + 2] = 255
              }
            }
          }
        }
      }
    }
    
    ctx.putImageData(newImageData, 0, 0)
  }
  
  const applyMaterializerFilter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const material = controls.find(c => c.id === 'material')?.value || 'chrome'
    const relief = (controls.find(c => c.id === 'relief')?.value as number) / 100 || 0.5
    const shine = (controls.find(c => c.id === 'shine')?.value as number) / 100 || 0.7
    const ambient = (controls.find(c => c.id === 'ambient')?.value as number) / 100 || 0.3
    
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    const newImageData = ctx.createImageData(width, height)
    const newData = newImageData.data
    
    // Create height map from luminance
    const heightMap = new Float32Array(width * height)
    for (let i = 0; i < data.length; i += 4) {
      const idx = i / 4
      const luminance = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255
      heightMap[idx] = luminance
    }
    
    // Apply material effect
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        const pixelIdx = y * width + x
        
        // Calculate surface normals from height map
        let nx = 0, ny = 0
        if (x > 0 && x < width - 1) {
          nx = (heightMap[pixelIdx + 1] - heightMap[pixelIdx - 1]) * relief * 10
        }
        if (y > 0 && y < height - 1) {
          ny = (heightMap[pixelIdx + width] - heightMap[pixelIdx - width]) * relief * 10
        }
        
        // Normalize the normal vector
        const nz = 1
        const length = Math.sqrt(nx * nx + ny * ny + nz * nz)
        nx /= length
        ny /= length
        const normalZ = nz / length
        
        // Light direction (from top-right)
        const lightX = 0.577
        const lightY = -0.577
        const lightZ = 0.577
        
        // Calculate diffuse lighting
        const diffuse = Math.max(0, nx * lightX + ny * lightY + normalZ * lightZ)
        
        // Calculate specular highlight
        const viewZ = 1
        const halfX = lightX
        const halfY = lightY
        const halfZ = (lightZ + viewZ) / 2
        const specularPower = material === 'chrome' ? 32 : material === 'gold' ? 16 : material === 'copper' ? 24 : 64
        const specular = Math.pow(Math.max(0, nx * halfX + ny * halfY + normalZ * halfZ), specularPower) * shine
        
        // Material colors
        let materialR = 1, materialG = 1, materialB = 1
        
        switch (material) {
          case 'chrome':
            // Chrome: silvery with blue tint
            materialR = 0.9
            materialG = 0.9
            materialB = 0.95
            break
          case 'gold':
            // Gold: warm yellow metallic
            materialR = 1.0
            materialG = 0.84
            materialB = 0.0
            break
          case 'copper':
            // Copper: reddish-brown metallic
            materialR = 0.95
            materialG = 0.64
            materialB = 0.54
            break
          case 'steel':
            // Steel: darker silver
            materialR = 0.7
            materialG = 0.7
            materialB = 0.75
            break
        }
        
        // Apply lighting model
        const lighting = ambient + diffuse * (1 - ambient)
        const highlight = specular * 255
        
        // Blend original color with material
        const originalLuminance = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) / 255
        
        newData[idx] = Math.min(255, originalLuminance * materialR * lighting * 255 + highlight)
        newData[idx + 1] = Math.min(255, originalLuminance * materialG * lighting * 255 + highlight * 0.95)
        newData[idx + 2] = Math.min(255, originalLuminance * materialB * lighting * 255 + highlight * 0.9)
        newData[idx + 3] = data[idx + 3]
      }
    }
    
    ctx.putImageData(newImageData, 0, 0)
  }
  
  const applyFractalFilter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const fractalType = controls.find(c => c.id === 'fractalType')?.value || 'julia'
    const zoom = (controls.find(c => c.id === 'zoom')?.value as number) / 100 * 4 + 0.5 || 1
    const iterations = controls.find(c => c.id === 'iterations')?.value as number || 128
    const colorScheme = controls.find(c => c.id === 'colorScheme')?.value || 'rainbow'
    const blendMode = controls.find(c => c.id === 'blendMode')?.value || 'replace'
    const opacity = (controls.find(c => c.id === 'opacity')?.value as number) / 100 || 1
    
    // Get original image data for blending
    const originalData = ctx.getImageData(0, 0, width, height)
    const newImageData = ctx.createImageData(width, height)
    const data = originalData.data
    const newData = newImageData.data
    
    // Fractal parameters
    let cx = -0.7, cy = 0.27015 // Julia set constants
    
    // For Mandelbrot, use different default view
    const xMin = fractalType === 'mandelbrot' ? -2.5 : -2
    const xMax = fractalType === 'mandelbrot' ? 1 : 2
    const yMin = fractalType === 'mandelbrot' ? -1.25 : -2
    const yMax = fractalType === 'mandelbrot' ? 1.25 : 2
    
    // Apply zoom
    const scaledXMin = xMin / zoom
    const scaledXMax = xMax / zoom
    const scaledYMin = yMin / zoom
    const scaledYMax = yMax / zoom
    
    // Julia set variations
    if (fractalType === 'julia2') {
      cx = -0.8
      cy = 0.156
    } else if (fractalType === 'julia3') {
      cx = 0.285
      cy = 0.01
    } else if (fractalType === 'julia4') {
      cx = -0.4
      cy = 0.6
    }
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        
        // Map pixel coordinates to complex plane
        const zx = scaledXMin + (x / width) * (scaledXMax - scaledXMin)
        const zy = scaledYMin + (y / height) * (scaledYMax - scaledYMin)
        
        let zx2 = zx
        let zy2 = zy
        
        // For Mandelbrot, c varies with position
        if (fractalType === 'mandelbrot') {
          cx = zx
          cy = zy
          zx2 = 0
          zy2 = 0
        }
        
        // Iterate the fractal equation
        let i = 0
        for (; i < iterations; i++) {
          const zx_temp = zx2 * zx2 - zy2 * zy2 + cx
          zy2 = 2 * zx2 * zy2 + cy
          zx2 = zx_temp
          
          // Check if point escapes
          if (zx2 * zx2 + zy2 * zy2 > 4) {
            break
          }
        }
        
        // Color based on iteration count
        let r = 0, g = 0, b = 0
        
        if (i < iterations) {
          const smooth = i + 1 - Math.log2(Math.log2(zx2 * zx2 + zy2 * zy2))
          const st = smooth / iterations
          
          switch (colorScheme) {
            case 'rainbow':
              // HSV to RGB conversion
              const h = st * 360
              const s = 1
              const v = i < iterations ? 1 : 0
              const c = v * s
              const x2 = c * (1 - Math.abs(((h / 60) % 2) - 1))
              const m = v - c
              
              if (h < 60) {
                r = c; g = x2; b = 0
              } else if (h < 120) {
                r = x2; g = c; b = 0
              } else if (h < 180) {
                r = 0; g = c; b = x2
              } else if (h < 240) {
                r = 0; g = x2; b = c
              } else if (h < 300) {
                r = x2; g = 0; b = c
              } else {
                r = c; g = 0; b = x2
              }
              
              r = (r + m) * 255
              g = (g + m) * 255
              b = (b + m) * 255
              break
              
            case 'fire':
              // Fire gradient: black -> red -> yellow -> white
              if (st < 0.33) {
                r = st * 3 * 255
                g = 0
                b = 0
              } else if (st < 0.66) {
                r = 255
                g = (st - 0.33) * 3 * 255
                b = 0
              } else {
                r = 255
                g = 255
                b = (st - 0.66) * 3 * 255
              }
              break
              
            case 'ocean':
              // Ocean gradient: dark blue -> cyan -> white
              if (st < 0.5) {
                r = 0
                g = st * 2 * 128
                b = 128 + st * 2 * 127
              } else {
                r = (st - 0.5) * 2 * 255
                g = 128 + (st - 0.5) * 2 * 127
                b = 255
              }
              break
              
            case 'psychedelic':
              // Psychedelic colors with sine waves
              r = Math.sin(st * Math.PI * 8) * 127 + 128
              g = Math.sin(st * Math.PI * 8 + Math.PI / 3) * 127 + 128
              b = Math.sin(st * Math.PI * 8 + 2 * Math.PI / 3) * 127 + 128
              break
          }
        }
        
        // Apply blend mode
        if (blendMode === 'replace') {
          newData[idx] = r
          newData[idx + 1] = g
          newData[idx + 2] = b
          newData[idx + 3] = 255
        } else if (blendMode === 'multiply') {
          newData[idx] = (data[idx] * r / 255) * opacity + data[idx] * (1 - opacity)
          newData[idx + 1] = (data[idx + 1] * g / 255) * opacity + data[idx + 1] * (1 - opacity)
          newData[idx + 2] = (data[idx + 2] * b / 255) * opacity + data[idx + 2] * (1 - opacity)
          newData[idx + 3] = data[idx + 3]
        } else if (blendMode === 'screen') {
          newData[idx] = (255 - (255 - data[idx]) * (255 - r) / 255) * opacity + data[idx] * (1 - opacity)
          newData[idx + 1] = (255 - (255 - data[idx + 1]) * (255 - g) / 255) * opacity + data[idx + 1] * (1 - opacity)
          newData[idx + 2] = (255 - (255 - data[idx + 2]) * (255 - b) / 255) * opacity + data[idx + 2] * (1 - opacity)
          newData[idx + 3] = data[idx + 3]
        } else if (blendMode === 'overlay') {
          const overlayBlend = (base: number, blend: number) => {
            return base < 128 ? (2 * base * blend / 255) : (255 - 2 * (255 - base) * (255 - blend) / 255)
          }
          newData[idx] = overlayBlend(data[idx], r) * opacity + data[idx] * (1 - opacity)
          newData[idx + 1] = overlayBlend(data[idx + 1], g) * opacity + data[idx + 1] * (1 - opacity)
          newData[idx + 2] = overlayBlend(data[idx + 2], b) * opacity + data[idx + 2] * (1 - opacity)
          newData[idx + 3] = data[idx + 3]
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