declare module 'gif.js' {
  interface GIFOptions {
    workers?: number
    quality?: number
    width?: number
    height?: number
    workerScript?: string
    repeat?: number
    transparent?: number | string
    background?: string
    dither?: boolean | string
  }

  interface AddFrameOptions {
    delay?: number
    copy?: boolean
    dispose?: number
  }

  class GIF {
    constructor(options?: GIFOptions)
    addFrame(image: ImageData | HTMLCanvasElement | CanvasRenderingContext2D | HTMLImageElement, options?: AddFrameOptions): void
    on(event: 'finished', callback: (blob: Blob) => void): void
    on(event: 'progress', callback: (progress: number) => void): void
    on(event: 'abort', callback: () => void): void
    render(): void
    abort(): void
    running: boolean
  }

  export = GIF
}