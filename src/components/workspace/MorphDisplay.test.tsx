import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MorphDisplay } from './MorphDisplay'
import { useStore } from '../../store'
import { useCallback } from 'react'

// Mock dependencies
vi.mock('../../store')
vi.mock('../../utils/ffmpeg-loader', () => ({
  loadFFmpeg: vi.fn().mockResolvedValue({
    loaded: true,
    load: vi.fn().mockResolvedValue(undefined),
    transcode: vi.fn().mockResolvedValue({ type: 'mp4', url: 'mock-url' }),
    on: vi.fn()
  }),
  getFFmpeg: vi.fn().mockReturnValue({
    loaded: false,
    load: vi.fn().mockResolvedValue(undefined),
    transcode: vi.fn().mockResolvedValue({ type: 'mp4', url: 'mock-url' }),
    on: vi.fn()
  })
}))
vi.mock('./FeaturePointSelector', () => ({
  FeaturePointSelector: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="feature-point-selector">
      <button onClick={onClose}>Close</button>
    </div>
  )
}))
vi.mock('../ui/DownloadModal', () => ({
  DownloadModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => 
    isOpen ? (
      <div data-testid="download-modal">
        <button onClick={onClose}>Close Download</button>
      </div>
    ) : null
}))
vi.mock('../ui/VideoGenerationModal', () => ({
  VideoGenerationModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => 
    isOpen ? (
      <div data-testid="video-generation-modal">
        <button onClick={onClose}>Close Video</button>
      </div>
    ) : null
}))
vi.mock('../../workers/gif.worker?worker', () => ({
  default: vi.fn().mockImplementation(() => ({
    postMessage: vi.fn(),
    terminate: vi.fn()
  }))
}))

const mockStore = {
  morphImageA: null,
  morphImageB: null,
  morphInterpolation: 0.5,
  morphFeaturePoints: [],
  morphTotalFrames: 30,
  morphFps: 30,
  morphTransitionType: 'smooth' as const,
  morphTargetFormat: 'mp4' as const,
  setMorphTargetFormat: vi.fn(),
  setMorphImageA: vi.fn(),
  setMorphImageB: vi.fn(),
  setMorphFeaturePoints: vi.fn(),
  setMorphInterpolation: vi.fn(),
  setMorphTotalFrames: vi.fn(),
  setMorphFps: vi.fn(),
  setMorphTransitionType: vi.fn(),
  workspace: {
    image: null
  },
  filter: {
    controls: [
      { id: 'morphMode', type: 'select', label: 'Morph Mode', value: 'advanced' },
      { id: 'morphAmount', type: 'slider', label: 'Morph Amount', value: 50 },
      { id: 'frames', type: 'number', label: 'Total Frames', value: 30 },
      { id: 'fps', type: 'number', label: 'FPS', value: 30 },
      { id: 'transitionType', type: 'select', label: 'Transition Type', value: 'smooth' }
    ]
  }
}

