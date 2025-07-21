import { Application, Container, Filter as PixiFilter } from 'pixi.js'
import type { FilterControl } from '../../types'

export abstract class Filter {
  protected app: Application
  protected container: Container
  protected filter?: PixiFilter
  protected controls: FilterControl[]
  
  constructor(app: Application, container: Container) {
    this.app = app
    this.container = container
    this.controls = this.getDefaultControls()
  }
  
  abstract getName(): string
  abstract getDefaultControls(): FilterControl[]
  abstract createFilter(): PixiFilter
  
  apply(): void {
    if (!this.filter) {
      this.filter = this.createFilter()
    }
    
    if (!this.container.filters) {
      this.container.filters = []
    }
    
    this.container.filters = [...this.container.filters, this.filter]
  }
  
  remove(): void {
    if (!this.filter || !this.container.filters) return
    
    const index = this.container.filters.indexOf(this.filter)
    if (index > -1) {
      this.container.filters = this.container.filters.filter((_, i) => i !== index)
    }
  }
  
  updateControl(controlId: string, value: number | string): void {
    const control = this.controls.find(c => c.id === controlId)
    if (control) {
      control.value = value
      this.updateFilter()
    }
  }
  
  protected abstract updateFilter(): void
  
  getControls(): FilterControl[] {
    return this.controls
  }
  
  destroy(): void {
    this.remove()
    if (this.filter) {
      this.filter.destroy()
    }
  }
}