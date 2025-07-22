import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'
import { useStore } from './store'

// Mock child components
vi.mock('./components/workspace/InteractiveFilterDisplay', () => ({
  InteractiveFilterDisplay: () => <div data-testid="interactive-filter-display">InteractiveFilterDisplay</div>
}))

vi.mock('./components/workspace/MorphDisplay', () => ({
  MorphDisplay: () => <div data-testid="morph-display">MorphDisplay</div>
}))

vi.mock('./components/ui/ModernToolbar', () => ({
  ModernToolbar: () => <div data-testid="modern-toolbar">ModernToolbar</div>
}))

vi.mock('./components/ui/ModernControlPanel', () => ({
  ModernControlPanel: () => <div data-testid="modern-control-panel">ModernControlPanel</div>
}))

vi.mock('./components/ui/MobileControlDrawer', () => ({
  MobileControlDrawer: () => <div data-testid="mobile-control-drawer">MobileControlDrawer</div>
}))

// Mock store
vi.mock('./store', () => ({
  useStore: vi.fn()
}))

describe('App', () => {
  const mockUseStore = useStore as any

  beforeEach(() => {
    // Reset DOM
    document.documentElement.classList.remove('dark')
    
    // Default store mock
    mockUseStore.mockImplementation((selector: any) => {
      const state = { 
        theme: 'light',
        filter: { 
          activeFilter: null 
        }
      }
      return selector ? selector(state) : state
    })
  })

  it('should render all main components', () => {
    render(<App />)
    
    expect(screen.getByTestId('modern-toolbar')).toBeInTheDocument()
    expect(screen.getByTestId('interactive-filter-display')).toBeInTheDocument()
    expect(screen.getByTestId('modern-control-panel')).toBeInTheDocument()
    expect(screen.getByTestId('mobile-control-drawer')).toBeInTheDocument()
  })

  it('should have correct layout structure', () => {
    const { container } = render(<App />)
    
    const appDiv = container.firstChild as HTMLElement
    expect(appDiv).toHaveClass('h-screen', 'flex', 'flex-col', 'bg-gray-50', 'dark:bg-gray-950')
    
    const main = container.querySelector('main')
    expect(main).toHaveClass('flex-1', 'flex', 'overflow-hidden')
    
    const workspaceArea = main?.querySelector('.flex-1.relative')
    expect(workspaceArea).toHaveClass('bg-gray-100', 'dark:bg-gray-900')
  })

  it('should apply light theme by default', () => {
    render(<App />)
    
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should apply dark theme when theme is dark', () => {
    mockUseStore.mockImplementation((selector: any) => {
      const state = { 
        theme: 'dark',
        filter: { 
          activeFilter: null 
        }
      }
      return selector ? selector(state) : state
    })
    
    render(<App />)
    
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should toggle theme class when theme changes', () => {
    const { rerender } = render(<App />)
    
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    
    // Change to dark theme
    mockUseStore.mockImplementation((selector: any) => {
      const state = { 
        theme: 'dark',
        filter: { 
          activeFilter: null 
        }
      }
      return selector ? selector(state) : state
    })
    
    rerender(<App />)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    
    // Change back to light theme
    mockUseStore.mockImplementation((selector: any) => {
      const state = { 
        theme: 'light',
        filter: { 
          activeFilter: null 
        }
      }
      return selector ? selector(state) : state
    })
    
    rerender(<App />)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should subscribe to theme changes from store', () => {
    render(<App />)
    
    // Verify that useStore was called with a selector function
    expect(mockUseStore).toHaveBeenCalled()
    const selector = mockUseStore.mock.calls[0][0]
    
    // Test the selector
    expect(selector({ theme: 'light', filter: { activeFilter: null } })).toBe('light')
    expect(selector({ theme: 'dark', filter: { activeFilter: null } })).toBe('dark')
  })
})