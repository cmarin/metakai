import { useRef } from 'react'
import { useStore } from '../../store'
import type { FilterType } from '../../types'

const filters: FilterType[] = [
  {
    id: 'liquify',
    name: 'Liquify',
    description: 'Warp and distort your image',
  },
  {
    id: 'convolve',
    name: 'Convolve',
    description: 'Sharpen, blur, and edge effects',
  },
  {
    id: 'gel-paint',
    name: 'Gel Paint',
    description: '3D paint effects',
  },
  {
    id: 'projection',
    name: 'Projection',
    description: '3D perspective transformations',
  },
  {
    id: 'reaction',
    name: 'Reaction',
    description: 'Fractal flame patterns',
  },
]

export function ModernToolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const setActiveFilter = useStore((state) => state.setActiveFilter)
  const activeFilter = useStore((state) => state.filter.activeFilter)
  const setImage = useStore((state) => state.setImage)
  const setMobileDrawerOpen = useStore((state) => state.setMobileDrawerOpen)
  
  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file) return
      
      // Create object URL for immediate display
      const url = URL.createObjectURL(file)
      
      // Set the image directly without loading it first
      setImage({
        url,
        width: 0,
        height: 0,
        name: file.name,
        type: file.type || 'image/jpeg'
      })
      
      // Reset input
      e.target.value = ''
    } catch (error) {
      alert('Failed to load image. Please try again.')
    }
  }
  
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex flex-col gap-4">
          {/* Top Row: Logo and Upload */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Metakai
              </h1>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <button
              onClick={handleFileSelect}
              className="btn-primary"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Image
              </span>
            </button>
          </div>
          
            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter)}
                  className={`filter-btn whitespace-nowrap ${
                    activeFilter?.id === filter.id
                      ? 'filter-btn-active'
                      : 'filter-btn-inactive'
                  }`}
                >
                  {filter.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Bottom Row: Settings Button (Mobile Only) */}
          {activeFilter && (
            <div className="flex justify-center lg:hidden">
              <button
                onClick={() => setMobileDrawerOpen(true)}
                className="btn-primary shadow-xl"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  {activeFilter.name} Settings
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}