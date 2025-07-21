import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

let ffmpegInstance: FFmpeg | null = null
let loadPromise: Promise<boolean> | null = null

export async function getFFmpeg(): Promise<FFmpeg> {
  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg()
    
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
    
    loadPromise = ffmpegInstance.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })
  }
  
  if (loadPromise) {
    await loadPromise
  }
  
  return ffmpegInstance
}

export function isFFmpegLoaded(): boolean {
  return ffmpegInstance !== null && loadPromise !== null
}