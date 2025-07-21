import { create } from 'zustand'
import type { FilterState, WorkspaceState, ImageData, FilterType, FilterControl } from '../types'

interface AppState {
  workspace: WorkspaceState
  filter: FilterState
  theme: 'light' | 'dark'
  mobileDrawerOpen: boolean
  
  // Workspace actions
  setImage: (image: ImageData | null) => void
  setZoom: (zoom: number) => void
  setPan: (pan: { x: number; y: number }) => void
  
  // Filter actions
  setActiveFilter: (filter: FilterType | null) => void
  updateControl: (controlId: string, value: number | string) => void
  undo: () => void
  redo: () => void
  
  // Theme actions
  toggleTheme: () => void
  
  // UI actions
  setMobileDrawerOpen: (open: boolean) => void
}

export const useStore = create<AppState>((set) => ({
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
  
  setImage: (image) => set((state) => ({
    workspace: { ...state.workspace, image }
  })),
  
  setZoom: (zoom) => set((state) => ({
    workspace: { ...state.workspace, zoom: Math.max(0.1, Math.min(10, zoom)) }
  })),
  
  setPan: (pan) => set((state) => ({
    workspace: { ...state.workspace, pan }
  })),
  
  setActiveFilter: (filter) => set((state) => ({
    filter: { ...state.filter, activeFilter: filter, controls: filter ? getDefaultControls(filter.id) : [] }
  })),
  
  updateControl: (controlId, value) => set((state) => ({
    filter: {
      ...state.filter,
      controls: state.filter.controls.map(c => 
        c.id === controlId ? { ...c, value } : c
      )
    }
  })),
  
  undo: () => set((state) => {
    if (state.filter.historyIndex > 0) {
      return {
        filter: {
          ...state.filter,
          historyIndex: state.filter.historyIndex - 1
        }
      }
    }
    return state
  }),
  
  redo: () => set((state) => {
    if (state.filter.historyIndex < state.filter.history.length - 1) {
      return {
        filter: {
          ...state.filter,
          historyIndex: state.filter.historyIndex + 1
        }
      }
    }
    return state
  }),
  
  toggleTheme: () => set((state) => ({
    theme: state.theme === 'light' ? 'dark' : 'light'
  })),
  
  setMobileDrawerOpen: (open) => set(() => ({
    mobileDrawerOpen: open
  })),
}))

function getDefaultControls(filterId: string): FilterControl[] {
  switch (filterId) {
    case 'liquify':
      return [
        { id: 'brushSize', type: 'slider', label: 'Brush Size', min: 10, max: 200, value: 50 },
        { id: 'pressure', type: 'slider', label: 'Pressure', min: 0, max: 100, value: 50 },
        { id: 'mode', type: 'select', label: 'Mode', value: 'smear', options: [
          { label: 'Smear', value: 'smear' },
          { label: 'Twirl', value: 'twirl' },
          { label: 'Pinch', value: 'pinch' },
          { label: 'Swell', value: 'swell' },
        ]},
        { id: 'strength', type: 'slider', label: 'Strength', min: 0, max: 100, value: 50 },
      ]
    case 'convolve':
      return [
        { id: 'preset', type: 'select', label: 'Preset', value: 'sharpen', options: [
          { label: 'Sharpen', value: 'sharpen' },
          { label: 'Blur', value: 'blur' },
          { label: 'Edge Detect', value: 'edge' },
          { label: 'Emboss', value: 'emboss' },
        ]},
        { id: 'intensity', type: 'slider', label: 'Intensity', min: 0, max: 100, value: 50 },
      ]
    case 'gel-paint':
      return [
        { id: 'material', type: 'select', label: 'Lens Type', value: 'glass', options: [
          { label: 'Glass', value: 'glass' },
          { label: 'Sphere', value: 'sphere' },
          { label: 'Water', value: 'water' },
        ]},
        { id: 'lensSize', type: 'slider', label: 'Lens Size', min: 10, max: 100, value: 50 },
        { id: 'refraction', type: 'slider', label: 'Refraction', min: 0, max: 100, value: 30 },
        { id: 'reflection', type: 'slider', label: 'Reflection', min: 0, max: 50, value: 20 },
      ]
    case 'projection':
      return [
        { id: 'type', type: 'select', label: 'Projection Type', value: 'sphere', options: [
          { label: 'Sphere', value: 'sphere' },
          { label: 'Cylinder', value: 'cylinder' },
          { label: 'Cone', value: 'cone' },
          { label: 'Plane', value: 'plane' },
        ]},
        { id: 'fov', type: 'slider', label: 'Field of View', min: 10, max: 180, value: 90 },
        { id: 'rotation', type: 'slider', label: 'Rotation', min: 0, max: 360, value: 0 },
        { id: 'distortion', type: 'slider', label: 'Distortion', min: 0, max: 100, value: 50 },
      ]
    case 'reaction':
      return [
        { id: 'pattern', type: 'select', label: 'Pattern', value: 'flame', options: [
          { label: 'Flame', value: 'flame' },
          { label: 'Electric', value: 'electric' },
          { label: 'Organic', value: 'organic' },
          { label: 'Crystal', value: 'crystal' },
        ]},
        { id: 'iterations', type: 'slider', label: 'Iterations', min: 1, max: 10, value: 3 },
        { id: 'scale', type: 'slider', label: 'Scale', min: 10, max: 200, value: 100 },
        { id: 'chaos', type: 'slider', label: 'Chaos', min: 0, max: 100, value: 50 },
      ]
    default:
      return []
  }
}