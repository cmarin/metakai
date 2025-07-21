import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ZoomControls } from './ZoomControls'
import { useStore } from '../../store'

// Mock the store
vi.mock('../../store', () => ({
  useStore: vi.fn()
}))

describe('ZoomControls', () => {
  const mockSetZoom = vi.fn()
  const mockSetPan = vi.fn()
  const mockUseStore = useStore as any

  beforeEach(() => {
    mockSetZoom.mockClear()
    mockSetPan.mockClear()
    
    // Default mock implementation
    mockUseStore.mockImplementation((selector: any) => {
      const state = {
        workspace: { zoom: 1 },
        setZoom: mockSetZoom,
        setPan: mockSetPan
      }
      return selector ? selector(state) : state
    })
  })

  it('should render with correct zoom percentage', () => {
    render(<ZoomControls />)
    
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('should display different zoom percentages correctly', () => {
    mockUseStore.mockImplementation((selector: any) => {
      const state = {
        workspace: { zoom: 1.5 },
        setZoom: mockSetZoom,
        setPan: mockSetPan
      }
      return selector ? selector(state) : state
    })

    render(<ZoomControls />)
    
    expect(screen.getByText('150%')).toBeInTheDocument()
  })

  it('should round zoom percentage', () => {
    mockUseStore.mockImplementation((selector: any) => {
      const state = {
        workspace: { zoom: 1.236 },
        setZoom: mockSetZoom,
        setPan: mockSetPan
      }
      return selector ? selector(state) : state
    })

    render(<ZoomControls />)
    
    expect(screen.getByText('124%')).toBeInTheDocument()
  })

  it('should zoom in when zoom in button is clicked', () => {
    render(<ZoomControls />)
    
    const zoomInButton = screen.getByTitle('Zoom in')
    fireEvent.click(zoomInButton)
    
    expect(mockSetZoom).toHaveBeenCalledWith(1.2)
  })

  it('should zoom out when zoom out button is clicked', () => {
    render(<ZoomControls />)
    
    const zoomOutButton = screen.getByTitle('Zoom out')
    fireEvent.click(zoomOutButton)
    
    expect(mockSetZoom).toHaveBeenCalledWith(1 / 1.2)
  })

  it('should calculate zoom correctly from current zoom level', () => {
    mockUseStore.mockImplementation((selector: any) => {
      const state = {
        workspace: { zoom: 2 },
        setZoom: mockSetZoom,
        setPan: mockSetPan
      }
      return selector ? selector(state) : state
    })

    render(<ZoomControls />)
    
    const zoomInButton = screen.getByTitle('Zoom in')
    fireEvent.click(zoomInButton)
    
    expect(mockSetZoom).toHaveBeenCalledWith(2 * 1.2)
    
    const zoomOutButton = screen.getByTitle('Zoom out')
    fireEvent.click(zoomOutButton)
    
    expect(mockSetZoom).toHaveBeenCalledWith(2 / 1.2)
  })

  it('should reset zoom and pan when reset button is clicked', () => {
    render(<ZoomControls />)
    
    const resetButton = screen.getByTitle('Reset view')
    fireEvent.click(resetButton)
    
    expect(mockSetZoom).toHaveBeenCalledWith(1)
    expect(mockSetPan).toHaveBeenCalledWith({ x: 0, y: 0 })
  })

  it('should have correct button styles', () => {
    render(<ZoomControls />)
    
    const buttons = screen.getAllByRole('button')
    
    buttons.forEach(button => {
      expect(button).toHaveClass('p-2', 'hover:bg-gray-100', 'dark:hover:bg-gray-700', 'rounded', 'transition-colors')
    })
  })

  it('should have correct container styles', () => {
    const { container } = render(<ZoomControls />)
    
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass(
      'absolute', 
      'bottom-4', 
      'right-4', 
      'bg-white', 
      'dark:bg-gray-800', 
      'rounded-lg', 
      'shadow-lg', 
      'p-2', 
      'flex', 
      'items-center', 
      'space-x-2'
    )
  })

  it('should render all three control buttons', () => {
    render(<ZoomControls />)
    
    expect(screen.getByTitle('Zoom out')).toBeInTheDocument()
    expect(screen.getByTitle('Zoom in')).toBeInTheDocument()
    expect(screen.getByTitle('Reset view')).toBeInTheDocument()
  })
})