export async function handleImageFile(file: File): Promise<string | null> {
  // Check if file is HEIC/HEIF
  const isHEIC = file.type === 'image/heic' || file.type === 'image/heif' || 
                 file.name.toLowerCase().endsWith('.heic') || 
                 file.name.toLowerCase().endsWith('.heif')
  
  if (isHEIC) {
    // For now, we'll show a helpful message
    // In production, you'd use a HEIC conversion library like heic2any
    console.warn('HEIC format detected. Browser may not support this format natively.')
    
    // Try to load it anyway - some browsers might support it
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => {
        alert('HEIC/HEIF images are not supported by your browser. Please convert to JPEG or PNG first.')
        resolve(null)
      }
      reader.readAsDataURL(file)
    })
  }
  
  // For supported formats, read normally
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function isImageFormatSupported(file: File): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
    'image/bmp',
    'image/svg+xml'
  ]
  
  // Check MIME type
  if (supportedTypes.includes(file.type)) {
    return true
  }
  
  // Check file extension as fallback
  const extension = file.name.split('.').pop()?.toLowerCase()
  const supportedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'bmp', 'svg']
  
  return extension ? supportedExtensions.includes(extension) : false
}