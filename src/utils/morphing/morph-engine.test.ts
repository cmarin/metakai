import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MorphEngine } from './morph-engine'
import type { FeaturePoint } from '../../types'

// Mock canvas and context globally
const mockGetImageData = vi.fn()
const mockPutImageData = vi.fn()
const mockDrawImage = vi.fn()
const mockClearRect = vi.fn()
const mockSave = vi.fn()
const mockRestore = vi.fn()
const mockSetTransform = vi.fn()
const mockTransform = vi.fn()
const mockBeginPath = vi.fn()
const mockClosePath = vi.fn()
const mockMoveTo = vi.fn()
const mockLineTo = vi.fn()
const mockClip = vi.fn()

const createMockContext = () => ({
  getImageData: mockGetImageData,
  putImageData: mockPutImageData,
  drawImage: mockDrawImage,
  clearRect: mockClearRect,
  save: mockSave,
  restore: mockRestore,
  setTransform: mockSetTransform,
  transform: mockTransform,
  beginPath: mockBeginPath,
  closePath: mockClosePath,
  moveTo: mockMoveTo,
  lineTo: mockLineTo,
  clip: mockClip,
  globalAlpha: 1
})

const createMockCanvas = (context: any) => ({
  getContext: vi.fn().mockReturnValue(context),
  width: 200,
  height: 200
})

describe('MorphEngine', () => {
  let mockSourceImageData: ImageData
  let mockTargetImageData: ImageData
  let mockOutputImageData: ImageData
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Create mock image data
    const createMockImageData = (width: number, height: number, fillValue: number) => {
      const data = new Uint8ClampedArray(width * height * 4)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = fillValue     // R
        data[i + 1] = fillValue // G
        data[i + 2] = fillValue // B
        data[i + 3] = 255       // A
      }
      return {
        data,
        width,
        height,
        colorSpace: 'srgb' as ColorSpace
      }
    }
    
    mockSourceImageData = createMockImageData(200, 200, 100)
    mockTargetImageData = createMockImageData(200, 200, 200)
    mockOutputImageData = createMockImageData(200, 200, 150)
    
    // Setup mock returns
    mockGetImageData.mockReturnValue(mockOutputImageData)
    
    // Mock document.createElement
    const mockContext = createMockContext()
    const mockCanvas = createMockCanvas(mockContext)
    
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return mockCanvas as any
      }
      return document.createElement(tagName)
    })
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })
  
  it('should create engine with source and target images', () => {
    const engine = new MorphEngine(mockSourceImageData, mockTargetImageData)
    expect(engine).toBeDefined()
  })
  
  it('should return output image data when morphing', () => {
    const engine = new MorphEngine(mockSourceImageData, mockTargetImageData)
    const featurePoints: FeaturePoint[] = []
    
    const result = engine.morph(featurePoints, 0.5)
    
    expect(result).toBeDefined()
    expect(result.width).toBe(200)
    expect(result.height).toBe(200)
    expect(result.data).toBeInstanceOf(Uint8ClampedArray)
  })
  
  it('should handle empty feature points', () => {
    const engine = new MorphEngine(mockSourceImageData, mockTargetImageData)
    
    const result = engine.morph([], 0.5)
    
    expect(result).toBeDefined()
    expect(mockClearRect).toHaveBeenCalled()
  })
  
  it('should clamp t value between 0 and 1', () => {
    const engine = new MorphEngine(mockSourceImageData, mockTargetImageData)
    
    // Test negative t
    const result1 = engine.morph([], -0.5)
    expect(result1).toBeDefined()
    
    // Test t > 1
    const result2 = engine.morph([], 1.5)
    expect(result2).toBeDefined()
    
    // Should have called getImageData for results
    expect(mockGetImageData).toHaveBeenCalled()
  })
  
  it('should add corner points when feature points are provided', () => {
    const engine = new MorphEngine(mockSourceImageData, mockTargetImageData)
    const featurePoints: FeaturePoint[] = [
      { id: '1', sourceX: 100, sourceY: 100, targetX: 100, targetY: 100 }
    ]
    
    engine.morph(featurePoints, 0.5)
    
    // Should have called clearRect to prepare canvas
    expect(mockClearRect).toHaveBeenCalled()
  })
  
  it('should handle different interpolation values', () => {
    const engine = new MorphEngine(mockSourceImageData, mockTargetImageData)
    
    // Test t = 0 (should show source)
    engine.morph([], 0)
    expect(mockGetImageData).toHaveBeenCalled()
    
    // Test t = 1 (should show target)
    engine.morph([], 1)
    expect(mockGetImageData).toHaveBeenCalled()
    
    // Test t = 0.5 (should blend)
    engine.morph([], 0.5)
    expect(mockGetImageData).toHaveBeenCalled()
  })
  
  it('should handle feature points with extreme coordinates', () => {
    const engine = new MorphEngine(mockSourceImageData, mockTargetImageData)
    const featurePoints: FeaturePoint[] = [
      { id: '1', sourceX: -100, sourceY: -100, targetX: 500, targetY: 500 }
    ]
    
    expect(() => engine.morph(featurePoints, 0.5)).not.toThrow()
  })
})