describe('MorphDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStore).mockImplementation((selector) => {
      if (selector) {
        return selector(mockStore)
      }
      return mockStore
    })
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  it('should render initial state with image upload areas', () => {
    render(<MorphDisplay />)
    
    expect(screen.getByText('Start Image')).toBeInTheDocument()
    expect(screen.getByText('End Image')).toBeInTheDocument()
    expect(screen.getByText('Select end image')).toBeInTheDocument()
  })

  it('should handle image upload for image A', async () => {
    render(<MorphDisplay />)
    
    const file = new File(['image'], 'test.png', { type: 'image/png' })
    const input = screen.getAllByLabelText(/Upload image/)[0]
    
    // Mock FileReader
    const mockReadAsDataURL = vi.fn()
    global.FileReader = vi.fn().mockImplementation(() => ({
      readAsDataURL: mockReadAsDataURL,
      result: 'data:image/png;base64,test',
      onload: null
    })) as any
    
    fireEvent.change(input, { target: { files: [file] } })
    
    // Simulate FileReader onload
    const reader = new FileReader()
    reader.onload?.({} as any)
    
    await waitFor(() => {
      expect(mockStore.setMorphImageA).toHaveBeenCalledWith('data:image/png;base64,test')
    })
  })

  it('should handle image upload for image B', async () => {
    render(<MorphDisplay />)
    
    const file = new File(['image'], 'test.png', { type: 'image/png' })
    const input = screen.getAllByLabelText(/Upload image/)[1]
    
    // Mock FileReader
    const mockReadAsDataURL = vi.fn()
    global.FileReader = vi.fn().mockImplementation(() => ({
      readAsDataURL: mockReadAsDataURL,
      result: 'data:image/png;base64,test',
      onload: null
    })) as any
    
    fireEvent.change(input, { target: { files: [file] } })
    
    // Simulate FileReader onload
    const reader = new FileReader()
    reader.onload?.({} as any)
    
    await waitFor(() => {
      expect(mockStore.setMorphImageB).toHaveBeenCalledWith('data:image/png;base64,test')
    })
  })

  it('should show feature point selector when both images are loaded', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const updatedStore = {
        ...mockStore,
        morphImageA: 'image-a-data',
        morphImageB: 'image-b-data'
      }
      if (selector) {
        return selector(updatedStore)
      }
      return updatedStore
    })
    
    render(<MorphDisplay />)
    
    expect(screen.getByTestId('feature-point-selector')).toBeInTheDocument()
  })

  it('should close feature point selector when close button clicked', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const updatedStore = {
        ...mockStore,
        morphImageA: 'image-a-data',
        morphImageB: 'image-b-data'
      }
      if (selector) {
        return selector(updatedStore)
      }
      return updatedStore
    })
    
    render(<MorphDisplay />)
    
    fireEvent.click(screen.getByText('Close'))
    
    expect(mockStore.setMorphImageA).toHaveBeenCalledWith(null)
    expect(mockStore.setMorphImageB).toHaveBeenCalledWith(null)
    expect(mockStore.setMorphFeaturePoints).toHaveBeenCalledWith([])
  })

  it('should swap images when swap button clicked', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const updatedStore = {
        ...mockStore,
        morphImageA: 'image-a-data',
        morphImageB: 'image-b-data'
      }
      if (selector) {
        return selector(updatedStore)
      }
      return updatedStore
    })
    
    render(<MorphDisplay />)
    
    fireEvent.click(screen.getByLabelText('Swap images'))
    
    expect(mockStore.setMorphImageA).toHaveBeenCalledWith('image-b-data')
    expect(mockStore.setMorphImageB).toHaveBeenCalledWith('image-a-data')
  })

  it('should update interpolation value', () => {
    render(<MorphDisplay />)
    
    const slider = screen.getByLabelText('Interpolation')
    fireEvent.change(slider, { target: { value: '0.75' } })
    
    expect(mockStore.setMorphInterpolation).toHaveBeenCalledWith(0.75)
  })

  it('should update total frames', () => {
    render(<MorphDisplay />)
    
    const input = screen.getByLabelText('Total Frames')
    fireEvent.change(input, { target: { value: '60' } })
    
    expect(mockStore.setMorphTotalFrames).toHaveBeenCalledWith(60)
  })

  it('should update FPS', () => {
    render(<MorphDisplay />)
    
    const input = screen.getByLabelText('FPS')
    fireEvent.change(input, { target: { value: '24' } })
    
    expect(mockStore.setMorphFps).toHaveBeenCalledWith(24)
  })

  it('should update transition type', () => {
    render(<MorphDisplay />)
    
    const select = screen.getByLabelText('Transition Type')
    fireEvent.change(select, { target: { value: 'ease-in' } })
    
    expect(mockStore.setMorphTransitionType).toHaveBeenCalledWith('ease-in')
  })

  it('should show generate video button when images are loaded', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const updatedStore = {
        ...mockStore,
        morphImageA: 'image-a-data',
        morphImageB: 'image-b-data'
      }
      if (selector) {
        return selector(updatedStore)
      }
      return updatedStore
    })
    
    render(<MorphDisplay />)
    
    expect(screen.getByText('Generate Video')).toBeInTheDocument()
  })

  it('should open video generation modal when generate video clicked', async () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const updatedStore = {
        ...mockStore,
        morphImageA: 'image-a-data',
        morphImageB: 'image-b-data'
      }
      if (selector) {
        return selector(updatedStore)
      }
      return updatedStore
    })
    
    render(<MorphDisplay />)
    
    fireEvent.click(screen.getByText('Generate Video'))
    
    await waitFor(() => {
      expect(screen.getByTestId('video-generation-modal')).toBeInTheDocument()
    })
  })

  it('should handle non-image file rejection', () => {
    render(<MorphDisplay />)
    
    const file = new File(['text'], 'test.txt', { type: 'text/plain' })
    const input = screen.getAllByLabelText(/Upload image/)[0]
    
    fireEvent.change(input, { target: { files: [file] } })
    
    expect(mockStore.setMorphImageA).not.toHaveBeenCalled()
  })

  it('should display image previews when images are loaded', () => {
    vi.mocked(useStore).mockImplementation((selector) => {
      const updatedStore = {
        ...mockStore,
        morphImageA: 'image-a-data',
        morphImageB: 'image-b-data'
      }
      if (selector) {
        return selector(updatedStore)
      }
      return updatedStore
    })
    
    render(<MorphDisplay />)
    
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2)
    expect(images[0]).toHaveAttribute('src', 'image-a-data')
    expect(images[1]).toHaveAttribute('src', 'image-b-data')
  })
})