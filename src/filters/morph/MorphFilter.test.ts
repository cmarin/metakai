import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as PIXI from 'pixi.js'
import { MorphFilter } from './MorphFilter'
import { Filter } from '../base/Filter'

// Mock PIXI
vi.mock('pixi.js', () => ({
  Filter: vi.fn().mockImplementation(() => ({
    padding: 0,
    uniforms: {}
  }))
}))

describe('MorphFilter', () => {
  let morphFilter: MorphFilter
  let mockApp: any
  let mockContainer: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockApp = { stage: {} }
    mockContainer = { filters: null }
    morphFilter = new MorphFilter(mockApp, mockContainer)
  })

  it('should extend Filter base class', () => {
    expect(morphFilter).toBeInstanceOf(Filter)
  })

  it('should have correct name', () => {
    expect(morphFilter.getName()).toBe('Morph')
  })

  it('should have default controls', () => {
    const controls = morphFilter.getDefaultControls()
    
    expect(controls).toHaveLength(5)
    
    const morphAmountControl = controls.find(c => c.id === 'morphAmount')
    expect(morphAmountControl).toMatchObject({
      type: 'slider',
      label: 'Morph Amount',
      min: 0,
      max: 100,
      value: 0
    })
    
    const framesControl = controls.find(c => c.id === 'frames')
    expect(framesControl).toMatchObject({
      type: 'number',
      label: 'Total Frames',
      min: 10,
      max: 120,
      value: 30
    })
    
    const fpsControl = controls.find(c => c.id === 'fps')
    expect(fpsControl).toMatchObject({
      type: 'number',
      label: 'FPS',
      min: 10,
      max: 60,
      value: 30
    })
    
    const transitionControl = controls.find(c => c.id === 'transitionType')
    expect(transitionControl).toMatchObject({
      type: 'select',
      label: 'Transition Type',
      value: 'linear'
    })
    expect(transitionControl?.options).toHaveLength(4)
    
    const featurePointsControl = controls.find(c => c.id === 'featurePoints')
    expect(featurePointsControl).toMatchObject({
      type: 'number',
      label: 'Feature Points',
      min: 4,
      max: 50,
      value: 16
    })
  })

  it('should create filter with proper uniforms', () => {
    const filter = morphFilter.createFilter()
    
    expect(PIXI.Filter).toHaveBeenCalled()
    expect(filter).toBeDefined()
    expect((filter as any).uniforms).toMatchObject({
      morphAmount: 0
    })
  })

  it('should update filter uniforms when controls change', () => {
    const filter = morphFilter.createFilter()
    
    // Update morph amount control using public method
    morphFilter.updateControl('morphAmount', 50)
    
    expect((filter as any).uniforms.morphAmount).toBe(0.5)
  })

  it('should handle missing controls gracefully', () => {
    const filter = morphFilter.createFilter()
    
    // Try to update a non-existent control
    morphFilter.updateControl('nonExistentControl', 100)
    
    // Should use default value since the control doesn't exist
    expect((filter as any).uniforms.morphAmount).toBe(0)
  })
})