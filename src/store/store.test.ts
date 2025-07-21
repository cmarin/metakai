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
      mobileDrawerOpen: false,
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
  
  describe('Mobile drawer actions', () => {
    it('should set mobile drawer open state', () => {
      const { setMobileDrawerOpen } = useStore.getState()
      
      expect(useStore.getState().mobileDrawerOpen).toBe(false)
      
      setMobileDrawerOpen(true)
      expect(useStore.getState().mobileDrawerOpen).toBe(true)
      
      setMobileDrawerOpen(false)
      expect(useStore.getState().mobileDrawerOpen).toBe(false)
    })
  })
  
  describe('New filter types', () => {
    it('should set projection filter with correct controls', () => {
      const { setActiveFilter } = useStore.getState()
      const projectionFilter = {
        id: 'projection',
        name: 'Projection',
        description: '3D perspective transformations',
      }
      
      setActiveFilter(projectionFilter)
      
      const state = useStore.getState()
      expect(state.filter.activeFilter).toEqual(projectionFilter)
      expect(state.filter.controls.length).toBeGreaterThan(0)
      
      const typeControl = state.filter.controls.find(c => c.id === 'type')
      expect(typeControl).toBeDefined()
      expect(typeControl?.type).toBe('select')
      expect(typeControl?.options).toBeDefined()
      
      const fovControl = state.filter.controls.find(c => c.id === 'fov')
      expect(fovControl).toBeDefined()
      expect(fovControl?.type).toBe('slider')
    })
    
    it('should set reaction filter with correct controls', () => {
      const { setActiveFilter } = useStore.getState()
      const reactionFilter = {
        id: 'reaction',
        name: 'Reaction',
        description: 'Fractal flame patterns',
      }
      
      setActiveFilter(reactionFilter)
      
      const state = useStore.getState()
      expect(state.filter.activeFilter).toEqual(reactionFilter)
      expect(state.filter.controls.length).toBeGreaterThan(0)
      
      const patternControl = state.filter.controls.find(c => c.id === 'pattern')
      expect(patternControl).toBeDefined()
      expect(patternControl?.type).toBe('select')
      expect(patternControl?.options).toBeDefined()
      
      const iterationsControl = state.filter.controls.find(c => c.id === 'iterations')
      expect(iterationsControl).toBeDefined()
      expect(iterationsControl?.type).toBe('slider')
    })
    
    it('should set materializer filter with correct controls', () => {
      const { setActiveFilter } = useStore.getState()
      const materializerFilter = {
        id: 'materializer',
        name: 'Materializer',
        description: 'KPT-style metallic and material effects',
      }
      
      setActiveFilter(materializerFilter)
      
      const state = useStore.getState()
      expect(state.filter.activeFilter).toEqual(materializerFilter)
      expect(state.filter.controls.length).toBe(4)
      
      const materialControl = state.filter.controls.find(c => c.id === 'material')
      expect(materialControl).toBeDefined()
      expect(materialControl?.type).toBe('select')
      expect(materialControl?.options?.length).toBe(4)
      expect(materialControl?.value).toBe('chrome')
      
      const reliefControl = state.filter.controls.find(c => c.id === 'relief')
      expect(reliefControl).toBeDefined()
      expect(reliefControl?.type).toBe('slider')
      expect(reliefControl?.value).toBe(50)
      
      const shineControl = state.filter.controls.find(c => c.id === 'shine')
      expect(shineControl).toBeDefined()
      expect(shineControl?.value).toBe(70)
      
      const ambientControl = state.filter.controls.find(c => c.id === 'ambient')
      expect(ambientControl).toBeDefined()
      expect(ambientControl?.value).toBe(30)
    })
  })
})