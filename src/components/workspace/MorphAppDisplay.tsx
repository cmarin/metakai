import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from '../../store'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'

interface VideoFrame {
  imageData: ImageData
  timestamp: number
}

let ffmpegInstance: FFmpeg | null = null

// Type guard to check if constructor expects arguments
const createFFmpeg = (): any => {
  try {
    // Try with no arguments first
    return new (FFmpeg as any)()
  } catch {
    try {
      // If that fails, try with options
      return new (FFmpeg as any)({ log: false })
    } catch {
      // Last resort - just create it however works
      const F = FFmpeg as any
      return new F()
    }
  }
}

export function MorphAppDisplay() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoCanvasRef = useRef<HTMLCanvasElement>(null)
  const sourceImageRef = useRef<HTMLImageElement | null>(null)
  const targetImageRef = useRef<HTMLImageElement | null>(null)
  const [targetImageUrl, setTargetImageUrl] = useState<string | null>(null)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [videoFrames, setVideoFrames] = useState<VideoFrame[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const animationRef = useRef<number | undefined>(undefined)
  const lastFrameTimeRef = useRef<number>(0)
  const ffmpegRef = useRef<any>(null)
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  
  const image = useStore((state) => state.workspace.image)
  const controls = useStore((state) => state.filter.controls)
  
  const morphAmount = controls.find(c => c.id === 'morphAmount')?.value as number || 0
  const totalFrames = controls.find(c => c.id === 'frames')?.value as number || 30
  const fps = controls.find(c => c.id === 'fps')?.value as number || 30
  const transitionType = controls.find(c => c.id === 'transitionType')?.value as string || 'linear'
  
  // Initialize FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        if (!ffmpegInstance) {
          ffmpegInstance = createFFmpeg()
          
          if (ffmpegInstance && ffmpegInstance.on) {
            ffmpegInstance.on('progress', ({ progress }: any) => {
              setExportProgress(Math.round(progress * 100))
            })
          }
          
          if (ffmpegInstance && ffmpegInstance.load) {
            await ffmpegInstance.load()
          }
        }
        
        ffmpegRef.current = ffmpegInstance
        setFfmpegLoaded(true)
      } catch (error) {
        console.error('Failed to load FFmpeg:', error)
      }
    }
    
    loadFFmpeg()
  }, [])
  
  // Load source image
  useEffect(() => {
    if (!image?.url) return
    
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      sourceImageRef.current = img
      updateMorphPreview()
    }
    img.src = image.url
  }, [image])
  
  // Load target image
  useEffect(() => {
    if (!targetImageUrl) return
    
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      targetImageRef.current = img
      updateMorphPreview()
    }
    img.src = targetImageUrl
  }, [targetImageUrl])
  
  // Update preview when controls change
  useEffect(() => {
    updateMorphPreview()
  }, [morphAmount, transitionType])
  
  const handleTargetImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setTargetImageUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }
  
  const easeTransition = (t: number, type: string): number => {
    switch (type) {
      case 'ease-in':
        return t * t
      case 'ease-out':
        return t * (2 - t)
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      default:
        return t
    }
  }
  
  const updateMorphPreview = () => {
    const canvas = canvasRef.current
    const sourceImg = sourceImageRef.current
    const targetImg = targetImageRef.current
    
    if (!canvas || !sourceImg) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = sourceImg.width
    canvas.height = sourceImg.height
    
    if (!targetImg) {
      ctx.drawImage(sourceImg, 0, 0)
      return
    }
    
    // Create temporary canvases for source and target
    const sourceCanvas = document.createElement('canvas')
    const targetCanvas = document.createElement('canvas')
    sourceCanvas.width = targetCanvas.width = sourceImg.width
    sourceCanvas.height = targetCanvas.height = sourceImg.height
    
    const sourceCtx = sourceCanvas.getContext('2d')!
    const targetCtx = targetCanvas.getContext('2d')!
    
    sourceCtx.drawImage(sourceImg, 0, 0)
    targetCtx.drawImage(targetImg, 0, 0, sourceImg.width, sourceImg.height)
    
    const sourceData = sourceCtx.getImageData(0, 0, sourceImg.width, sourceImg.height)
    const targetData = targetCtx.getImageData(0, 0, sourceImg.width, sourceImg.height)
    const outputData = ctx.createImageData(sourceImg.width, sourceImg.height)
    
    const t = easeTransition(morphAmount / 100, transitionType)
    
    // Simple linear interpolation between pixels
    for (let i = 0; i < sourceData.data.length; i += 4) {
      outputData.data[i] = sourceData.data[i] * (1 - t) + targetData.data[i] * t
      outputData.data[i + 1] = sourceData.data[i + 1] * (1 - t) + targetData.data[i + 1] * t
      outputData.data[i + 2] = sourceData.data[i + 2] * (1 - t) + targetData.data[i + 2] * t
      outputData.data[i + 3] = sourceData.data[i + 3] * (1 - t) + targetData.data[i + 3] * t
    }
    
    ctx.putImageData(outputData, 0, 0)
  }
  
  const generateVideo = useCallback(async () => {
    const sourceImg = sourceImageRef.current
    const targetImg = targetImageRef.current
    
    if (!sourceImg || !targetImg) {
      alert('Please upload both source and target images')
      return
    }
    
    setIsGeneratingVideo(true)
    const frames: VideoFrame[] = []
    
    // Create temporary canvas for frame generation
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = sourceImg.width
    tempCanvas.height = sourceImg.height
    const tempCtx = tempCanvas.getContext('2d')!
    
    const sourceCanvas = document.createElement('canvas')
    const targetCanvas = document.createElement('canvas')
    sourceCanvas.width = targetCanvas.width = sourceImg.width
    sourceCanvas.height = targetCanvas.height = sourceImg.height
    
    const sourceCtx = sourceCanvas.getContext('2d')!
    const targetCtx = targetCanvas.getContext('2d')!
    
    sourceCtx.drawImage(sourceImg, 0, 0)
    targetCtx.drawImage(targetImg, 0, 0, sourceImg.width, sourceImg.height)
    
    const sourceData = sourceCtx.getImageData(0, 0, sourceImg.width, sourceImg.height)
    const targetData = targetCtx.getImageData(0, 0, sourceImg.width, sourceImg.height)
    
    // Generate frames
    for (let frame = 0; frame < totalFrames; frame++) {
      const progress = frame / (totalFrames - 1)
      const t = easeTransition(progress, transitionType)
      
      const frameData = tempCtx.createImageData(sourceImg.width, sourceImg.height)
      
      // Interpolate pixels
      for (let i = 0; i < sourceData.data.length; i += 4) {
        frameData.data[i] = sourceData.data[i] * (1 - t) + targetData.data[i] * t
        frameData.data[i + 1] = sourceData.data[i + 1] * (1 - t) + targetData.data[i + 1] * t
        frameData.data[i + 2] = sourceData.data[i + 2] * (1 - t) + targetData.data[i + 2] * t
        frameData.data[i + 3] = sourceData.data[i + 3] * (1 - t) + targetData.data[i + 3] * t
      }
      
      frames.push({
        imageData: frameData,
        timestamp: frame * (1000 / fps)
      })
    }
    
    setVideoFrames(frames)
    setIsGeneratingVideo(false)
    setCurrentFrame(0)
  }, [totalFrames, fps, transitionType])
  
  const playVideo = useCallback(() => {
    if (videoFrames.length === 0) return
    
    setIsPlaying(true)
    lastFrameTimeRef.current = performance.now()
    
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastFrameTimeRef.current
      
      if (deltaTime >= 1000 / fps) {
        setCurrentFrame(prev => {
          const next = (prev + 1) % videoFrames.length
          
          // Draw current frame
          const videoCanvas = videoCanvasRef.current
          if (videoCanvas) {
            const ctx = videoCanvas.getContext('2d')
            if (ctx && videoFrames[next]) {
              ctx.putImageData(videoFrames[next].imageData, 0, 0)
            }
          }
          
          return next
        })
        
        lastFrameTimeRef.current = currentTime
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animationRef.current = requestAnimationFrame(animate)
  }, [videoFrames, fps])
  
  const stopVideo = () => {
    setIsPlaying(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }
  
  const downloadVideo = async () => {
    if (videoFrames.length === 0) {
      alert('Please generate a video first')
      return
    }
    
    if (!ffmpegRef.current || !ffmpegLoaded) {
      alert('Video encoder is still loading. Please try again.')
      return
    }
    
    try {
      setExportProgress(0)
      const ffmpeg = ffmpegRef.current
      
      // Create a temporary canvas for frame export
      const tempCanvas = document.createElement('canvas')
      const sourceImg = sourceImageRef.current!
      tempCanvas.width = sourceImg.width
      tempCanvas.height = sourceImg.height
      const ctx = tempCanvas.getContext('2d')!
      
      // Write frames to FFmpeg
      for (let i = 0; i < videoFrames.length; i++) {
        ctx.putImageData(videoFrames[i].imageData, 0, 0)
        
        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) => {
          tempCanvas.toBlob((blob) => resolve(blob!), 'image/png')
        })
        
        // Write frame to FFmpeg
        const frameData = await fetchFile(blob)
        await ffmpeg.writeFile(`frame_${String(i).padStart(4, '0')}.png`, frameData)
      }
      
      // Create video from frames
      await ffmpeg.exec([
        '-framerate', String(fps),
        '-i', 'frame_%04d.png',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-y',
        'output.mp4'
      ])
      
      // Read the output video
      const data = await ffmpeg.readFile('output.mp4')
      
      // Create download link
      const blob = new Blob([data], { type: 'video/mp4' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'morph-video.mp4'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      // Clean up FFmpeg files
      for (let i = 0; i < videoFrames.length; i++) {
        await ffmpeg.deleteFile(`frame_${String(i).padStart(4, '0')}.png`)
      }
      await ffmpeg.deleteFile('output.mp4')
      
      setExportProgress(0)
    } catch (error) {
      console.error('Failed to export video:', error)
      alert('Failed to export video. Please try again.')
      setExportProgress(0)
    }
  }
  
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])
  
  return (
    <div className="relative h-full">
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleTargetImageUpload}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
          />
          {targetImageUrl && (
            <div className="mt-2 text-sm text-green-600">✓ Target image loaded</div>
          )}
        </div>
        
        <div className="space-y-2">
          <button
            onClick={generateVideo}
            disabled={!targetImageUrl || isGeneratingVideo}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isGeneratingVideo ? 'Generating...' : 'Generate Video'}
          </button>
          
          {videoFrames.length > 0 && (
            <>
              <button
                onClick={isPlaying ? stopVideo : playVideo}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {isPlaying ? 'Stop' : 'Play'} Preview
              </button>
              
              <button
                onClick={downloadVideo}
                disabled={exportProgress > 0}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {exportProgress > 0 ? `Exporting... ${exportProgress}%` : 'Download MP4'}
              </button>
              
              <div className="text-sm text-gray-600">
                Frame: {currentFrame + 1} / {videoFrames.length}
              </div>
              
              {!ffmpegLoaded && (
                <div className="text-sm text-yellow-600">
                  Video encoder loading...
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="flex h-full">
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
        
        {videoFrames.length > 0 && (
          <div className="flex-1 relative border-l border-gray-300">
            <div className="absolute top-4 left-4 text-sm font-medium text-gray-700">
              Video Preview
            </div>
            <canvas
              ref={videoCanvasRef}
              width={sourceImageRef.current?.width || 800}
              height={sourceImageRef.current?.height || 600}
              className="absolute inset-0 w-full h-full object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}