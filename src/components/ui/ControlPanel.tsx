import { useStore } from '../../store'
import type { FilterControl } from '../../types'

export function ControlPanel() {
  const controls = useStore((state) => state.filter.controls)
  const updateControl = useStore((state) => state.updateControl)
  const activeFilter = useStore((state) => state.filter.activeFilter)
  
  if (!activeFilter) {
    return (
      <div className="w-80 bg-gray-100 dark:bg-gray-800 p-4 overflow-y-auto">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Select a filter to see controls
        </p>
      </div>
    )
  }
  
  return (
    <div className="w-80 bg-gray-100 dark:bg-gray-800 p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
        {activeFilter.name}
      </h2>
      
      <div className="space-y-4">
        {controls.map((control) => (
          <Control
            key={control.id}
            control={control}
            onChange={(value) => updateControl(control.id, value)}
          />
        ))}
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={() => {/* Apply filter logic */}}
        >
          Apply Filter
        </button>
        
        <button
          className="w-full mt-2 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
          onClick={() => {/* Reset filter logic */}}
        >
          Reset
        </button>
      </div>
    </div>
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {control.label}
          </label>
          <input
            type="range"
            min={control.min}
            max={control.max}
            step={control.step}
            value={control.value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {control.value}
          </div>
        </div>
      )
      
    case 'select':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {control.label}
          </label>
          <select
            value={control.value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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