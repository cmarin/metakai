import '@testing-library/jest-dom'

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock WebGL context
HTMLCanvasElement.prototype.getContext = (() => {
  const originalGetContext = HTMLCanvasElement.prototype.getContext
  return function(this: HTMLCanvasElement, contextType: string, ...args: any[]) {
    if (contextType === 'webgl2' || contextType === 'webgl') {
      return {
        canvas: this,
        drawingBufferWidth: 800,
        drawingBufferHeight: 600,
        getParameter: () => '',
        getExtension: () => null,
        getShaderPrecisionFormat: () => ({ precision: 23, rangeMin: 127, rangeMax: 127 }),
        createShader: () => ({}),
        shaderSource: () => {},
        compileShader: () => {},
        getShaderParameter: () => true,
      }
    }
    return originalGetContext.apply(this, [contextType, ...args])
  }
})()