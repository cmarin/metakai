import { useStore } from '../../store'
import type { FilterControl } from '../../types'
import { TouchSlider } from './TouchSlider'

export function ModernControlPanel() {
  const controls = useStore((state) => state.filter.controls)
  const updateControl = useStore((state) => state.updateControl)
  const activeFilter = useStore((state) => state.filter.activeFilter)
  
  if (!activeFilter) {
    return (
      <aside className="hidden lg:block w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-6">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">
              Select a filter to see controls
            </p>
          </div>
        </div>
      </aside>
    )
  }
  
  return (
    <aside className="hidden lg:block w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-6 overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            {activeFilter.name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {activeFilter.description}
          </p>
        </div>
        
        <div className="space-y-6">
          {controls.map((control) => (
            <Control
              key={control.id}
              control={control}
              onChange={(value) => updateControl(control.id, value)}
            />
          ))}
        </div>
        
        <div className="pt-4 space-y-3">
          <button 
            onClick={() => {
              // Trigger a re-render by updating a dummy control
              updateControl('_trigger', Date.now())
            }}
            className="w-full btn-primary"
          >
            Apply Filter
          </button>
          
          <button 
            onClick={() => {
              // Reset controls to defaults
              controls.forEach(control => {
                const defaultValue = control.type === 'slider' ? 50 : 
                                   control.type === 'select' ? control.options?.[0]?.value : 
                                   control.value
                updateControl(control.id, defaultValue || control.value)
              })
            }}
            className="w-full btn-secondary"
          >
            Reset Settings
          </button>
        </div>
      </div>
    </aside>
  )
}

interface ControlProps {
  control: FilterControl
  onChange: (value: number | string) => void
}

function Control({ control, onChange }: ControlProps) {
  switch (control.type) {
    case 'slider':
      return (
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <label className="control-label">
              {control.label}
            </label>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {control.value}
            </span>
          </div>
          <TouchSlider
            min={control.min || 0}
            max={control.max || 100}
            step={control.step || 1}
            value={control.value as number}
            onChange={onChange}
            className="control-slider"
          />
        </div>
      )
      
    case 'select':
      return (
        <div>
          <label className="control-label">
            {control.label}
          </label>
          <select
            value={control.value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-colors"
          >
            {control.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )
      
    default:
      return null
  }
}