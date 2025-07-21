import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ModernToolbar } from './ModernToolbar'
import { useStore } from '../../store'

// Mock the store
vi.mock('../../store', () => ({
  useStore: vi.fn()
}))

describe('ModernToolbar', () => {
  const mockSetActiveFilter = vi.fn()
  const mockSetImage = vi.fn()
  const mockSetMobileDrawerOpen = vi.fn()
  const mockUseStore = useStore as any

  beforeEach(() => {
    mockSetActiveFilter.mockClear()
    mockSetImage.mockClear()
    mockSetMobileDrawerOpen.mockClear()
    
    // Default mock implementation
    mockUseStore.mockImplementation((selector: any) => {
      const state = {
        setActiveFilter: mockSetActiveFilter,
        setImage: mockSetImage,
        setMobileDrawerOpen: mockSetMobileDrawerOpen,
        filter: { activeFilter: null }
      }
      return selector ? selector(state) : state
    })
  })

  it('should render all filter buttons', () => {
    render(<ModernToolbar />)
    
    expect(screen.getByRole('button', { name: 'Liquify' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Convolve' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Glass Lens' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Projection' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reaction' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Materializer' })).toBeInTheDocument()
  })

  it('should have scrollable filter container', () => {
    const { container } = render(<ModernToolbar />)
    
    const scrollContainer = container.querySelector('.overflow-x-auto')
    expect(scrollContainer).toBeInTheDocument()
    expect(scrollContainer).toHaveClass('scrollbar-hide')
    expect(scrollContainer).toHaveClass('snap-x')
    expect(scrollContainer).toHaveClass('snap-mandatory')
    expect(scrollContainer).toHaveClass('touch-pan-x')
  })

  it('should select filter when clicked', () => {
    render(<ModernToolbar />)
    
    const projectionButton = screen.getByRole('button', { name: 'Projection' })
    fireEvent.click(projectionButton)
    
    expect(mockSetActiveFilter).toHaveBeenCalledWith({
      id: 'projection',
      name: 'Projection',
      description: '3D perspective transformations'
    })
  })

  it('should show active filter state', () => {
    mockUseStore.mockImplementation((selector: any) => {
      const state = {
        setActiveFilter: mockSetActiveFilter,
        setImage: mockSetImage,
        setMobileDrawerOpen: mockSetMobileDrawerOpen,
        filter: { 
          activeFilter: {
            id: 'reaction',
            name: 'Reaction',
            description: 'Fractal flame patterns'
          }
        }
      }
      return selector ? selector(state) : state
    })

    render(<ModernToolbar />)
    
    const reactionButton = screen.getByRole('button', { name: 'Reaction' })
    expect(reactionButton).toHaveClass('filter-btn-active')
    
    const liquifyButton = screen.getByRole('button', { name: 'Liquify' })
    expect(liquifyButton).toHaveClass('filter-btn-inactive')
  })

  it('should show mobile settings button when filter is active', () => {
    mockUseStore.mockImplementation((selector: any) => {
      const state = {
        setActiveFilter: mockSetActiveFilter,
        setImage: mockSetImage,
        setMobileDrawerOpen: mockSetMobileDrawerOpen,
        filter: { 
          activeFilter: {
            id: 'projection',
            name: 'Projection',
            description: '3D perspective transformations'
          }
        }
      }
      return selector ? selector(state) : state
    })

    render(<ModernToolbar />)
    
    const settingsButton = screen.getByRole('button', { name: /Projection Settings/i })
    expect(settingsButton).toBeInTheDocument()
    
    fireEvent.click(settingsButton)
    expect(mockSetMobileDrawerOpen).toHaveBeenCalledWith(true)
  })

  it('should handle file upload', () => {
    render(<ModernToolbar />)
    
    const uploadButton = screen.getByRole('button', { name: /Upload Image/i })
    expect(uploadButton).toBeInTheDocument()
    
    // Create a mock file
    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByRole('button', { name: /Upload Image/i }).parentElement?.querySelector('input[type="file"]') as HTMLInputElement
    
    // Mock URL.createObjectURL
    const mockUrl = 'blob:mock-url'
    global.URL.createObjectURL = vi.fn(() => mockUrl)
    
    // Trigger file change
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    })
    
    fireEvent.change(fileInput)
    
    expect(mockSetImage).toHaveBeenCalledWith({
      url: mockUrl,
      width: 0,
      height: 0,
      name: 'test.jpg',
      type: 'image/jpeg'
    })
  })

  it('should render brand name', () => {
    render(<ModernToolbar />)
    
    expect(screen.getByText('Metakai')).toBeInTheDocument()
  })

  it('should have snap-center class on filter buttons', () => {
    render(<ModernToolbar />)
    
    const filterButtons = screen.getAllByRole('button').filter(btn => 
      btn.classList.contains('filter-btn')
    )
    
    filterButtons.forEach(button => {
      expect(button).toHaveClass('snap-center')
      expect(button).toHaveClass('flex-shrink-0')
    })
  })
})