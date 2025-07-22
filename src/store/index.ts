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
          { label: 'Spiral', value: 'spiral' },
          { label: 'Phoenix', value: 'phoenix' },
          { label: 'Dragon', value: 'dragon' },
          { label: 'Cosmic', value: 'cosmic' },
        ]},
        { id: 'iterations', type: 'slider', label: 'Iterations', min: 1, max: 10, value: 3 },
        { id: 'scale', type: 'slider', label: 'Scale', min: 10, max: 200, value: 100 },
        { id: 'chaos', type: 'slider', label: 'Chaos', min: 0, max: 100, value: 50 },
      ]
    case 'materializer':
      return [
        { id: 'material', type: 'select', label: 'Material', value: 'chrome', options: [
          { label: 'Chrome', value: 'chrome' },
          { label: 'Gold', value: 'gold' },
          { label: 'Copper', value: 'copper' },
          { label: 'Steel', value: 'steel' },
        ]},
        { id: 'relief', type: 'slider', label: 'Relief Depth', min: 0, max: 100, value: 50 },
        { id: 'shine', type: 'slider', label: 'Shine', min: 0, max: 100, value: 70 },
        { id: 'ambient', type: 'slider', label: 'Ambient Light', min: 0, max: 100, value: 30 },
      ]
    case 'fractal':
      return [
        { id: 'fractalType', type: 'select', label: 'Fractal Type', value: 'julia', options: [
          { label: 'Julia Set', value: 'julia' },
          { label: 'Julia Set 2', value: 'julia2' },
          { label: 'Julia Set 3', value: 'julia3' },
          { label: 'Julia Set 4', value: 'julia4' },
          { label: 'Mandelbrot', value: 'mandelbrot' },
        ]},
        { id: 'zoom', type: 'slider', label: 'Zoom', min: 0, max: 100, value: 20 },
        { id: 'iterations', type: 'slider', label: 'Detail', min: 32, max: 256, value: 128 },
        { id: 'colorScheme', type: 'select', label: 'Color Scheme', value: 'rainbow', options: [
          { label: 'Rainbow', value: 'rainbow' },
          { label: 'Fire', value: 'fire' },
          { label: 'Ocean', value: 'ocean' },
          { label: 'Psychedelic', value: 'psychedelic' },
        ]},
        { id: 'blendMode', type: 'select', label: 'Blend Mode', value: 'replace', options: [
          { label: 'Replace', value: 'replace' },
          { label: 'Multiply', value: 'multiply' },
          { label: 'Screen', value: 'screen' },
          { label: 'Overlay', value: 'overlay' },
        ]},
        { id: 'opacity', type: 'slider', label: 'Opacity', min: 0, max: 100, value: 100 },
      ]
    case 'morph':
      return [
        { id: 'morphMode', type: 'select', label: 'Morph Mode', value: 'simple', options: [
          { value: 'simple', label: 'Simple Crossfade' },
          { value: 'advanced', label: 'Advanced Morph' }
        ]},
        { id: 'morphAmount', type: 'slider', label: 'Morph Amount', min: 0, max: 100, value: 0 },
        { id: 'frames', type: 'number', label: 'Total Frames', min: 10, max: 120, value: 30 },
        { id: 'fps', type: 'number', label: 'FPS', min: 10, max: 60, value: 30 },
        { id: 'transitionType', type: 'select', label: 'Transition Type', value: 'linear', options: [
          { value: 'linear', label: 'Linear' },
          { value: 'ease-in', label: 'Ease In' },
          { value: 'ease-out', label: 'Ease Out' },
          { value: 'ease-in-out', label: 'Ease In-Out' }
        ]}
      ]
    default:
      return []
  }
}