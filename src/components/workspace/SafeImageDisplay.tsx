import { useStore } from '../../store'

export function SafeImageDisplay() {
  const image = useStore((state) => state.workspace.image)
  
  if (!image || !image.url) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-8">
          <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 text-lg">Upload an image to get started</p>
        </div>
      </div>
    )
  }
  
  // Simple image display without complex transformations
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <img 
        src={image.url} 
        alt={image.name || 'Uploaded image'}
        className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
        style={{ maxHeight: '90vh' }}
      />
    </div>
  )
}