import { Filter as PixiFilter } from 'pixi.js'
import { Filter } from '../base/Filter'
import type { FilterControl } from '../../types'
import { MorphAppShader } from './shaders'

export class MorphAppFilter extends Filter {
  private morphFilter?: PixiFilter
  
  getName(): string {
    return 'MorphApp'
  }
  
  getDefaultControls(): FilterControl[] {
    return [
      { id: 'morphAmount', type: 'slider', label: 'Morph Amount', min: 0, max: 100, value: 0 },
      { id: 'frames', type: 'number', label: 'Total Frames', min: 10, max: 120, value: 30 },
      { id: 'fps', type: 'number', label: 'FPS', min: 10, max: 60, value: 30 },
      { id: 'transitionType', type: 'select', label: 'Transition Type', value: 'linear', options: [
        { value: 'linear', label: 'Linear' },
        { value: 'ease-in', label: 'Ease In' },
        { value: 'ease-out', label: 'Ease Out' },
        { value: 'ease-in-out', label: 'Ease In-Out' }
      ]},
      { id: 'featurePoints', type: 'number', label: 'Feature Points', min: 4, max: 50, value: 16 }
    ]
  }
  
  createFilter(): PixiFilter {
    // Create a basic filter for now (MorphApp needs special handling for two images)
    const filter = new PixiFilter({
      gpuProgram: null,
      glProgram: null,
      resources: {},
    } as any)
    
    // Set shader and uniforms
    ;(filter as any).fragment = MorphAppShader
    ;(filter as any).uniforms = {
      morphAmount: 0
    }
    
    this.morphFilter = filter
    this.updateFilter()
    return this.morphFilter
  }
  
  protected updateFilter(): void {
    if (!this.morphFilter) return
    
    const morphAmount = this.controls.find(c => c.id === 'morphAmount')?.value as number || 0
    
    // Update the uniform directly
    const uniforms = (this.morphFilter as any).uniforms
    if (uniforms) {
      uniforms.morphAmount = morphAmount / 100
    }
  }
}