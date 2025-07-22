// Delaunay triangulation for mesh-based morphing

export interface Point {
  x: number
  y: number
}

export interface Triangle {
  p1: Point
  p2: Point
  p3: Point
}

export class Delaunay {
  private points: Point[]
  private triangles: Triangle[]
  
  constructor() {
    this.points = []
    this.triangles = []
  }
  
  addPoint(point: Point) {
    this.points.push(point)
  }
  
  // Simple triangulation using Bowyer-Watson algorithm
  triangulate(): Triangle[] {
    if (this.points.length < 3) return []
    
    // Create super triangle that contains all points
    const minX = Math.min(...this.points.map(p => p.x))
    const maxX = Math.max(...this.points.map(p => p.x))
    const minY = Math.min(...this.points.map(p => p.y))
    const maxY = Math.max(...this.points.map(p => p.y))
    
    const dx = maxX - minX
    const dy = maxY - minY
    const deltaMax = Math.max(dx, dy)
    const midX = (minX + maxX) / 2
    const midY = (minY + maxY) / 2
    
    const superTriangle: Triangle = {
      p1: { x: midX - 20 * deltaMax, y: midY - deltaMax },
      p2: { x: midX, y: midY + 20 * deltaMax },
      p3: { x: midX + 20 * deltaMax, y: midY - deltaMax }
    }
    
    this.triangles = [superTriangle]
    
    // Add points one by one
    for (const point of this.points) {
      const badTriangles: Triangle[] = []
      
      // Find triangles whose circumcircle contains the point
      for (const triangle of this.triangles) {
        if (this.pointInCircumcircle(point, triangle)) {
          badTriangles.push(triangle)
        }
      }
      
      // Find the boundary of the polygonal hole
      const polygon: Array<[Point, Point]> = []
      
      for (const triangle of badTriangles) {
        const edges: Array<[Point, Point]> = [
          [triangle.p1, triangle.p2],
          [triangle.p2, triangle.p3],
          [triangle.p3, triangle.p1]
        ]
        
        for (const edge of edges) {
          let isShared = false
          
          for (const otherTriangle of badTriangles) {
            if (triangle === otherTriangle) continue
            
            if (this.triangleHasEdge(otherTriangle, edge)) {
              isShared = true
              break
            }
          }
          
          if (!isShared) {
            polygon.push(edge)
          }
        }
      }
      
      // Remove bad triangles
      this.triangles = this.triangles.filter(t => !badTriangles.includes(t))
      
      // Re-triangulate the polygonal hole
      for (const edge of polygon) {
        this.triangles.push({
          p1: edge[0],
          p2: edge[1],
          p3: point
        })
      }
    }
    
    // Remove triangles that share vertices with super triangle
    this.triangles = this.triangles.filter(triangle => {
      return !this.pointEquals(triangle.p1, superTriangle.p1) &&
             !this.pointEquals(triangle.p1, superTriangle.p2) &&
             !this.pointEquals(triangle.p1, superTriangle.p3) &&
             !this.pointEquals(triangle.p2, superTriangle.p1) &&
             !this.pointEquals(triangle.p2, superTriangle.p2) &&
             !this.pointEquals(triangle.p2, superTriangle.p3) &&
             !this.pointEquals(triangle.p3, superTriangle.p1) &&
             !this.pointEquals(triangle.p3, superTriangle.p2) &&
             !this.pointEquals(triangle.p3, superTriangle.p3)
    })
    
    return this.triangles
  }
  
  private pointInCircumcircle(point: Point, triangle: Triangle): boolean {
    const ax = triangle.p1.x - point.x
    const ay = triangle.p1.y - point.y
    const bx = triangle.p2.x - point.x
    const by = triangle.p2.y - point.y
    const cx = triangle.p3.x - point.x
    const cy = triangle.p3.y - point.y
    
    const det = (ax * ax + ay * ay) * (bx * cy - cx * by) -
                (bx * bx + by * by) * (ax * cy - cx * ay) +
                (cx * cx + cy * cy) * (ax * by - bx * ay)
    
    return det > 0
  }
  
  private triangleHasEdge(triangle: Triangle, edge: [Point, Point]): boolean {
    const hasP1P2 = (this.pointEquals(triangle.p1, edge[0]) && this.pointEquals(triangle.p2, edge[1])) ||
                    (this.pointEquals(triangle.p1, edge[1]) && this.pointEquals(triangle.p2, edge[0]))
    const hasP2P3 = (this.pointEquals(triangle.p2, edge[0]) && this.pointEquals(triangle.p3, edge[1])) ||
                    (this.pointEquals(triangle.p2, edge[1]) && this.pointEquals(triangle.p3, edge[0]))
    const hasP3P1 = (this.pointEquals(triangle.p3, edge[0]) && this.pointEquals(triangle.p1, edge[1])) ||
                    (this.pointEquals(triangle.p3, edge[1]) && this.pointEquals(triangle.p1, edge[0]))
    
    return hasP1P2 || hasP2P3 || hasP3P1
  }
  
  private pointEquals(p1: Point, p2: Point): boolean {
    return Math.abs(p1.x - p2.x) < 0.0001 && Math.abs(p1.y - p2.y) < 0.0001
  }
}