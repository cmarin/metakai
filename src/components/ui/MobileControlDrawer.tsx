import { useStore } from '../../store'
import type { FilterControl } from '../../types'
import { TouchSlider } from './TouchSlider'

export function MobileControlDrawer() {
  const controls = useStore((state) => state.filter.controls)
  const updateControl = useStore((state) => state.updateControl)
  const activeFilter = useStore((state) => state.filter.activeFilter)
  const isOpen = useStore((state) => state.mobileDrawerOpen)
  const setMobileDrawerOpen = useStore((state) => state.setMobileDrawerOpen)
  
  if (!activeFilter) return null
  
  return (
    <>
      {/* Drawer Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}
      
      {/* Drawer */}
      <div className={`lg:hidden fixed inset-x-0 bottom-0 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {/* Handle */}
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-6" />
          
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
                  setMobileDrawerOpen(false)
                }}
                className="w-full btn-primary"
              >
                Apply Filter
              </button>
              
              <button 
                onClick={() => setMobileDrawerOpen(false)}
                className="w-full btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
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