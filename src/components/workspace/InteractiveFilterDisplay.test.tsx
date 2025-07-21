import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InteractiveFilterDisplay } from './InteractiveFilterDisplay'
import { useStore } from '../../store'

// Mock the store
vi.mock('../../store', () => ({
  useStore: vi.fn()
}))

describe('InteractiveFilterDisplay', () => {
  const mockImage = {
    url: 'test.jpg',
    width: 800,
    height: 600,
    name: 'test.jpg',
    type: 'image/jpeg'
  }
  
  const mockUpdateControl = vi.fn()
  const mockUseStore = useStore as any

  beforeEach(() => {
    mockUpdateControl.mockClear()
  })

  it('should display upload prompt when no image', () => {
    mockUseStore.mockImplementation((selector: any) => {
      const state = {
        workspace: { image: null },
        filter: { activeFilter: null, controls: [] },
        updateControl: mockUpdateControl
      }
      return selector ? selector(state) : state
    })

    render(<InteractiveFilterDisplay />)
    
    expect(screen.getByText('Upload an image to get started')).toBeInTheDocument()
  })

  it('should render canvas and controls when image is present', () => {
    mockUseStore.mockImplementation((selector: any) => {
      const state = {
        workspace: { image: mockImage },
        filter: {
          activeFilter: { id: 'convolve', name: 'Convolve', description: 'Test' },
          controls: []
        },
        updateControl: mockUpdateControl
      }
      return selector ? selector(state) : state
    })

    render(<InteractiveFilterDisplay />)
    
    expect(screen.getByRole('button', { name: 'Reset Image' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument()
  })

  describe('Filter Support', () => {
    const filterTestCases = [
      {
        name: 'liquify',
        filter: { id: 'liquify', name: 'Liquify', description: 'Test' },
        controls: [
          { id: 'brushSize', type: 'slider', label: 'Brush Size', value: 50 },
          { id: 'pressure', type: 'slider', label: 'Pressure', value: 50 },
          { id: 'mode', type: 'select', label: 'Mode', value: 'smear' },
          { id: 'strength', type: 'slider', label: 'Strength', value: 50 }
        ]
      },
      {
        name: 'convolve',
        filter: { id: 'convolve', name: 'Convolve', description: 'Test' },
        controls: [
          { id: 'preset', type: 'select', label: 'Preset', value: 'sharpen' },
          { id: 'intensity', type: 'slider', label: 'Intensity', value: 50 }
        ]
      },
      {
        name: 'gel-paint',
        filter: { id: 'gel-paint', name: 'Glass Lens', description: 'Test' },
        controls: [
          { id: 'material', type: 'select', label: 'Lens Type', value: 'glass' },
          { id: 'lensSize', type: 'slider', label: 'Lens Size', value: 50 },
          { id: 'refraction', type: 'slider', label: 'Refraction', value: 30 },
          { id: 'reflection', type: 'slider', label: 'Reflection', value: 20 }
        ]
      },
      {
        name: 'projection',
        filter: { id: 'projection', name: 'Projection', description: 'Test' },
        controls: [
          { id: 'type', type: 'select', label: 'Projection Type', value: 'sphere' },
          { id: 'fov', type: 'slider', label: 'Field of View', value: 90 },
          { id: 'rotation', type: 'slider', label: 'Rotation', value: 0 },
          { id: 'distortion', type: 'slider', label: 'Distortion', value: 50 }
        ]
      },
      {
        name: 'reaction',
        filter: { id: 'reaction', name: 'Reaction', description: 'Test' },
        controls: [
          { id: 'pattern', type: 'select', label: 'Pattern', value: 'flame' },
          { id: 'iterations', type: 'slider', label: 'Iterations', value: 3 },
          { id: 'scale', type: 'slider', label: 'Scale', value: 100 },
          { id: 'chaos', type: 'slider', label: 'Chaos', value: 50 }
        ]
      },
      {
        name: 'materializer',
        filter: { id: 'materializer', name: 'Materializer', description: 'Test' },
        controls: [
          { id: 'material', type: 'select', label: 'Material', value: 'chrome' },
          { id: 'relief', type: 'slider', label: 'Relief Depth', value: 50 },
          { id: 'shine', type: 'slider', label: 'Shine', value: 70 },
          { id: 'ambient', type: 'slider', label: 'Ambient Light', value: 30 }
        ]
      },
      {
        name: 'fractal',
        filter: { id: 'fractal', name: 'Fractal', description: 'Test' },
        controls: [
          { id: 'fractalType', type: 'select', label: 'Fractal Type', value: 'julia' },
          { id: 'zoom', type: 'slider', label: 'Zoom', value: 20 },
          { id: 'iterations', type: 'slider', label: 'Detail', value: 128 },
          { id: 'colorScheme', type: 'select', label: 'Color Scheme', value: 'rainbow' },
          { id: 'blendMode', type: 'select', label: 'Blend Mode', value: 'replace' },
          { id: 'opacity', type: 'slider', label: 'Opacity', value: 100 }
        ]
      }
    ]

    filterTestCases.forEach(({ name, filter, controls }) => {
      it(`should support ${name} filter`, () => {
        mockUseStore.mockImplementation((selector: any) => {
          const state = {
            workspace: { image: mockImage },
            filter: {
              activeFilter: filter,
              controls: controls
            },
            updateControl: mockUpdateControl
          }
          return selector ? selector(state) : state
        })

        const { container } = render(<InteractiveFilterDisplay />)
        
        // Check that canvas is rendered
        const canvas = container.querySelector('canvas')
        expect(canvas).toBeInTheDocument()
      })
    })
  })

  it('should render liquify filter with proper cursor', () => {
    mockUseStore.mockImplementation((selector: any) => {
      const state = {
        workspace: { image: mockImage },
        filter: {
          activeFilter: { id: 'liquify', name: 'Liquify', description: 'Test' },
          controls: [
            { id: 'brushSize', type: 'slider', label: 'Brush Size', value: 50 }
          ]
        },
        updateControl: mockUpdateControl
      }
      return selector ? selector(state) : state
    })

    const { container } = render(<InteractiveFilterDisplay />)
    
    // Canvas should have crosshair cursor for liquify
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveClass('cursor-crosshair')
  })
})