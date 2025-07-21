import { useEffect, useRef } from 'react'
import { Application, Container } from 'pixi.js'
import { useStore } from '../../store'

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef = useRef<Application | null>(null)
  const containerRef = useRef<Container | null>(null)
  
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
      
      return () => {
        window.removeEventListener('resize', handleResize)
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
    
    // Clear previous content
    containerRef.current.removeChildren()
    
    // Load and display image
    // Image loading logic will be implemented here
    
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