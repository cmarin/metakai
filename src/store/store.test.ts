import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from './index'

describe('App Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useStore.setState({
      workspace: {
        image: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        isDragging: false,
      },
      filter: {
        activeFilter: null,
        controls: [],
        history: [],
        historyIndex: -1,
      },
      theme: 'light',
    })
  })
  
  describe('Workspace actions', () => {
    it('should set image', () => {
      const mockImage = {
        url: 'test.jpg',
        width: 800,
        height: 600,
        name: 'test.jpg',
        type: 'image/jpeg',
      }
      
      useStore.getState().setImage(mockImage)
      
      expect(useStore.getState().workspace.image).toEqual(mockImage)
    })
    
    it('should set zoom within bounds', () => {
      const { setZoom } = useStore.getState()
      
      setZoom(2)
      expect(useStore.getState().workspace.zoom).toBe(2)
      
      setZoom(20)
      expect(useStore.getState().workspace.zoom).toBe(10) // Max zoom
      
      setZoom(0.05)
      expect(useStore.getState().workspace.zoom).toBe(0.1) // Min zoom
    })
    
    it('should set pan position', () => {
      const { setPan } = useStore.getState()
      const newPan = { x: 100, y: 200 }
      
      setPan(newPan)
      
      expect(useStore.getState().workspace.pan).toEqual(newPan)
    })
  })
  
  describe('Filter actions', () => {
    it('should set active filter with default controls', () => {
      const { setActiveFilter } = useStore.getState()
      const mockFilter = {
        id: 'liquify',
        name: 'Liquify',
        description: 'Test filter',
      }
      
      setActiveFilter(mockFilter)
      
      const state = useStore.getState()
      expect(state.filter.activeFilter).toEqual(mockFilter)
      expect(state.filter.controls.length).toBeGreaterThan(0)
      expect(state.filter.controls[0].id).toBe('brushSize')
    })
    
    it('should update control value', () => {
      const { setActiveFilter, updateControl } = useStore.getState()
      
      setActiveFilter({
        id: 'liquify',
        name: 'Liquify',
        description: 'Test filter',
      })
      
      updateControl('brushSize', 100)
      
      const control = useStore.getState().filter.controls.find(c => c.id === 'brushSize')
      expect(control?.value).toBe(100)
    })
  })
  
  describe('Theme actions', () => {
    it('should toggle theme', () => {
      const { toggleTheme } = useStore.getState()
      
      expect(useStore.getState().theme).toBe('light')
      
      toggleTheme()
      expect(useStore.getState().theme).toBe('dark')
      
      toggleTheme()
      expect(useStore.getState().theme).toBe('light')
    })
  })
})