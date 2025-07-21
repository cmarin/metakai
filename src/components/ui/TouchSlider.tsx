import { useRef, useEffect } from 'react'

interface TouchSliderProps {
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  className?: string
}

export function TouchSlider({ min, max, step, value, onChange, className = '' }: TouchSliderProps) {
  const sliderRef = useRef<HTMLInputElement>(null)
  const isDraggingRef = useRef(false)

  useEffect(() => {
    const slider = sliderRef.current
    if (!slider) return

    // Calculate value from touch position
    const calculateValue = (clientX: number) => {
      const rect = slider.getBoundingClientRect()
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const rawValue = min + (max - min) * percent
      
      // Round to step
      const steps = Math.round((rawValue - min) / step)
      return min + steps * step
    }

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      isDraggingRef.current = true
      
      const touch = e.touches[0]
      const newValue = calculateValue(touch.clientX)
      onChange(newValue)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return
      e.preventDefault()
      
      const touch = e.touches[0]
      const newValue = calculateValue(touch.clientX)
      onChange(newValue)
    }

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      isDraggingRef.current = false
    }

    // Add touch listeners with passive: false for iOS
    slider.addEventListener('touchstart', handleTouchStart, { passive: false })
    slider.addEventListener('touchmove', handleTouchMove, { passive: false })
    slider.addEventListener('touchend', handleTouchEnd, { passive: false })
    slider.addEventListener('touchcancel', handleTouchEnd, { passive: false })

    return () => {
      slider.removeEventListener('touchstart', handleTouchStart)
      slider.removeEventListener('touchmove', handleTouchMove)
      slider.removeEventListener('touchend', handleTouchEnd)
      slider.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [min, max, step, onChange])

  return (
    <input
      ref={sliderRef}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={className}
      style={{ touchAction: 'none' }}
    />
  )
}