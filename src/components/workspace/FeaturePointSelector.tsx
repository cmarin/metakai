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
  
  // Draw images and points
  useEffect(() => {
    drawCanvas('source')
    drawCanvas('target')
  }, [sourceImage, targetImage, featurePoints, selectedPointId, tempPoint])
  
  const drawCanvas = (side: 'source' | 'target') => {
    const canvas = side === 'source' ? sourceCanvasRef.current : targetCanvasRef.current
    const image = side === 'source' ? sourceImage : targetImage
    
    if (!canvas || !image) return
    
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    
    // Draw feature points
    featurePoints.forEach(point => {
      const x = side === 'source' ? point.sourceX : point.targetX
      const y = side === 'source' ? point.sourceY : point.targetY
      
      // Draw point
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fillStyle = point.id === selectedPointId ? '#ff0000' : '#00ff00'
      ctx.fill()
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.stroke()
      
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
      
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#ffff00'
      ctx.fill()
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }
  
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>, side: 'source' | 'target') => {
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    
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
        return Math.sqrt((px - x) ** 2 + (py - y) ** 2) < 10
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
    
    const width = sourceCanvasRef.current?.width || 800
    const height = sourceCanvasRef.current?.height || 600
    
    // Add points for common features (simplified)
    const defaultPoints: FeaturePoint[] = [
      // Center
      {
        id: 'center',
        sourceX: width / 2,
        sourceY: height / 2,
        targetX: width / 2,
        targetY: height / 2
      },
      // Quarters
      {
        id: 'tl-quarter',
        sourceX: width * 0.25,
        sourceY: height * 0.25,
        targetX: width * 0.25,
        targetY: height * 0.25
      },
      {
        id: 'tr-quarter',
        sourceX: width * 0.75,
        sourceY: height * 0.25,
        targetX: width * 0.75,
        targetY: height * 0.25
      },
      {
        id: 'bl-quarter',
        sourceX: width * 0.25,
        sourceY: height * 0.75,
        targetX: width * 0.25,
        targetY: height * 0.75
      },
      {
        id: 'br-quarter',
        sourceX: width * 0.75,
        sourceY: height * 0.75,
        targetX: width * 0.75,
        targetY: height * 0.75
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
          className={`px-3 py-1 rounded text-sm ${
            isAddingPoint 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          {isAddingPoint ? `Click ${nextPointSide} image` : 'Add Point'}
        </button>
        
        <button
          onClick={deleteSelectedPoint}
          disabled={!selectedPointId}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-400"
        >
          Delete Selected
        </button>
        
        <button
          onClick={clearAllPoints}
          disabled={featurePoints.length === 0}
          className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:bg-gray-400"
        >
          Clear All
        </button>
        
        <button
          onClick={addDefaultPoints}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Auto Points
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              className="w-full h-auto cursor-crosshair"
              style={{ maxHeight: '300px', objectFit: 'contain' }}
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
              className="w-full h-auto cursor-crosshair"
              style={{ maxHeight: '300px', objectFit: 'contain' }}
            />
          </div>
        </div>
      </div>
      
      <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
        Click "Add Point" then click corresponding features in both images.
        Green points are placed, red is selected.
      </div>
    </div>
  )
}