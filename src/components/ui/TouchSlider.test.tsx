import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { TouchSlider } from './TouchSlider'

describe('TouchSlider', () => {
  const defaultProps = {
    min: 0,
    max: 100,
    step: 1,
    value: 50,
    onChange: vi.fn(),
  }

  beforeEach(() => {
    defaultProps.onChange.mockClear()
  })

  it('should render with correct attributes', () => {
    const { container } = render(<TouchSlider {...defaultProps} />)
    const slider = container.querySelector('input[type="range"]')
    
    expect(slider).toBeInTheDocument()
    expect(slider).toHaveAttribute('min', '0')
    expect(slider).toHaveAttribute('max', '100')
    expect(slider).toHaveAttribute('step', '1')
    expect(slider).toHaveAttribute('value', '50')
    // Check inline style
    expect((slider as HTMLInputElement)?.style.touchAction).toBe('none')
  })

  it('should apply custom className', () => {
    const { container } = render(
      <TouchSlider {...defaultProps} className="custom-slider" />
    )
    const slider = container.querySelector('input[type="range"]')
    
    expect(slider).toHaveClass('custom-slider')
  })

  it('should call onChange when value changes via input', () => {
    const { container } = render(<TouchSlider {...defaultProps} />)
    const slider = container.querySelector('input[type="range"]') as HTMLInputElement
    
    fireEvent.change(slider, { target: { value: '75' } })
    
    expect(defaultProps.onChange).toHaveBeenCalledWith(75)
  })

  it('should handle touch events', () => {
    const { container } = render(<TouchSlider {...defaultProps} />)
    const slider = container.querySelector('input[type="range"]') as HTMLInputElement
    
    // Mock getBoundingClientRect
    slider.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      width: 100,
      right: 100,
      top: 0,
      bottom: 20,
      height: 20,
      x: 0,
      y: 0,
      toJSON: () => {},
    }))

    // Simulate touch start at 25% position
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: 25, clientY: 10, identifier: 0 } as Touch],
      bubbles: true,
      cancelable: true,
    })
    
    fireEvent(slider, touchStart)
    
    // Should calculate value as 25% of range (0-100) = 25
    expect(defaultProps.onChange).toHaveBeenCalledWith(25)
    
    // Simulate touch move to 75% position
    defaultProps.onChange.mockClear()
    const touchMove = new TouchEvent('touchmove', {
      touches: [{ clientX: 75, clientY: 10, identifier: 0 } as Touch],
      bubbles: true,
      cancelable: true,
    })
    
    fireEvent(slider, touchMove)
    expect(defaultProps.onChange).toHaveBeenCalledWith(75)
    
    // Simulate touch end
    const touchEnd = new TouchEvent('touchend', {
      touches: [],
      bubbles: true,
      cancelable: true,
    })
    
    fireEvent(slider, touchEnd)
    
    // Touch move after end should not trigger onChange
    defaultProps.onChange.mockClear()
    fireEvent(slider, touchMove)
    expect(defaultProps.onChange).not.toHaveBeenCalled()
  })

  it('should respect step when calculating touch value', () => {
    const { container } = render(
      <TouchSlider {...defaultProps} step={10} />
    )
    const slider = container.querySelector('input[type="range"]') as HTMLInputElement
    
    slider.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      width: 100,
      right: 100,
      top: 0,
      bottom: 20,
      height: 20,
      x: 0,
      y: 0,
      toJSON: () => {},
    }))

    // Touch at 26% should round to 30 with step=10
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: 26, clientY: 10, identifier: 0 } as Touch],
      bubbles: true,
      cancelable: true,
    })
    
    fireEvent(slider, touchStart)
    expect(defaultProps.onChange).toHaveBeenCalledWith(30)
  })

  it('should clamp values to min/max bounds', () => {
    const { container } = render(<TouchSlider {...defaultProps} />)
    const slider = container.querySelector('input[type="range"]') as HTMLInputElement
    
    slider.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      width: 100,
      right: 100,
      top: 0,
      bottom: 20,
      height: 20,
      x: 0,
      y: 0,
      toJSON: () => {},
    }))

    // Touch before slider start
    const touchBefore = new TouchEvent('touchstart', {
      touches: [{ clientX: -10, clientY: 10, identifier: 0 } as Touch],
      bubbles: true,
      cancelable: true,
    })
    
    fireEvent(slider, touchBefore)
    expect(defaultProps.onChange).toHaveBeenCalledWith(0)
    
    // Touch after slider end
    defaultProps.onChange.mockClear()
    const touchAfter = new TouchEvent('touchstart', {
      touches: [{ clientX: 110, clientY: 10, identifier: 0 } as Touch],
      bubbles: true,
      cancelable: true,
    })
    
    fireEvent(slider, touchAfter)
    expect(defaultProps.onChange).toHaveBeenCalledWith(100)
  })

  it('should handle touchcancel event', () => {
    const { container } = render(<TouchSlider {...defaultProps} />)
    const slider = container.querySelector('input[type="range"]') as HTMLInputElement
    
    slider.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      width: 100,
      right: 100,
      top: 0,
      bottom: 20,
      height: 20,
      x: 0,
      y: 0,
      toJSON: () => {},
    }))

    // Start touch
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: 50, clientY: 10, identifier: 0 } as Touch],
      bubbles: true,
      cancelable: true,
    })
    fireEvent(slider, touchStart)
    
    // Cancel touch
    const touchCancel = new TouchEvent('touchcancel', {
      touches: [],
      bubbles: true,
      cancelable: true,
    })
    fireEvent(slider, touchCancel)
    
    // Touch move after cancel should not trigger onChange
    defaultProps.onChange.mockClear()
    const touchMove = new TouchEvent('touchmove', {
      touches: [{ clientX: 75, clientY: 10, identifier: 0 } as Touch],
      bubbles: true,
      cancelable: true,
    })
    fireEvent(slider, touchMove)
    expect(defaultProps.onChange).not.toHaveBeenCalled()
  })

  it('should remove event listeners on unmount', () => {
    const { container, unmount } = render(<TouchSlider {...defaultProps} />)
    const slider = container.querySelector('input[type="range"]') as HTMLInputElement
    
    const removeEventListenerSpy = vi.spyOn(slider, 'removeEventListener')
    
    unmount()
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchcancel', expect.any(Function))
  })
})