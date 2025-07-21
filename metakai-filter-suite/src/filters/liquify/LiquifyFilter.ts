import { Filter as PixiFilter } from 'pixi.js'
import { Filter } from '../base/Filter'
import type { FilterControl } from '../../types'
import { liquifyVertex, liquifyFragment } from './shaders'

export class LiquifyFilter extends Filter {
  private brushSize = 50
  private pressure = 50
  private mode: 'smear' | 'twirl' | 'pinch' | 'swell' = 'smear'
  private strength = 50
  
  getName(): string {
    return 'Liquify'
  }
  
  getDefaultControls(): FilterControl[] {
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
  }
  
  createFilter(): PixiFilter {
    const uniforms = {
      brushPosition: [0, 0],
      brushSize: this.brushSize,
      pressure: this.pressure / 100,
      mode: 0,
      strength: this.strength / 100,
      time: 0,
    }
    
    // For PIXI v8, we need to pass options to the Filter constructor
    const filter = new PixiFilter({
      gpuProgram: null,
      glProgram: null,
      resources: {},
    } as any)
    ;(filter as any).vertex = liquifyVertex
    ;(filter as any).fragment = liquifyFragment
    ;(filter as any).uniforms = uniforms
    return filter
  }
  
  protected updateFilter(): void {
    if (!this.filter) return
    
    const control = (id: string) => this.controls.find(c => c.id === id)?.value
    
    this.brushSize = Number(control('brushSize')) || 50
    this.pressure = Number(control('pressure')) || 50
    this.mode = (control('mode') as 'smear' | 'twirl' | 'pinch' | 'swell') || 'smear'
    this.strength = Number(control('strength')) || 50
    
    const modeMap = {
      'smear': 0,
      'twirl': 1,
      'pinch': 2,
      'swell': 3,
    }
    
    const uniforms = (this.filter as any).uniforms
    uniforms.brushSize = this.brushSize
    uniforms.pressure = this.pressure / 100
    uniforms.mode = modeMap[this.mode]
    uniforms.strength = this.strength / 100
  }
  
  setBrushPosition(x: number, y: number): void {
    if (this.filter) {
      const uniforms = (this.filter as any).uniforms
      uniforms.brushPosition = [x, y]
    }
  }
  
  applyBrush(): void {
    // This would apply the current brush stroke to the displacement map
    // Implementation would involve updating a displacement texture
  }
}