import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { handleImageFile, isImageFormatSupported } from './imageHelpers'

describe('imageHelpers', () => {
  describe('handleImageFile', () => {
    let consoleWarnSpy: any
    let alertSpy: any

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleWarnSpy.mockRestore()
      alertSpy.mockRestore()
    })

    it('should handle regular image files', async () => {
      const mockFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })
      const mockDataURL = 'data:image/jpeg;base64,test'
      
      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as any,
        onerror: null as any,
        result: mockDataURL,
      }
      
      vi.spyOn(window, 'FileReader').mockImplementation(() => {
        setTimeout(() => {
          if (mockFileReader.onload) {
            mockFileReader.onload({ target: { result: mockDataURL } })
          }
        }, 0)
        return mockFileReader as any
      })

      const result = await handleImageFile(mockFile)
      
      expect(result).toBe(mockDataURL)
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile)
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should warn about HEIC files by type', async () => {
      const mockFile = new File(['heic content'], 'test.heic', { type: 'image/heic' })
      const mockDataURL = 'data:image/heic;base64,test'
      
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as any,
        onerror: null as any,
        result: mockDataURL,
      }
      
      vi.spyOn(window, 'FileReader').mockImplementation(() => {
        setTimeout(() => {
          if (mockFileReader.onload) {
            mockFileReader.onload({ target: { result: mockDataURL } })
          }
        }, 0)
        return mockFileReader as any
      })

      const result = await handleImageFile(mockFile)
      
      expect(result).toBe(mockDataURL)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'HEIC format detected. Browser may not support this format natively.'
      )
    })

    it('should detect HEIC files by extension', async () => {
      const mockFile = new File(['heic content'], 'photo.HEIC', { type: '' })
      const mockDataURL = 'data:image/heic;base64,test'
      
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as any,
        onerror: null as any,
        result: mockDataURL,
      }
      
      vi.spyOn(window, 'FileReader').mockImplementation(() => {
        setTimeout(() => {
          if (mockFileReader.onload) {
            mockFileReader.onload({ target: { result: mockDataURL } })
          }
        }, 0)
        return mockFileReader as any
      })

      const result = await handleImageFile(mockFile)
      
      expect(result).toBe(mockDataURL)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'HEIC format detected. Browser may not support this format natively.'
      )
    })

    it('should handle HEIC read errors', async () => {
      const mockFile = new File(['heic content'], 'test.heic', { type: 'image/heic' })
      
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as any,
        onerror: null as any,
      }
      
      vi.spyOn(window, 'FileReader').mockImplementation(() => {
        setTimeout(() => {
          if (mockFileReader.onerror) {
            mockFileReader.onerror(new Error('Read error'))
          }
        }, 0)
        return mockFileReader as any
      })

      const result = await handleImageFile(mockFile)
      
      expect(result).toBeNull()
      expect(alertSpy).toHaveBeenCalledWith(
        'HEIC/HEIF images are not supported by your browser. Please convert to JPEG or PNG first.'
      )
    })

    it('should reject on regular file read error', async () => {
      const mockFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })
      const mockError = new Error('Read failed')
      
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as any,
        onerror: null as any,
      }
      
      vi.spyOn(window, 'FileReader').mockImplementation(() => {
        setTimeout(() => {
          if (mockFileReader.onerror) {
            mockFileReader.onerror(mockError)
          }
        }, 0)
        return mockFileReader as any
      })

      await expect(handleImageFile(mockFile)).rejects.toThrow('Read failed')
    })
  })

  describe('isImageFormatSupported', () => {
    it('should return true for supported MIME types', () => {
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

      supportedTypes.forEach(type => {
        const file = new File([''], 'test', { type })
        expect(isImageFormatSupported(file)).toBe(true)
      })
    })

    it('should return false for unsupported MIME types', () => {
      const unsupportedTypes = [
        'image/tiff',
        'image/x-icon',
        'application/pdf',
        'text/plain'
      ]

      unsupportedTypes.forEach(type => {
        const file = new File([''], 'test', { type })
        expect(isImageFormatSupported(file)).toBe(false)
      })
    })

    it('should check file extension when MIME type is not recognized', () => {
      const supportedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'bmp', 'svg']
      
      supportedExtensions.forEach(ext => {
        const file = new File([''], `test.${ext}`, { type: '' })
        expect(isImageFormatSupported(file)).toBe(true)
        
        // Test uppercase
        const fileUpper = new File([''], `test.${ext.toUpperCase()}`, { type: '' })
        expect(isImageFormatSupported(fileUpper)).toBe(true)
      })
    })

    it('should return false for files without extension', () => {
      const file = new File([''], 'test', { type: '' })
      expect(isImageFormatSupported(file)).toBe(false)
    })

    it('should return false for unsupported extensions', () => {
      const unsupportedExtensions = ['tiff', 'ico', 'pdf', 'txt', 'heic']
      
      unsupportedExtensions.forEach(ext => {
        const file = new File([''], `test.${ext}`, { type: '' })
        expect(isImageFormatSupported(file)).toBe(false)
      })
    })

    it('should prioritize MIME type over extension', () => {
      // Supported MIME type but unsupported extension
      const file1 = new File([''], 'test.xyz', { type: 'image/jpeg' })
      expect(isImageFormatSupported(file1)).toBe(true)
      
      // Unsupported MIME type but supported extension
      const file2 = new File([''], 'test.jpg', { type: 'application/octet-stream' })
      expect(isImageFormatSupported(file2)).toBe(true) // Falls back to extension check
    })
  })
})