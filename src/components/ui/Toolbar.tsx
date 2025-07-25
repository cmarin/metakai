import { useStore } from '../../store'
import type { FilterType } from '../../types'
import { handleImageFile, isImageFormatSupported } from '../../utils/imageHelpers'

const filters: FilterType[] = [
  {
    id: 'liquify',
    name: 'Liquify',
    description: 'Warp and distort your image with liquid-like effects',
  },
  {
    id: 'convolve',
    name: 'Convolve',
    description: 'Apply mathematical filters for sharpening, blurring, and edge detection',
  },
  {
    id: 'gel-paint',
    name: 'Gel Paint',
    description: 'Paint with realistic 3D materials that interact with light',
  },
]

export function Toolbar() {
  const setActiveFilter = useStore((state) => state.setActiveFilter)
  const activeFilter = useStore((state) => state.filter.activeFilter)
  const { undo, redo } = useStore()
  const historyIndex = useStore((state) => state.filter.historyIndex)
  const historyLength = useStore((state) => state.filter.history.length)
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // Reset input value to allow re-uploading same file
    event.target.value = ''
    
    // Check file size (12MB limit)
    if (file.size > 12 * 1024 * 1024) {
      alert('File size must be less than 12MB')
      return
    }
    
    try {
      // Handle HEIC and other formats
      const dataUrl = await handleImageFile(file)
      if (!dataUrl) return
      
      const img = new Image()
      
      img.onload = () => {
        console.log('Image loaded successfully:', {
          width: img.width,
          height: img.height,
          type: file.type,
          name: file.name
        })
        
        useStore.getState().setImage({
          url: dataUrl,
          width: img.width,
          height: img.height,
          name: file.name,
          type: file.type || 'image/jpeg', // Default type if not provided
        })
      }
      
      img.onerror = (error) => {
        console.error('Failed to load image:', error)
        
        // Check if it might be HEIC
        const isHEIC = file.type === 'image/heic' || file.type === 'image/heif' || 
                       file.name.toLowerCase().endsWith('.heic') || 
                       file.name.toLowerCase().endsWith('.heif')
        
        if (isHEIC) {
          alert('HEIC/HEIF images are not supported by your browser. Please use the Photos app on your iPhone to export as JPEG, or use an online converter.')
        } else if (!isImageFormatSupported(file)) {
          alert('This image format is not supported. Please use JPEG, PNG, WebP, or AVIF.')
        } else {
          alert('Failed to load image. The file may be corrupted or in an unsupported format.')
        }
      }
      
      img.src = dataUrl
    } catch (error) {
      console.error('Error handling file upload:', error)
      alert('An error occurred while uploading the image.')
    }
  }
  
  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Metakai Filter Suite
          </h1>
          
          <div className="flex items-center space-x-2">
            <input
              type="file"
              id="file-upload"
              accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer transition-colors"
            >
              Upload Image
            </label>
            
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Undo"
            >
              ↶
            </button>
            
            <button
              onClick={redo}
              disabled={historyIndex >= historyLength - 1}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Redo"
            >
              ↷
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter)}
              data-testid={`filter-${filter.id}`}
              className={`px-4 py-2 rounded transition-colors ${
                activeFilter?.id === filter.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              title={filter.description}
            >
              {filter.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}