
interface DownloadModalProps {
  isOpen: boolean
  onClose: () => void
  onDownloadMP4: () => void
  onDownloadGIF: () => void
  isExporting: boolean
  exportProgress: number
  canUseMP4: boolean
}

export function DownloadModal({
  isOpen,
  onClose,
  onDownloadMP4,
  onDownloadGIF,
  isExporting,
  exportProgress,
  canUseMP4
}: DownloadModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Download Options
          </h2>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {canUseMP4 && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDownloadMP4()
              }}
              disabled={isExporting}
              type="button"
              className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4" />
              </svg>
              <span>Download MP4 Video</span>
            </button>
          )}

          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDownloadGIF()
            }}
            disabled={isExporting}
            type="button"
            className="w-full p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Download Animated GIF</span>
          </button>

          {!canUseMP4 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              MP4 export requires additional browser features. GIF export is available as an alternative.
            </p>
          )}

          {isExporting && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Exporting...</span>
                <span>{exportProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}