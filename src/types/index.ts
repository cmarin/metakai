export interface FilterType {
  id: string
  name: string
  description: string
  icon?: string
}

export interface FilterControl {
  id: string
  type: 'slider' | 'select' | 'color' | 'number'
  label: string
  min?: number
  max?: number
  step?: number
  value: number | string
  options?: Array<{ label: string; value: string | number }>
}

export interface ImageData {
  url: string
  width: number
  height: number
  name: string
  type: string
}

export interface FilterState {
  activeFilter: FilterType | null
  controls: FilterControl[]
  history: Array<{ controls: FilterControl[]; timestamp: number }>
  historyIndex: number
}

export interface WorkspaceState {
  image: ImageData | null
  zoom: number
  pan: { x: number; y: number }
  isDragging: boolean
}

export type FilterMode = 'liquify' | 'convolve' | 'gel-paint'

export interface LiquifySettings {
  brushSize: number
  pressure: number
  mode: 'smear' | 'twirl' | 'pinch' | 'swell'
  strength: number
}

export interface ConvolveSettings {
  kernel: number[][]
  intensity: number
  preset: string
}

export interface GelPaintSettings {
  material: 'metal' | 'glass' | 'liquid'
  depth: number
  viscosity: number
  lightDirection: { x: number; y: number; z: number }
}

export interface FeaturePoint {
  x: number
  y: number
  id?: string
}

export const ColorSpace = {
  RGB: 'rgb',
  HSV: 'hsv',
  LAB: 'lab'
} as const

export type ColorSpace = typeof ColorSpace[keyof typeof ColorSpace]