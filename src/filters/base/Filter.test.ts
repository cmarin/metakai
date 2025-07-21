import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Application, Container, Filter as PixiFilter } from 'pixi.js'
import { Filter } from './Filter'
import type { FilterControl } from '../../types'

// Mock PIXI.js modules
vi.mock('pixi.js', () => ({
  Application: vi.fn(),
  Container: vi.fn(),
  Filter: vi.fn(),
}))

// Concrete implementation for testing
class TestFilter extends Filter {
  getName(): string {
    return 'Test Filter'
  }
  
  getDefaultControls(): FilterControl[] {
    return [
      {
        id: 'intensity',
        label: 'Intensity',
        type: 'slider',
        value: 50,
        min: 0,
        max: 100,
        step: 1,
      },
      {
        id: 'mode',
        label: 'Mode',
        type: 'select',
        value: 'normal',
        options: [
          { label: 'Normal', value: 'normal' },
          { label: 'Multiply', value: 'multiply' },
        ],
      },
    ]
  }
  
  createFilter(): PixiFilter {
    return new (PixiFilter as any)() as any
  }
  
  protected updateFilter(): void {
    // Mock implementation
  }
}

describe('Filter', () => {
  let mockApp: Application
  let mockContainer: Container
  let testFilter: TestFilter

  beforeEach(() => {
    mockApp = new Application() as any
    mockContainer = {
      filters: null,
    } as any
    testFilter = new TestFilter(mockApp, mockContainer)
  })

  describe('constructor', () => {
    it('should initialize with app, container, and default controls', () => {
      expect(testFilter['app']).toBe(mockApp)
      expect(testFilter['container']).toBe(mockContainer)
      expect(testFilter['controls']).toHaveLength(2)
      expect(testFilter['controls'][0].id).toBe('intensity')
      expect(testFilter['controls'][1].id).toBe('mode')
    })
  })

  describe('getName', () => {
    it('should return the filter name', () => {
      expect(testFilter.getName()).toBe('Test Filter')
    })
  })

  describe('getControls', () => {
    it('should return the current controls', () => {
      const controls = testFilter.getControls()
      expect(controls).toHaveLength(2)
      expect(controls[0].id).toBe('intensity')
      expect(controls[1].id).toBe('mode')
    })
  })

  describe('apply', () => {
    it('should create filter if not exists and add to container', () => {
      const mockPixiFilter = { name: 'mockFilter' }
      vi.spyOn(testFilter, 'createFilter').mockReturnValue(mockPixiFilter as any)
      
      testFilter.apply()
      
      expect(testFilter['filter']).toBe(mockPixiFilter)
      expect(mockContainer.filters).toEqual([mockPixiFilter])
    })

    it('should append to existing filters', () => {
      const existingFilter = { name: 'existing' }
      mockContainer.filters = [existingFilter] as any
      
      const mockPixiFilter = { name: 'mockFilter' }
      vi.spyOn(testFilter, 'createFilter').mockReturnValue(mockPixiFilter as any)
      
      testFilter.apply()
      
      expect(mockContainer.filters).toEqual([existingFilter, mockPixiFilter])
    })

    it('should reuse existing filter on subsequent calls', () => {
      const createFilterSpy = vi.spyOn(testFilter, 'createFilter')
      
      testFilter.apply()
      testFilter.apply()
      
      expect(createFilterSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('remove', () => {
    it('should remove filter from container', () => {
      const mockPixiFilter = { name: 'mockFilter' }
      vi.spyOn(testFilter, 'createFilter').mockReturnValue(mockPixiFilter as any)
      
      testFilter.apply()
      expect(mockContainer.filters).toEqual([mockPixiFilter])
      
      testFilter.remove()
      expect(mockContainer.filters).toEqual([])
    })

    it('should handle removal when filter not in container', () => {
      const otherFilter = { name: 'other' }
      mockContainer.filters = [otherFilter] as any
      
      const mockPixiFilter = { name: 'mockFilter' }
      testFilter['filter'] = mockPixiFilter as any
      
      testFilter.remove()
      expect(mockContainer.filters).toEqual([otherFilter])
    })

    it('should do nothing if no filter exists', () => {
      mockContainer.filters = []
      testFilter.remove()
      expect(mockContainer.filters).toEqual([])
    })

    it('should do nothing if container has no filters', () => {
      mockContainer.filters = null
      testFilter.remove()
      expect(mockContainer.filters).toBeNull()
    })
  })

  describe('updateControl', () => {
    it('should update control value and call updateFilter', () => {
      const updateFilterSpy = vi.spyOn(testFilter as any, 'updateFilter')
      
      testFilter.updateControl('intensity', 75)
      
      const control = testFilter.getControls().find(c => c.id === 'intensity')
      expect(control?.value).toBe(75)
      expect(updateFilterSpy).toHaveBeenCalled()
    })

    it('should handle string values for select controls', () => {
      const updateFilterSpy = vi.spyOn(testFilter as any, 'updateFilter')
      
      testFilter.updateControl('mode', 'multiply')
      
      const control = testFilter.getControls().find(c => c.id === 'mode')
      expect(control?.value).toBe('multiply')
      expect(updateFilterSpy).toHaveBeenCalled()
    })

    it('should not update if control not found', () => {
      const updateFilterSpy = vi.spyOn(testFilter as any, 'updateFilter')
      
      testFilter.updateControl('nonexistent', 100)
      
      expect(updateFilterSpy).not.toHaveBeenCalled()
    })
  })

  describe('destroy', () => {
    it('should remove and destroy filter', () => {
      const mockPixiFilter = { 
        name: 'mockFilter',
        destroy: vi.fn()
      }
      vi.spyOn(testFilter, 'createFilter').mockReturnValue(mockPixiFilter as any)
      
      testFilter.apply()
      testFilter.destroy()
      
      expect(mockContainer.filters).toEqual([])
      expect(mockPixiFilter.destroy).toHaveBeenCalled()
    })

    it('should handle destroy when no filter exists', () => {
      expect(() => testFilter.destroy()).not.toThrow()
    })
  })
})