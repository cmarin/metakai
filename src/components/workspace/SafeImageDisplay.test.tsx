import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SafeImageDisplay } from './SafeImageDisplay'
import { useStore } from '../../store'

// Mock the store
vi.mock('../../store', () => ({
  useStore: vi.fn()
}))

describe('SafeImageDisplay', () => {
  const mockUseStore = useStore as any

  beforeEach(() => {
    mockUseStore.mockReset()
  })

  it('should display upload prompt when no image is present', () => {
    mockUseStore.mockImplementation((selector: any) => {
      const state = { workspace: { image: null } }
      return selector ? selector(state) : state
    })

    render(<SafeImageDisplay />)
    
    expect(screen.getByText('Upload an image to get started')).toBeInTheDocument()
    
    // Check for SVG icon
    const svg = screen.getByText('Upload an image to get started').parentElement?.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should display upload prompt when image has no url', () => {
    mockUseStore.mockImplementation((selector: any) => {
      const state = { workspace: { image: { url: '', name: 'test.jpg' } } }
      return selector ? selector(state) : state
    })

    render(<SafeImageDisplay />)
    
    expect(screen.getByText('Upload an image to get started')).toBeInTheDocument()
  })

  it('should display image when image is present', () => {
    const mockImage = {
      url: 'https://example.com/test.jpg',
      name: 'test-image.jpg',
      width: 800,
      height: 600,
      type: 'image/jpeg'
    }

    mockUseStore.mockImplementation((selector: any) => {
      const state = { workspace: { image: mockImage } }
      return selector ? selector(state) : state
    })

    render(<SafeImageDisplay />)
    
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', mockImage.url)
    expect(img).toHaveAttribute('alt', mockImage.name)
    expect(img).toHaveClass('max-w-full', 'max-h-full', 'object-contain', 'rounded-lg', 'shadow-xl')
  })

  it('should use fallback alt text when image has no name', () => {
    const mockImage = {
      url: 'https://example.com/test.jpg',
      name: '',
      width: 800,
      height: 600,
      type: 'image/jpeg'
    }

    mockUseStore.mockImplementation((selector: any) => {
      const state = { workspace: { image: mockImage } }
      return selector ? selector(state) : state
    })

    render(<SafeImageDisplay />)
    
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('alt', 'Uploaded image')
  })

  it('should apply correct container styles', () => {
    mockUseStore.mockImplementation((selector: any) => {
      const state = { workspace: { image: null } }
      return selector ? selector(state) : state
    })

    const { container } = render(<SafeImageDisplay />)
    
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('w-full', 'h-full', 'flex', 'items-center', 'justify-center', 'bg-gray-100', 'dark:bg-gray-900')
  })

  it('should apply correct container styles when image is present', () => {
    const mockImage = {
      url: 'https://example.com/test.jpg',
      name: 'test.jpg',
      width: 800,
      height: 600,
      type: 'image/jpeg'
    }

    mockUseStore.mockImplementation((selector: any) => {
      const state = { workspace: { image: mockImage } }
      return selector ? selector(state) : state
    })

    const { container } = render(<SafeImageDisplay />)
    
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('w-full', 'h-full', 'flex', 'items-center', 'justify-center', 'bg-gray-100', 'dark:bg-gray-900', 'p-4')
  })

  it('should set max height style on image', () => {
    const mockImage = {
      url: 'https://example.com/test.jpg',
      name: 'test.jpg',
      width: 800,
      height: 600,
      type: 'image/jpeg'
    }

    mockUseStore.mockImplementation((selector: any) => {
      const state = { workspace: { image: mockImage } }
      return selector ? selector(state) : state
    })

    render(<SafeImageDisplay />)
    
    const img = screen.getByRole('img')
    expect(img.style.maxHeight).toBe('90vh')
  })
})