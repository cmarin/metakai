import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from '../../store'
import { fetchFile } from '@ffmpeg/util'
import { getFFmpeg } from '../../utils/ffmpeg-loader'
import GIF from 'gif.js'
import { FeaturePointSelector } from './FeaturePointSelector'
import { MorphEngine } from '../../utils/morphing/morph-engine'
import type { FeaturePoint } from '../../utils/morphing/morph-engine'
import { DownloadModal } from '../ui/DownloadModal'
import { VideoGenerationModal } from '../ui/VideoGenerationModal'

interface VideoFrame {
  imageData: ImageData
  timestamp: number
}

export function MorphDisplay() {
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null)
  const targetCanvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const sourceImageRef = useRef<HTMLImageElement | null>(null)
  const targetImageRef = useRef<HTMLImageElement | null>(null)
  const sourceInputRef = useRef<HTMLInputElement>(null)
  const targetInputRef = useRef<HTMLInputElement>(null)
  
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null)
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
  const [showFeaturePoints, setShowFeaturePoints] = useState(false)
  const [featurePoints, setFeaturePoints] = useState<FeaturePoint[]>([])
  const [morphMode, setMorphMode] = useState<'simple' | 'advanced'>('simple')
  const morphEngineRef = useRef<MorphEngine | null>(null)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [sourceImageLoaded, setSourceImageLoaded] = useState(false)
  const [targetImageLoaded, setTargetImageLoaded] = useState(false)
  
  const image = useStore((state) => state.workspace.image)
  const controls = useStore((state) => state.filter.controls)
  
  const morphModeControl = controls.find(c => c.id === 'morphMode')?.value as string || 'simple'
  const morphAmount = controls.find(c => c.id === 'morphAmount')?.value as number || 0
  const totalFrames = controls.find(c => c.id === 'frames')?.value as number || 30
  const fps = controls.find(c => c.id === 'fps')?.value as number || 30
  const transitionType = controls.find(c => c.id === 'transitionType')?.value as string || 'linear'
  
  // Update morph mode when control changes
  useEffect(() => {
    setMorphMode(morphModeControl as 'simple' | 'advanced')
  }, [morphModeControl])
  
  // Initialize FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        const ffmpeg = await getFFmpeg()
        
        ffmpeg.on('progress', ({ progress }) => {
          setExportProgress(Math.round(progress * 100))
        })
        
        ffmpegRef.current = ffmpeg
        setFfmpegLoaded(true)
      } catch (error) {
        console.error('Failed to load FFmpeg:', error)
      }
    }
    
    loadFFmpeg()
  }, [])
  
  // Load source image from workspace
  useEffect(() => {
    if (!image?.url) return
    setSourceImageUrl(image.url)
  }, [image])
  
  // Load source image
  useEffect(() => {
    if (!sourceImageUrl) {
      setSourceImageLoaded(false)
      return
    }
    
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      sourceImageRef.current = img
      setSourceImageLoaded(true)
      drawSourceImage()
      updateMorphPreview()
    }
    img.src = sourceImageUrl
  }, [sourceImageUrl])
  
  // Load target image
  useEffect(() => {
    if (!targetImageUrl) {
      setTargetImageLoaded(false)
      return
    }
    
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      targetImageRef.current = img
      setTargetImageLoaded(true)
      drawTargetImage()
      updateMorphPreview()
    }
    img.src = targetImageUrl
  }, [targetImageUrl])
  
  // Initialize morph engine when images change
  useEffect(() => {
    if (sourceImageRef.current && targetImageRef.current) {
      morphEngineRef.current = new MorphEngine(
        sourceImageRef.current.width,
        sourceImageRef.current.height
      )
      morphEngineRef.current.setSourceImage(sourceImageRef.current)
      morphEngineRef.current.setTargetImage(targetImageRef.current)
    }
  }, [sourceImageUrl, targetImageUrl])
  
  // Update preview when controls change
  useEffect(() => {
    updateMorphPreview()
  }, [morphAmount, transitionType, morphMode, featurePoints])
  
  const drawSourceImage = () => {
    const canvas = sourceCanvasRef.current
    const img = sourceImageRef.current
    if (!canvas || !img) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)
  }
  
  const drawTargetImage = () => {
    const canvas = targetCanvasRef.current
    const img = targetImageRef.current
    if (!canvas || !img) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)
  }
  
  const handleSourceImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setSourceImageUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }
  
  const handleTargetImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setTargetImageUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }
  
  const swapImages = () => {
    const tempUrl = sourceImageUrl
    const tempImg = sourceImageRef.current
    
    setSourceImageUrl(targetImageUrl)
    setTargetImageUrl(tempUrl)
    
    sourceImageRef.current = targetImageRef.current
    targetImageRef.current = tempImg
    
    drawSourceImage()
    drawTargetImage()
    updateMorphPreview()
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
    const canvas = previewCanvasRef.current
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
    
    if (morphMode === 'advanced' && morphEngineRef.current && featurePoints.length > 0) {
      // Use advanced morphing
      const morphedData = morphEngineRef.current.morph(featurePoints, t)
      ctx.putImageData(morphedData, 0, 0)
    } else {
      // Simple linear interpolation between pixels
      for (let i = 0; i < sourceData.data.length; i += 4) {
        outputData.data[i] = sourceData.data[i] * (1 - t) + targetData.data[i] * t
        outputData.data[i + 1] = sourceData.data[i + 1] * (1 - t) + targetData.data[i + 1] * t
        outputData.data[i + 2] = sourceData.data[i + 2] * (1 - t) + targetData.data[i + 2] * t
        outputData.data[i + 3] = sourceData.data[i + 3] * (1 - t) + targetData.data[i + 3] * t
      }
      
      ctx.putImageData(outputData, 0, 0)
    }
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
      
      let frameData: ImageData
      
      if (morphMode === 'advanced' && morphEngineRef.current && featurePoints.length > 0) {
        // Use advanced morphing
        frameData = morphEngineRef.current.morph(featurePoints, t)
      } else {
        // Simple interpolation
        frameData = tempCtx.createImageData(sourceImg.width, sourceImg.height)
        
        for (let i = 0; i < sourceData.data.length; i += 4) {
          frameData.data[i] = sourceData.data[i] * (1 - t) + targetData.data[i] * t
          frameData.data[i + 1] = sourceData.data[i + 1] * (1 - t) + targetData.data[i + 1] * t
          frameData.data[i + 2] = sourceData.data[i + 2] * (1 - t) + targetData.data[i + 2] * t
          frameData.data[i + 3] = sourceData.data[i + 3] * (1 - t) + targetData.data[i + 3] * t
        }
      }
      
      frames.push({
        imageData: frameData,
        timestamp: frame * (1000 / fps)
      })
    }
    
    setVideoFrames(frames)
    setIsGeneratingVideo(false)
    setCurrentFrame(0)
    setShowVideoModal(true)
  }, [totalFrames, fps, transitionType])
  
  const playVideo = useCallback(() => {
    if (videoFrames.length === 0) return
    
    setIsPlaying(true)
    lastFrameTimeRef.current = performance.now()
    
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastFrameTimeRef.current
      
      if (deltaTime >= 1000 / fps) {
        setCurrentFrame(prev => (prev + 1) % videoFrames.length)
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
  
  const resetVideo = () => {
    stopVideo()
    setCurrentFrame(0)
  }
  
  const downloadMP4 = async () => {
    if (videoFrames.length === 0) {
      alert('Please generate a video first')
      setShowDownloadModal(false)
      return
    }
    
    try {
      setIsExporting(true)
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
        // Clear canvas first
        ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
        ctx.putImageData(videoFrames[i].imageData, 0, 0)
        
        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          tempCanvas.toBlob((blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create blob from canvas'))
            }
          }, 'image/png')
        })
        
        // Write frame to FFmpeg
        const frameData = await fetchFile(blob)
        await ffmpeg.writeFile(`frame_${String(i).padStart(4, '0')}.png`, frameData)
        setExportProgress(Math.round((i + 1) / videoFrames.length * 50)) // 50% for frame export
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
      
      // Check if we're on iOS Safari
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
      
      if (isIOS) {
        // For iOS, we can't force downloads. Show the video in a new window
        const url = URL.createObjectURL(blob)
        
        // Create a modal to show the video with save instructions
        const modal = document.createElement('div')
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.9);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
        `
        
        const instructions = document.createElement('p')
        instructions.style.cssText = `
          color: white;
          text-align: center;
          margin-bottom: 20px;
          font-size: 16px;
        `
        instructions.textContent = 'Tap and hold the video, then select "Save Video" to download'
        
        const video = document.createElement('video')
        video.src = url
        video.controls = true
        video.style.cssText = `
          max-width: 100%;
          max-height: 70vh;
          border-radius: 8px;
        `
        video.setAttribute('playsinline', 'true')
        
        const closeButton = document.createElement('button')
        closeButton.textContent = 'Close'
        closeButton.style.cssText = `
          margin-top: 20px;
          padding: 10px 20px;
          background: white;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
        `
        closeButton.onclick = () => {
          document.body.removeChild(modal)
          URL.revokeObjectURL(url)
        }
        
        modal.appendChild(instructions)
        modal.appendChild(video)
        modal.appendChild(closeButton)
        document.body.appendChild(modal)
        
        // Reset export state
        setExportProgress(0)
        setIsExporting(false)
        setShowDownloadModal(false)
      } else if (isSafari) {
        // For Safari desktop, open in new tab
        const url = URL.createObjectURL(blob)
        const newWindow = window.open(url, '_blank')
        if (newWindow) {
          newWindow.document.title = 'morph-video.mp4'
        }
        
        // Reset export state
        setExportProgress(0)
        setIsExporting(false)
        setShowDownloadModal(false)
      } else {
        // Standard download for other browsers
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'morph-video.mp4'
        a.setAttribute('download', 'morph-video.mp4')
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
      
      // Clean up FFmpeg files
      for (let i = 0; i < videoFrames.length; i++) {
        await ffmpeg.deleteFile(`frame_${String(i).padStart(4, '0')}.png`)
      }
      await ffmpeg.deleteFile('output.mp4')
      
      setExportProgress(0)
      setIsExporting(false)
      setShowDownloadModal(false)
    } catch (error) {
      console.error('Failed to export video:', error)
      alert('Failed to export video. Please try again.')
      setExportProgress(0)
      setIsExporting(false)
    }
  }
  
  const downloadGIF = () => {
    if (videoFrames.length === 0) {
      alert('Please generate a video first')
      setShowDownloadModal(false)
      return
    }
    
    try {
      setIsExporting(true)
      setExportProgress(0)
      
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: sourceImageRef.current!.width,
        height: sourceImageRef.current!.height,
        workerScript: '/gif.worker.js'
      })
      
      // Create a temporary canvas for frame export
      const tempCanvas = document.createElement('canvas')
      const sourceImg = sourceImageRef.current!
      tempCanvas.width = sourceImg.width
      tempCanvas.height = sourceImg.height
      const ctx = tempCanvas.getContext('2d')!
      
      // Add frames to GIF
      videoFrames.forEach((frame, index) => {
        ctx.putImageData(frame.imageData, 0, 0)
        gif.addFrame(ctx, { delay: 1000 / fps, copy: true })
        setExportProgress(Math.round((index + 1) / videoFrames.length * 100))
      })
      
      gif.on('progress', (progress) => {
        setExportProgress(Math.round(progress * 100))
      })
      
      gif.on('finished', (blob) => {
        // Check if we're on iOS Safari
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        
        if (isIOS) {
          // For iOS, show the GIF in a modal
          const url = URL.createObjectURL(blob)
          
          const modal = document.createElement('div')
          modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.9);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
          `
          
          const instructions = document.createElement('p')
          instructions.style.cssText = `
            color: white;
            text-align: center;
            margin-bottom: 20px;
            font-size: 16px;
          `
          instructions.textContent = 'Tap and hold the image, then select "Save Image" to download'
          
          const img = document.createElement('img')
          img.src = url
          img.style.cssText = `
            max-width: 100%;
            max-height: 70vh;
            border-radius: 8px;
          `
          
          const closeButton = document.createElement('button')
          closeButton.textContent = 'Close'
          closeButton.style.cssText = `
            margin-top: 20px;
            padding: 10px 20px;
            background: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
          `
          closeButton.onclick = () => {
            document.body.removeChild(modal)
            URL.revokeObjectURL(url)
            setExportProgress(0)
            setIsExporting(false)
            setShowDownloadModal(false)
          }
          
          modal.appendChild(instructions)
          modal.appendChild(img)
          modal.appendChild(closeButton)
          document.body.appendChild(modal)
        } else {
          // Standard download for other browsers
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'morph-animation.gif'
          a.setAttribute('download', 'morph-animation.gif')
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          setExportProgress(0)
          setIsExporting(false)
          setShowDownloadModal(false)
        }
      })
      
      gif.render()
    } catch (error) {
      console.error('Failed to export GIF:', error)
      alert('Failed to export animation. Please try again.')
      setExportProgress(0)
      setIsExporting(false)
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
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Main content area */}
      <div className="flex-1 overflow-auto p-4 pb-20">
        {/* Side-by-side images layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Source Image */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Start Image</h3>
              <input
                ref={sourceInputRef}
                type="file"
                accept="image/*"
                onChange={handleSourceImageUpload}
                className="hidden"
              />
              <button
                onClick={() => sourceInputRef.current?.click()}
                className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Change
              </button>
            </div>
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
              <canvas
                ref={sourceCanvasRef}
                className="w-full h-full object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          </div>
          
          {/* Target Image */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">End Image</h3>
              <input
                ref={targetInputRef}
                type="file"
                accept="image/*"
                onChange={handleTargetImageUpload}
                className="hidden"
              />
              <button
                onClick={() => targetInputRef.current?.click()}
                className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {targetImageUrl ? 'Change' : 'Select'}
              </button>
            </div>
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
              {targetImageUrl ? (
                <canvas
                  ref={targetCanvasRef}
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="text-sm">Select end image</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mb-4 justify-center">
          <button
            onClick={swapImages}
            disabled={!sourceImageUrl || !targetImageUrl}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Swap Images
          </button>
          
          <button
            onClick={generateVideo}
            disabled={!targetImageUrl || isGeneratingVideo || (morphMode === 'advanced' && featurePoints.length === 0)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isGeneratingVideo ? 'Generating...' : 'Generate Video'}
          </button>
          
          {morphMode === 'advanced' && (
            <button
              onClick={() => setShowFeaturePoints(!showFeaturePoints)}
              disabled={!sourceImageUrl || !targetImageUrl}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {showFeaturePoints ? 'Hide' : 'Show'} Feature Points
            </button>
          )}
        </div>
        
        {/* Feature Point Selector */}
        {morphMode === 'advanced' && showFeaturePoints && sourceImageLoaded && targetImageLoaded && sourceImageRef.current && targetImageRef.current && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Feature Point Mapping
            </h3>
            <FeaturePointSelector
              sourceImage={sourceImageRef.current}
              targetImage={targetImageRef.current}
              featurePoints={featurePoints}
              onFeaturePointsChange={setFeaturePoints}
            />
          </div>
        )}
        
        {/* Preview */}
        {(morphAmount > 0 || videoFrames.length > 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {videoFrames.length > 0 ? 'Video Preview' : 'Morph Preview'}
            </h3>
            <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
              <canvas
                ref={previewCanvasRef}
                className="w-full h-full object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          </div>
        )}
        
      </div>
      
      {/* Download Modal */}
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownloadMP4={downloadMP4}
        onDownloadGIF={downloadGIF}
        isExporting={isExporting}
        exportProgress={exportProgress}
        canUseMP4={ffmpegRef.current && ffmpegLoaded && typeof SharedArrayBuffer !== 'undefined'}
      />
      
      {/* Video Generation Modal */}
      <VideoGenerationModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        videoFrames={videoFrames}
        currentFrame={currentFrame}
        isPlaying={isPlaying}
        onPlay={playVideo}
        onPause={stopVideo}
        onReset={resetVideo}
        onFrameChange={setCurrentFrame}
        onExport={() => setShowDownloadModal(true)}
        fps={fps}
        width={sourceImageRef.current?.width || 800}
        height={sourceImageRef.current?.height || 600}
      />
    </div>
  )
}