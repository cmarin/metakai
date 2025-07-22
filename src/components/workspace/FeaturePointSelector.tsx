import React, { useState, useRef, useEffect } from 'react'
import type { FeaturePoint } from '../../utils/morphing/morph-engine'

interface FeaturePointSelectorProps {
  sourceImage: HTMLImageElement | null
  targetImage: HTMLImageElement | null
  featurePoints: FeaturePoint[]
  onFeaturePointsChange: (points: FeaturePoint[]) => void
}

export function FeaturePointSelector({ 
  sourceImage, 
  targetImage, 
  featurePoints, 
  onFeaturePointsChange 
}: FeaturePointSelectorProps) {
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null)
  const targetCanvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)
  const [isAddingPoint, setIsAddingPoint] = useState(false)
  const [nextPointSide, setNextPointSide] = useState<'source' | 'target'>('source')
  const [tempPoint, setTempPoint] = useState<Partial<FeaturePoint> | null>(null)
  const animationFrameRef = useRef<number>(0)
  const [canvasesReady, setCanvasesReady] = useState(false)
  
  // Ensure canvases are properly sized when images change
  useEffect(() => {
    if (sourceImage && targetImage && sourceCanvasRef.current && targetCanvasRef.current) {
      sourceCanvasRef.current.width = sourceImage.width
      sourceCanvasRef.current.height = sourceImage.height
      targetCanvasRef.current.width = targetImage.width
      targetCanvasRef.current.height = targetImage.height
      setCanvasesReady(true)
    }
  }, [sourceImage, targetImage])
  
  // Draw images and points with animation
  useEffect(() => {
    // Ensure both images are loaded before drawing
    if (!sourceImage || !targetImage || !canvasesReady) return
    
    const isMobile = window.innerWidth < 768
    
    if (isMobile && (featurePoints.length > 0 || tempPoint)) {
      // Animate on mobile for better visibility
      const animate = () => {
        animationFrameRef.current = (animationFrameRef.current + 1) % 120
        drawCanvas('source')
        drawCanvas('target')
        requestAnimationFrame(animate)
      }
      const animId = requestAnimationFrame(animate)
      
      return () => cancelAnimationFrame(animId)
    } else {
      // Static drawing on desktop
      drawCanvas('source')
      drawCanvas('target')
    }
  }, [sourceImage, targetImage, featurePoints, selectedPointId, tempPoint, canvasesReady])
  
  const drawCanvas = (side: 'source' | 'target') => {
    const canvas = side === 'source' ? sourceCanvasRef.current : targetCanvasRef.current
    const image = side === 'source' ? sourceImage : targetImage
    
    if (!canvas || !image) {
      console.warn(`Missing ${side} canvas or image`, { canvas: !!canvas, image: !!image })
      return
    }
    
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    
    // Determine point size based on screen size
    const isMobile = window.innerWidth < 768
    const baseRadius = isMobile ? 20 : 10
    // Add pulsing effect on mobile
    const pulseAmount = isMobile ? Math.sin(animationFrameRef.current * 0.05) * 3 : 0
    const pointRadius = baseRadius + pulseAmount
    
    // Draw feature points
    featurePoints.forEach(point => {
      const x = side === 'source' ? point.sourceX : point.targetX
      const y = side === 'source' ? point.sourceY : point.targetY
      
      // Draw shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 5
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      
      // Draw outer white ring for contrast
      ctx.beginPath()
      ctx.arc(x, y, pointRadius + 4, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      
      // Draw black border
      ctx.beginPath()
      ctx.arc(x, y, pointRadius + 2, 0, Math.PI * 2)
      ctx.fillStyle = '#000000'
      ctx.fill()
      
      // Reset shadow
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      
      // Draw inner colored point
      ctx.beginPath()
      ctx.arc(x, y, pointRadius, 0, Math.PI * 2)
      ctx.fillStyle = point.id === selectedPointId ? '#ff0000' : '#00ff00'
      ctx.fill()
      
      // Draw connections to corresponding point
      if (featurePoints.length > 1) {
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)'
        ctx.lineWidth = 1
        
        // Connect to neighbors in a simple way
        const sortedPoints = [...featurePoints].sort((a, b) => {
          const ax = side === 'source' ? a.sourceX : a.targetX
          const bx = side === 'source' ? b.sourceX : b.targetX
          return ax - bx
        })
        
        const idx = sortedPoints.findIndex(p => p.id === point.id)
        if (idx > 0) {
          const prev = sortedPoints[idx - 1]
          const prevX = side === 'source' ? prev.sourceX : prev.targetX
          const prevY = side === 'source' ? prev.sourceY : prev.targetY
          ctx.moveTo(x, y)
          ctx.lineTo(prevX, prevY)
        }
        if (idx < sortedPoints.length - 1) {
          const next = sortedPoints[idx + 1]
          const nextX = side === 'source' ? next.sourceX : next.targetX
          const nextY = side === 'source' ? next.sourceY : next.targetY
          ctx.moveTo(x, y)
          ctx.lineTo(nextX, nextY)
        }
        ctx.stroke()
      }
    })
    
    // Draw temp point
    if (tempPoint && ((side === 'source' && tempPoint.sourceX) || (side === 'target' && tempPoint.targetX))) {
      const x = side === 'source' ? tempPoint.sourceX! : tempPoint.targetX!
      const y = side === 'source' ? tempPoint.sourceY! : tempPoint.targetY!
      
      // Draw shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 5
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      
      // Draw outer white ring for contrast
      ctx.beginPath()
      ctx.arc(x, y, pointRadius + 4, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      
      // Draw black border
      ctx.beginPath()
      ctx.arc(x, y, pointRadius + 2, 0, Math.PI * 2)
      ctx.fillStyle = '#000000'
      ctx.fill()
      
      // Reset shadow
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      
      // Draw inner yellow point (temp/pending)
      ctx.beginPath()
      ctx.arc(x, y, pointRadius, 0, Math.PI * 2)
      ctx.fillStyle = '#ffff00'
      ctx.fill()
    }
  }
  
  const getCoordinatesFromEvent = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    let clientX: number
    let clientY: number
    
    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0]
      clientX = touch.clientX
      clientY = touch.clientY
    } else {
      // Mouse event
      clientX = e.clientX
      clientY = e.clientY
    }
    
    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY
    
    return { x, y }
  }
  
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, side: 'source' | 'target') => {
    e.preventDefault() // Prevent default touch behavior
    const canvas = e.currentTarget
    const { x, y } = getCoordinatesFromEvent(e, canvas)
    
    if (isAddingPoint) {
      if (side === nextPointSide) {
        if (!tempPoint) {
          // First click - create temp point
          const newTempPoint: Partial<FeaturePoint> = {
            id: `point-${Date.now()}`
          }
          if (side === 'source') {
            newTempPoint.sourceX = x
            newTempPoint.sourceY = y
          } else {
            newTempPoint.targetX = x
            newTempPoint.targetY = y
          }
          setTempPoint(newTempPoint)
          setNextPointSide(side === 'source' ? 'target' : 'source')
        }
      } else {
        // Second click - complete the point
        if (tempPoint) {
          const completePoint: FeaturePoint = {
            ...tempPoint as FeaturePoint
          }
          if (side === 'source') {
            completePoint.sourceX = x
            completePoint.sourceY = y
          } else {
            completePoint.targetX = x
            completePoint.targetY = y
          }
          onFeaturePointsChange([...featurePoints, completePoint])
          setTempPoint(null)
          setNextPointSide('source')
        }
      }
    } else {
      // Select existing point
      const clickedPoint = featurePoints.find(point => {
        const px = side === 'source' ? point.sourceX : point.targetX
        const py = side === 'source' ? point.sourceY : point.targetY
        const isMobile = window.innerWidth < 768
        const clickRadius = isMobile ? 25 : 15
        return Math.sqrt((px - x) ** 2 + (py - y) ** 2) < clickRadius
      })
      
      if (clickedPoint) {
        setSelectedPointId(clickedPoint.id)
      } else {
        setSelectedPointId(null)
      }
    }
  }
  
  const deleteSelectedPoint = () => {
    if (selectedPointId) {
      onFeaturePointsChange(featurePoints.filter(p => p.id !== selectedPointId))
      setSelectedPointId(null)
    }
  }
  
  const clearAllPoints = () => {
    onFeaturePointsChange([])
    setSelectedPointId(null)
    setTempPoint(null)
  }
  
  const addDefaultPoints = () => {
    if (!sourceImage || !targetImage) return
    
    const sourceWidth = sourceCanvasRef.current?.width || sourceImage.width
    const sourceHeight = sourceCanvasRef.current?.height || sourceImage.height
    const targetWidth = targetCanvasRef.current?.width || targetImage.width
    const targetHeight = targetCanvasRef.current?.height || targetImage.height
    
    // Add points for common features (simplified)
    const defaultPoints: FeaturePoint[] = [
      // Center
      {
        id: 'center',
        sourceX: sourceWidth / 2,
        sourceY: sourceHeight / 2,
        targetX: targetWidth / 2,
        targetY: targetHeight / 2
      },
      // Quarters
      {
        id: 'tl-quarter',
        sourceX: sourceWidth * 0.25,
        sourceY: sourceHeight * 0.25,
        targetX: targetWidth * 0.25,
        targetY: targetHeight * 0.25
      },
      {
        id: 'tr-quarter',
        sourceX: sourceWidth * 0.75,
        sourceY: sourceHeight * 0.25,
        targetX: targetWidth * 0.75,
        targetY: targetHeight * 0.25
      },
      {
        id: 'bl-quarter',
        sourceX: sourceWidth * 0.25,
        sourceY: sourceHeight * 0.75,
        targetX: targetWidth * 0.25,
        targetY: targetHeight * 0.75
      },
      {
        id: 'br-quarter',
        sourceX: sourceWidth * 0.75,
        sourceY: sourceHeight * 0.75,
        targetX: targetWidth * 0.75,
        targetY: targetHeight * 0.75
      }
    ]
    
    onFeaturePointsChange(defaultPoints)
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => {
            setIsAddingPoint(!isAddingPoint)
            setTempPoint(null)
            setNextPointSide('source')
          }}
          className={`px-4 py-2 rounded text-sm min-h-[44px] ${
            isAddingPoint 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          {isAddingPoint ? `Tap ${nextPointSide} image` : 'Add Point'}
        </button>
        
        <button
          onClick={deleteSelectedPoint}
          disabled={!selectedPointId}
          className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-400 min-h-[44px]"
        >
          Delete Selected
        </button>
        
        <button
          onClick={clearAllPoints}
          disabled={featurePoints.length === 0}
          className="px-4 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:bg-gray-400 min-h-[44px]"
        >
          Clear All
        </button>
        
        <button
          onClick={addDefaultPoints}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 min-h-[44px]"
        >
          Auto Points
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-2 md:gap-4">
        <div>
          <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Source Points ({featurePoints.length})
          </h4>
          <div className="relative bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
            <canvas
              ref={sourceCanvasRef}
              width={sourceImage?.width || 400}
              height={sourceImage?.height || 300}
              onClick={(e) => handleCanvasClick(e, 'source')}
              onTouchStart={(e) => handleCanvasClick(e, 'source')}
              className="w-full h-auto cursor-crosshair touch-none"
              style={{ maxHeight: '200px' }}
            />
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Target Points ({featurePoints.length})
          </h4>
          <div className="relative bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
            <canvas
              ref={targetCanvasRef}
              width={targetImage?.width || 400}
              height={targetImage?.height || 300}
              onClick={(e) => handleCanvasClick(e, 'target')}
              onTouchStart={(e) => handleCanvasClick(e, 'target')}
              className="w-full h-auto cursor-crosshair touch-none"
              style={{ maxHeight: '200px' }}
            />
          </div>
        </div>
      </div>
      
      <div className="text-xs text-gray-600 dark:text-gray-400 text-center px-2">
        Tap "Add Point" then tap corresponding features in both images.
        Green = placed, red = selected, yellow = pending.
      </div>
    </div>
  )
}