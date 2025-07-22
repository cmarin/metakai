import { Delaunay } from './delaunay'
import type { Point } from './delaunay'

export interface FeaturePoint {
  id: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
}

export class MorphEngine {
  private sourceCanvas: HTMLCanvasElement
  private targetCanvas: HTMLCanvasElement
  private sourceCtx: CanvasRenderingContext2D
  private targetCtx: CanvasRenderingContext2D
  private width: number
  private height: number
  
  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    
    this.sourceCanvas = document.createElement('canvas')
    this.targetCanvas = document.createElement('canvas')
    this.sourceCanvas.width = width
    this.sourceCanvas.height = height
    this.targetCanvas.width = width
    this.targetCanvas.height = height
    
    this.sourceCtx = this.sourceCanvas.getContext('2d')!
    this.targetCtx = this.targetCanvas.getContext('2d')!
  }
  
  setSourceImage(image: HTMLImageElement) {
    this.sourceCtx.drawImage(image, 0, 0, this.width, this.height)
  }
  
  setTargetImage(image: HTMLImageElement) {
    this.targetCtx.drawImage(image, 0, 0, this.width, this.height)
  }
  
  morph(featurePoints: FeaturePoint[], t: number): ImageData {
    // Add corner points to ensure full coverage
    const allPoints = this.addCornerPoints(featurePoints)
    
    // Create Delaunay triangulation for source points
    const sourceDelaunay = new Delaunay()
    const targetDelaunay = new Delaunay()
    
    for (const fp of allPoints) {
      sourceDelaunay.addPoint({ x: fp.sourceX, y: fp.sourceY })
      targetDelaunay.addPoint({ x: fp.targetX, y: fp.targetY })
    }
    
    const sourceTriangles = sourceDelaunay.triangulate()
    
    // Create intermediate points
    const intermediatePoints = allPoints.map(fp => ({
      x: fp.sourceX * (1 - t) + fp.targetX * t,
      y: fp.sourceY * (1 - t) + fp.targetY * t,
      sourceX: fp.sourceX,
      sourceY: fp.sourceY,
      targetX: fp.targetX,
      targetY: fp.targetY
    }))
    
    // Create output canvas
    const outputCanvas = document.createElement('canvas')
    outputCanvas.width = this.width
    outputCanvas.height = this.height
    const outputCtx = outputCanvas.getContext('2d')!
    
    // Clear output
    outputCtx.clearRect(0, 0, this.width, this.height)
    
    // Warp and blend each triangle
    for (let i = 0; i < sourceTriangles.length; i++) {
      const triangle = sourceTriangles[i]
      
      // Find corresponding points in intermediate configuration
      const p1Idx = this.findPointIndex(allPoints, triangle.p1.x, triangle.p1.y, true)
      const p2Idx = this.findPointIndex(allPoints, triangle.p2.x, triangle.p2.y, true)
      const p3Idx = this.findPointIndex(allPoints, triangle.p3.x, triangle.p3.y, true)
      
      if (p1Idx === -1 || p2Idx === -1 || p3Idx === -1) continue
      
      // Source triangle vertices
      const srcP1 = { x: allPoints[p1Idx].sourceX, y: allPoints[p1Idx].sourceY }
      const srcP2 = { x: allPoints[p2Idx].sourceX, y: allPoints[p2Idx].sourceY }
      const srcP3 = { x: allPoints[p3Idx].sourceX, y: allPoints[p3Idx].sourceY }
      
      // Target triangle vertices
      const tgtP1 = { x: allPoints[p1Idx].targetX, y: allPoints[p1Idx].targetY }
      const tgtP2 = { x: allPoints[p2Idx].targetX, y: allPoints[p2Idx].targetY }
      const tgtP3 = { x: allPoints[p3Idx].targetX, y: allPoints[p3Idx].targetY }
      
      // Intermediate triangle vertices
      const intP1 = intermediatePoints[p1Idx]
      const intP2 = intermediatePoints[p2Idx]
      const intP3 = intermediatePoints[p3Idx]
      
      // Warp source triangle to intermediate position
      this.warpTriangle(
        this.sourceCanvas, outputCanvas,
        srcP1, srcP2, srcP3,
        intP1, intP2, intP3,
        1 - t
      )
      
      // Warp target triangle to intermediate position
      this.warpTriangle(
        this.targetCanvas, outputCanvas,
        tgtP1, tgtP2, tgtP3,
        intP1, intP2, intP3,
        t
      )
    }
    
    return outputCtx.getImageData(0, 0, this.width, this.height)
  }
  
  private addCornerPoints(featurePoints: FeaturePoint[]): FeaturePoint[] {
    const corners: FeaturePoint[] = [
      { id: 'corner-tl', sourceX: 0, sourceY: 0, targetX: 0, targetY: 0 },
      { id: 'corner-tr', sourceX: this.width, sourceY: 0, targetX: this.width, targetY: 0 },
      { id: 'corner-bl', sourceX: 0, sourceY: this.height, targetX: 0, targetY: this.height },
      { id: 'corner-br', sourceX: this.width, sourceY: this.height, targetX: this.width, targetY: this.height },
      // Add edge midpoints for better triangulation
      { id: 'edge-t', sourceX: this.width / 2, sourceY: 0, targetX: this.width / 2, targetY: 0 },
      { id: 'edge-b', sourceX: this.width / 2, sourceY: this.height, targetX: this.width / 2, targetY: this.height },
      { id: 'edge-l', sourceX: 0, sourceY: this.height / 2, targetX: 0, targetY: this.height / 2 },
      { id: 'edge-r', sourceX: this.width, sourceY: this.height / 2, targetX: this.width, targetY: this.height / 2 }
    ]
    
    return [...featurePoints, ...corners]
  }
  
  private findPointIndex(points: FeaturePoint[], x: number, y: number, isSource: boolean): number {
    for (let i = 0; i < points.length; i++) {
      const px = isSource ? points[i].sourceX : points[i].targetX
      const py = isSource ? points[i].sourceY : points[i].targetY
      if (Math.abs(px - x) < 0.1 && Math.abs(py - y) < 0.1) {
        return i
      }
    }
    return -1
  }
  
  private warpTriangle(
    srcCanvas: HTMLCanvasElement,
    dstCanvas: HTMLCanvasElement,
    srcP1: Point, srcP2: Point, srcP3: Point,
    dstP1: Point, dstP2: Point, dstP3: Point,
    alpha: number
  ) {
    const ctx = dstCanvas.getContext('2d')!
    
    // Calculate affine transformation matrix
    const matrix = this.getAffineTransform(
      srcP1, srcP2, srcP3,
      dstP1, dstP2, dstP3
    )
    
    if (!matrix) return
    
    // Save context state
    ctx.save()
    
    // Set clipping path to destination triangle
    ctx.beginPath()
    ctx.moveTo(dstP1.x, dstP1.y)
    ctx.lineTo(dstP2.x, dstP2.y)
    ctx.lineTo(dstP3.x, dstP3.y)
    ctx.closePath()
    ctx.clip()
    
    // Apply transformation and draw
    ctx.globalAlpha = alpha
    ctx.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f)
    ctx.drawImage(srcCanvas, 0, 0)
    
    // Restore context
    ctx.restore()
  }
  
  private getAffineTransform(
    srcP1: Point, srcP2: Point, srcP3: Point,
    dstP1: Point, dstP2: Point, dstP3: Point
  ): { a: number; b: number; c: number; d: number; e: number; f: number } | null {
    // Solve the system of equations for affine transformation
    const x1s = srcP1.x, y1s = srcP1.y
    const x2s = srcP2.x, y2s = srcP2.y
    const x3s = srcP3.x, y3s = srcP3.y
    
    const x1d = dstP1.x, y1d = dstP1.y
    const x2d = dstP2.x, y2d = dstP2.y
    const x3d = dstP3.x, y3d = dstP3.y
    
    const det = x1s * (y2s - y3s) + x2s * (y3s - y1s) + x3s * (y1s - y2s)
    
    if (Math.abs(det) < 0.0001) return null
    
    const a = ((x1d - x3d) * (y2s - y3s) - (x2d - x3d) * (y1s - y3s)) / det
    const b = ((x2d - x3d) * (x1s - x3s) - (x1d - x3d) * (x2s - x3s)) / det
    const c = ((y1d - y3d) * (y2s - y3s) - (y2d - y3d) * (y1s - y3s)) / det
    const d = ((y2d - y3d) * (x1s - x3s) - (y1d - y3d) * (x2s - x3s)) / det
    const e = x3d - a * x3s - b * y3s
    const f = y3d - c * x3s - d * y3s
    
    return { a, b, c, d, e, f }
  }
}