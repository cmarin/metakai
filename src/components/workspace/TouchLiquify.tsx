import { useEffect, useRef } from 'react'

interface TouchLiquifyProps {
  canvas: HTMLCanvasElement
  brushSize: number
  strength: number
  mode: string
}

export function useTouchLiquify({ canvas, brushSize, strength, mode }: TouchLiquifyProps) {
  const isDrawingRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })
  
  useEffect(() => {
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const handleStart = (e: MouseEvent | TouchEvent) => {
      isDrawingRef.current = true
      const point = 'touches' in e ? e.touches[0] : e
      const rect = canvas.getBoundingClientRect()
      lastPosRef.current = {
        x: point.clientX - rect.left,
        y: point.clientY - rect.top
      }
    }
    
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current) return
      
      const point = 'touches' in e ? e.touches[0] : e
      const rect = canvas.getBoundingClientRect()
      const currentPos = {
        x: point.clientX - rect.left,
        y: point.clientY - rect.top
      }
      
      // Apply liquify effect along the path
      applyLiquifyBrush(ctx, canvas.width, canvas.height, lastPosRef.current, currentPos, brushSize, strength, mode)
      
      lastPosRef.current = currentPos
    }
    
    const handleEnd = () => {
      isDrawingRef.current = false
    }
    
    // Mouse events
    canvas.addEventListener('mousedown', handleStart)
    canvas.addEventListener('mousemove', handleMove)
    canvas.addEventListener('mouseup', handleEnd)
    canvas.addEventListener('mouseleave', handleEnd)
    
    // Touch events
    canvas.addEventListener('touchstart', handleStart)
    canvas.addEventListener('touchmove', handleMove)
    canvas.addEventListener('touchend', handleEnd)
    
    return () => {
      canvas.removeEventListener('mousedown', handleStart)
      canvas.removeEventListener('mousemove', handleMove)
      canvas.removeEventListener('mouseup', handleEnd)
      canvas.removeEventListener('mouseleave', handleEnd)
      canvas.removeEventListener('touchstart', handleStart)
      canvas.removeEventListener('touchmove', handleMove)
      canvas.removeEventListener('touchend', handleEnd)
    }
  }, [canvas, brushSize, strength, mode])
}

function applyLiquifyBrush(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  lastPos: { x: number; y: number },
  currentPos: { x: number; y: number },
  brushSize: number,
  strength: number,
  mode: string
) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const newImageData = ctx.createImageData(width, height)
  const newData = newImageData.data
  
  // Copy original data
  newData.set(data)
  
  const dx = currentPos.x - lastPos.x
  const dy = currentPos.y - lastPos.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  if (distance === 0) return
  
  // Apply effect in brush area
  for (let y = Math.max(0, currentPos.y - brushSize); y < Math.min(height, currentPos.y + brushSize); y++) {
    for (let x = Math.max(0, currentPos.x - brushSize); x < Math.min(width, currentPos.x + brushSize); x++) {
      const dist = Math.sqrt((x - currentPos.x) ** 2 + (y - currentPos.y) ** 2)
      
      if (dist < brushSize) {
        const effect = (1 - dist / brushSize) * strength
        let sourceX = x
        let sourceY = y
        
        switch (mode) {
          case 'smear':
            sourceX = x - dx * effect
            sourceY = y - dy * effect
            break
          case 'twirl':
            const angle = Math.atan2(y - currentPos.y, x - currentPos.x)
            const newAngle = angle + effect * Math.PI / 4
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
        
        // Clamp coordinates
        sourceX = Math.max(0, Math.min(width - 1, Math.round(sourceX)))
        sourceY = Math.max(0, Math.min(height - 1, Math.round(sourceY)))
        
        const targetIdx = (y * width + x) * 4
        const sourceIdx = (sourceY * width + sourceX) * 4
        
        newData[targetIdx] = data[sourceIdx]
        newData[targetIdx + 1] = data[sourceIdx + 1]
        newData[targetIdx + 2] = data[sourceIdx + 2]
        newData[targetIdx + 3] = data[sourceIdx + 3]
      }
    }
  }
  
  ctx.putImageData(newImageData, 0, 0)
}