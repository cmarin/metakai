import { Filter as PixiFilter } from 'pixi.js'
import { Filter } from '../base/Filter'
import type { FilterControl } from '../../types'
import { convolveVertex, convolveFragment } from './shaders'

export class ConvolveFilter extends Filter {
  private kernels = {
    sharpen: [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0]
    ],
    blur: [
      [1/9, 1/9, 1/9],
      [1/9, 1/9, 1/9],
      [1/9, 1/9, 1/9]
    ],
    edge: [
      [-1, -1, -1],
      [-1, 8, -1],
      [-1, -1, -1]
    ],
    emboss: [
      [-2, -1, 0],
      [-1, 1, 1],
      [0, 1, 2]
    ]
  }
  
  private currentKernel = 'sharpen'
  private intensity = 50
  
  getName(): string {
    return 'Convolve'
  }
  
  getDefaultControls(): FilterControl[] {
    return [
      { id: 'preset', type: 'select', label: 'Preset', value: 'sharpen', options: [
        { label: 'Sharpen', value: 'sharpen' },
        { label: 'Blur', value: 'blur' },
        { label: 'Edge Detect', value: 'edge' },
        { label: 'Emboss', value: 'emboss' },
      ]},
      { id: 'intensity', type: 'slider', label: 'Intensity', min: 0, max: 100, value: 50 },
    ]
  }
  
  createFilter(): PixiFilter {
    const kernel = this.kernels[this.currentKernel as keyof typeof this.kernels]
    const flatKernel = kernel.flat()
    
    const uniforms = {
      kernel: flatKernel,
      intensity: this.intensity / 100,
      texelSize: [1.0, 1.0],
    }
    
    // For PIXI v8, we need to pass options to the Filter constructor
    const filter = new PixiFilter({
      gpuProgram: null,
      glProgram: null,
      resources: {},
    } as any)
    ;(filter as any).vertex = convolveVertex
    ;(filter as any).fragment = convolveFragment
    ;(filter as any).uniforms = uniforms
    return filter
  }
  
  protected updateFilter(): void {
    if (!this.filter) return
    
    const preset = this.controls.find(c => c.id === 'preset')?.value || 'sharpen'
    const intensity = this.controls.find(c => c.id === 'intensity')?.value || 50
    
    this.currentKernel = String(preset)
    this.intensity = Number(intensity)
    
    const kernel = this.kernels[preset as keyof typeof this.kernels]
    const flatKernel = kernel.flat()
    
    const uniforms = (this.filter as any).uniforms
    uniforms.kernel = flatKernel
    uniforms.intensity = Number(intensity) / 100
  }
  
  setTexelSize(width: number, height: number): void {
    if (this.filter) {
      const uniforms = (this.filter as any).uniforms
      uniforms.texelSize = [1.0 / width, 1.0 / height]
    }
  }
}