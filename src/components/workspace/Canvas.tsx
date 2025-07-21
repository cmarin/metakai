import { useEffect, useRef } from 'react'
import { Application, Container, Sprite, Texture } from 'pixi.js'
import { useStore } from '../../store'

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef = useRef<Application | null>(null)
  const containerRef = useRef<Container | null>(null)
  const isDraggingRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })
  
  const { image, zoom, pan } = useStore((state) => state.workspace)
  const activeFilter = useStore((state) => state.filter.activeFilter)
  
  useEffect(() => {
    if (!canvasRef.current) return
    
    const initPixi = async () => {
      const app = new Application()
      await app.init({
        canvas: canvasRef.current!,
        width: canvasRef.current!.clientWidth,
        height: canvasRef.current!.clientHeight,
        backgroundColor: 0x1a1a1a,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
      })
      
      appRef.current = app
      
      const container = new Container()
      app.stage.addChild(container)
      containerRef.current = container
      
      // Handle resize
      const handleResize = () => {
        if (canvasRef.current && app) {
          app.renderer.resize(
            canvasRef.current.clientWidth,
            canvasRef.current.clientHeight
          )
        }
      }
      
      window.addEventListener('resize', handleResize)
      
      // Add mouse/touch interaction
      const handlePointerDown = (e: PointerEvent) => {
        isDraggingRef.current = true
        lastPosRef.current = { x: e.clientX, y: e.clientY }
        canvasRef.current!.style.cursor = 'grabbing'
      }
      
      const handlePointerMove = (e: PointerEvent) => {
        if (!isDraggingRef.current) return
        
        const dx = e.clientX - lastPosRef.current.x
        const dy = e.clientY - lastPosRef.current.y
        
        const currentPan = useStore.getState().workspace.pan
        useStore.getState().setPan({
          x: currentPan.x + dx,
          y: currentPan.y + dy
        })
        
        lastPosRef.current = { x: e.clientX, y: e.clientY }
      }
      
      const handlePointerUp = () => {
        isDraggingRef.current = false
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'grab'
        }
      }
      
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        const currentZoom = useStore.getState().workspace.zoom
        useStore.getState().setZoom(currentZoom * delta)
      }
      
      canvasRef.current!.addEventListener('pointerdown', handlePointerDown)
      canvasRef.current!.addEventListener('pointermove', handlePointerMove)
      canvasRef.current!.addEventListener('pointerup', handlePointerUp)
      canvasRef.current!.addEventListener('pointerleave', handlePointerUp)
      canvasRef.current!.addEventListener('wheel', handleWheel, { passive: false })
      canvasRef.current!.style.cursor = 'grab'
      
      return () => {
        window.removeEventListener('resize', handleResize)
        canvasRef.current?.removeEventListener('pointerdown', handlePointerDown)
        canvasRef.current?.removeEventListener('pointermove', handlePointerMove)
        canvasRef.current?.removeEventListener('pointerup', handlePointerUp)
        canvasRef.current?.removeEventListener('pointerleave', handlePointerUp)
        canvasRef.current?.removeEventListener('wheel', handleWheel)
        app.destroy(true, { children: true })
      }
    }
    
    initPixi()
  }, [])
  
  // Update container transform when zoom/pan changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scale.set(zoom)
      containerRef.current.position.set(pan.x, pan.y)
    }
  }, [zoom, pan])
  
  // Handle image loading
  useEffect(() => {
    if (!appRef.current || !containerRef.current || !image) return
    
    const loadImage = async () => {
      try {
        // Clear previous content
        containerRef.current!.removeChildren()
        
        // Create texture from image URL (PIXI v8 method)
        const texture = await Texture.from(image.url)
        const sprite = new Sprite(texture)
        
        // Center the image in the canvas
        const canvasWidth = appRef.current!.renderer.width
        const canvasHeight = appRef.current!.renderer.height
        
        // Scale image to fit canvas while maintaining aspect ratio
        const scale = Math.min(
          canvasWidth / image.width,
          canvasHeight / image.height
        ) * 0.8 // 80% of canvas size for padding
        
        sprite.scale.set(scale)
        
        // Center the sprite
        sprite.anchor.set(0.5)
        sprite.position.set(canvasWidth / 2, canvasHeight / 2)
        
        // Add to container
        containerRef.current!.addChild(sprite)
        
        // Reset zoom and pan for new image
        useStore.getState().setZoom(1)
        useStore.getState().setPan({ x: 0, y: 0 })
      } catch (error) {
        console.error('Failed to load image:', error)
      }
    }
    
    loadImage()
  }, [image])
  
  // Handle filter changes
  useEffect(() => {
    if (!activeFilter) return
    
    // Apply filter logic will be implemented here
    
  }, [activeFilter])
  
  return (
    <div className="relative w-full h-full bg-gray-900">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      />
    </div>
  )
}