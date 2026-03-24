import { useState, useRef, useEffect } from 'react'
import { Image, Upload, Download, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LazyImage from '../../components/LazyImage'
import { useToolHistory } from '../../hooks/useToolHistory'
import { FavoriteButton } from '../../components/FavoriteButton'

export default function FaviconGenerator() {
  const { t } = useTranslation()
  const [image, setImage] = useState<string | null>(null)
  const [sizes] = useState([16, 32, 48, 64, 128, 256])
  const [selectedSizes, setSelectedSizes] = useState([16, 32, 48])
  const [bgColor, setBgColor] = useState('#ffffff')
  const [transparent, setTransparent] = useState(true)
  const [removeBackground, setRemoveBackground] = useState(false)
  const [bgColorToRemove, setBgColorToRemove] = useState('#f0f0f0')
  const [tolerance, setTolerance] = useState(30)
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // 工具历史记录
  const { recordToolUsage } = useToolHistory()

  // 记录工具使用
  useEffect(() => {
    recordToolUsage('favicon-generator', t('pages.faviconGenerator.historyTitle'), t('pages.faviconGenerator.historyCategory'))
  }, [recordToolUsage, t])

  // 当图片、背景色或透明度改变时，更新预览
  useEffect(() => {
    if (!image) {
      setPreviewUrls({})
      return
    }

    const generatePreviews = async () => {
      const newPreviewUrls: Record<number, string> = {}
      for (const size of selectedSizes) {
        const dataUrl = await generateFavicon(size)
        newPreviewUrls[size] = dataUrl
      }
      setPreviewUrls(newPreviewUrls)
    }

    generatePreviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, bgColor, transparent, selectedSizes, removeBackground, bgColorToRemove, tolerance])

  // 使用原生事件监听器处理拖拽
  useEffect(() => {
    const dropZone = dropZoneRef.current
    if (!dropZone) return

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy'
      }
    }

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      // 检查是否真的离开了拖拽区域
      if (!dropZone.contains(e.relatedTarget as Node)) {
        setIsDragging(false)
      }
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      
      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        const file = files[0]
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (event) => {
            setImage(event.target?.result as string)
          }
          reader.readAsDataURL(file)
        } else {
          alert(t('pages.faviconGenerator.uploadImageFile'))
        }
      }
    }

    dropZone.addEventListener('dragover', handleDragOver)
    dropZone.addEventListener('dragenter', handleDragEnter)
    dropZone.addEventListener('dragleave', handleDragLeave)
    dropZone.addEventListener('drop', handleDrop)

    return () => {
      dropZone.removeEventListener('dragover', handleDragOver)
      dropZone.removeEventListener('dragenter', handleDragEnter)
      dropZone.removeEventListener('dragleave', handleDragLeave)
      dropZone.removeEventListener('drop', handleDrop)
    }
  }, [image]) // 当 image 变化时重新绑定（因为 dropZone 可能会消失）

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          setImage(event.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        alert(t('pages.faviconGenerator.uploadImageFile'))
      }
    }
  }

  const toggleSize = (size: number) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter(s => s !== size))
    } else {
      setSelectedSizes([...selectedSizes, size].sort((a, b) => a - b))
    }
  }

  // 移除指定颜色的背景
  const removeColorBackground = (sourceCanvas: HTMLCanvasElement): HTMLCanvasElement => {
    const canvas = document.createElement('canvas')
    canvas.width = sourceCanvas.width
    canvas.height = sourceCanvas.height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    
    ctx.drawImage(sourceCanvas, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    // 解析要移除的颜色
    const hexColor = bgColorToRemove.replace('#', '')
    const targetR = parseInt(hexColor.substr(0, 2), 16)
    const targetG = parseInt(hexColor.substr(2, 2), 16)
    const targetB = parseInt(hexColor.substr(4, 2), 16)
    
    // 遍历每个像素
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      // 计算颜色差异
      const diff = Math.abs(r - targetR) + Math.abs(g - targetG) + Math.abs(b - targetB)
      
      // 如果颜色在容差范围内，设置为透明
      if (diff <= tolerance) {
        data[i + 3] = 0 // 设置 alpha 为 0（完全透明）
      }
    }
    
    ctx.putImageData(imageData, 0, 0)
    return canvas
  }

  const generateFavicon = async (size: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d', { 
        alpha: true,
        willReadFrequently: false 
      })!

      const img = new window.Image()
      
      img.onload = () => {
        // 先在临时 canvas 上绘制原图
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = size
        tempCanvas.height = size
        const tempCtx = tempCanvas.getContext('2d', { alpha: true })!
        
        // 计算缩放比例，保持宽高比
        const scale = Math.min(size / img.width, size / img.height)
        const width = img.width * scale
        const height = img.height * scale
        const x = (size - width) / 2
        const y = (size - height) / 2
        
        tempCtx.drawImage(img, x, y, width, height)
        
        // 如果需要移除背景色
        let processedCanvas = tempCanvas
        if (removeBackground) {
          processedCanvas = removeColorBackground(tempCanvas)
        }
        
        // 如果不透明，先填充背景色
        if (!transparent) {
          ctx.fillStyle = bgColor
          ctx.fillRect(0, 0, size, size)
        }
        
        // 绘制处理后的图片
        ctx.drawImage(processedCanvas, 0, 0)
        
        // 确保导出 PNG 时保留透明度
        resolve(canvas.toDataURL('image/png'))
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      
      // 对于 data URL，不需要设置 crossOrigin
      img.src = image!
    })
  }

  const downloadFavicon = async (size: number) => {
    if (!image) return
    try {
      const dataUrl = await generateFavicon(size)
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `favicon-${size}x${size}.png`
      a.click()
      
      // 调试：检查生成的图片是否真的有透明度
      if (transparent) {
        console.log(`Generated ${size}x${size} with transparent background`)
      } else {
        console.log(`Generated ${size}x${size} with background color: ${bgColor}`)
      }
    } catch (error) {
      console.error('Failed to generate favicon:', error)
      alert(t('pages.faviconGenerator.generateFailed'))
    }
  }

  const downloadAll = async () => {
    if (!image) return
    for (const size of selectedSizes) {
      await downloadFavicon(size)
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  const downloadIco = async () => {
    if (!image) return
    
    // 生成真正的 ICO 文件格式，包含用户选择的所有尺寸
    const images: { size: number; data: Uint8Array }[] = []
    
    for (const size of selectedSizes) {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d', { 
        alpha: true,
        willReadFrequently: false 
      })!
      
      await new Promise<void>((resolve) => {
        const img = new window.Image()
        img.onload = () => {
          // 先在临时 canvas 上绘制原图
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = size
          tempCanvas.height = size
          const tempCtx = tempCanvas.getContext('2d', { alpha: true })!
          
          const scale = Math.min(size / img.width, size / img.height)
          const width = img.width * scale
          const height = img.height * scale
          const x = (size - width) / 2
          const y = (size - height) / 2
          
          tempCtx.drawImage(img, x, y, width, height)
          
          // 如果需要移除背景色
          let processedCanvas = tempCanvas
          if (removeBackground) {
            processedCanvas = removeColorBackground(tempCanvas)
          }
          
          // 如果不透明，先填充背景色
          if (!transparent) {
            ctx.fillStyle = bgColor
            ctx.fillRect(0, 0, size, size)
          }
          
          // 绘制处理后的图片
          ctx.drawImage(processedCanvas, 0, 0)
          resolve()
        }
        img.src = image!
      })
      
      // 获取 PNG 数据
      const pngDataUrl = canvas.toDataURL('image/png')
      const pngBase64 = pngDataUrl.split(',')[1]
      const pngBinary = atob(pngBase64)
      const pngData = new Uint8Array(pngBinary.length)
      for (let i = 0; i < pngBinary.length; i++) {
        pngData[i] = pngBinary.charCodeAt(i)
      }
      
      images.push({ size, data: pngData })
    }
    
    // 构建 ICO 文件
    const headerSize = 6
    const dirEntrySize = 16
    const numImages = images.length
    
    let totalSize = headerSize + (dirEntrySize * numImages)
    const imageOffsets: number[] = []
    for (const img of images) {
      imageOffsets.push(totalSize)
      totalSize += img.data.length
    }
    
    const icoBuffer = new ArrayBuffer(totalSize)
    const view = new DataView(icoBuffer)
    const uint8View = new Uint8Array(icoBuffer)
    
    // ICO 文件头
    view.setUint16(0, 0, true)
    view.setUint16(2, 1, true)
    view.setUint16(4, numImages, true)
    
    // 图像目录项
    let offset = headerSize
    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      view.setUint8(offset, img.size < 256 ? img.size : 0)
      view.setUint8(offset + 1, img.size < 256 ? img.size : 0)
      view.setUint8(offset + 2, 0)
      view.setUint8(offset + 3, 0)
      view.setUint16(offset + 4, 1, true)
      view.setUint16(offset + 6, 32, true)
      view.setUint32(offset + 8, img.data.length, true)
      view.setUint32(offset + 12, imageOffsets[i], true)
      offset += dirEntrySize
    }
    
    // 写入图像数据
    for (let i = 0; i < images.length; i++) {
      uint8View.set(images[i].data, imageOffsets[i])
    }
    
    // 下载文件
    const blob = new Blob([icoBuffer], { type: 'image/x-icon' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'favicon.ico'
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearImage = () => {
    setImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-fuchsia-400 to-fuchsia-600 rounded-2xl flex items-center justify-center">
            <Image className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('pages.faviconGenerator.title')}</h1>
            <p className="text-gray-500">{t('pages.faviconGenerator.description')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton
            toolId="favicon-generator"
            size="md"
            variant="outline"
            showLabel={false}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">{t('pages.faviconGenerator.uploadTitle')}</h2>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              aria-label={t('pages.faviconGenerator.uploadAria')}
            />
            {!image ? (
              <div
                ref={dropZoneRef}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                  isDragging 
                    ? 'border-fuchsia-500 bg-fuchsia-50' 
                    : 'border-gray-300 hover:border-fuchsia-500 hover:bg-fuchsia-50'
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    fileInputRef.current?.click()
                  }
                }}
                aria-label={t('pages.faviconGenerator.dropzoneAria')}
              >
                <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-fuchsia-500' : 'text-gray-400'}`} />
                <p className={isDragging ? 'text-fuchsia-600' : 'text-gray-600'}>
                  {isDragging ? t('pages.faviconGenerator.dropRelease') : t('pages.faviconGenerator.dropClick')}
                </p>
                <p className="text-gray-400 text-sm mt-2">{t('pages.faviconGenerator.supportFormats')}</p>
              </div>
            ) : (
              <div className="relative">
                <LazyImage src={image} alt="preview" className="w-full h-64 object-contain bg-gray-100 rounded-lg" />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  aria-label={t('pages.faviconGenerator.clearImage')}
                  title={t('pages.faviconGenerator.clearImageTitle')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">{t('pages.faviconGenerator.settingsTitle')}</h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={removeBackground}
                    onChange={(e) => setRemoveBackground(e.target.checked)}
                    className="rounded"
                    aria-label={t('pages.faviconGenerator.removeBackground')}
                  />
                  {t('pages.faviconGenerator.removeBackground')}
                </label>
                {removeBackground && (
                  <div className="mt-3 ml-6 space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{t('pages.faviconGenerator.removeColor')}</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={bgColorToRemove}
                          onChange={(e) => setBgColorToRemove(e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer"
                          aria-label={t('pages.faviconGenerator.removeColorPicker')}
                        />
                        <input
                          type="text"
                          value={bgColorToRemove}
                          onChange={(e) => setBgColorToRemove(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded"
                          aria-label={t('pages.faviconGenerator.removeColorValue')}
                          placeholder="#f0f0f0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('pages.faviconGenerator.tolerance', { value: tolerance })}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={tolerance}
                        onChange={(e) => setTolerance(Number(e.target.value))}
                        className="w-full"
                        aria-label={t('pages.faviconGenerator.toleranceAria')}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {t('pages.faviconGenerator.toleranceTip')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={transparent}
                    onChange={(e) => setTransparent(e.target.checked)}
                    className="rounded"
                    aria-label={t('pages.faviconGenerator.transparentBackground')}
                  />
                  {t('pages.faviconGenerator.transparentBackground')}
                </label>
                {transparent && !removeBackground && (
                  <p className="text-xs text-amber-600 mt-1 ml-6">
                    {t('pages.faviconGenerator.transparentTip')}
                  </p>
                )}
              </div>
              {!transparent && (
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('pages.faviconGenerator.backgroundColor')}</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                    aria-label={t('pages.faviconGenerator.backgroundColorPicker')}
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                    aria-label={t('pages.faviconGenerator.backgroundColorValue')}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('pages.faviconGenerator.selectSize')}</label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        selectedSizes.includes(size)
                          ? 'bg-fuchsia-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      aria-label={t('pages.faviconGenerator.sizeAria', {
                        size,
                        state: selectedSizes.includes(size) ? t('pages.faviconGenerator.selectedState') : ''
                      })}
                      title={t('pages.faviconGenerator.toggleSizeTitle', { size, shortcut: sizes.indexOf(size) + 1 })}
                    >
                      {size}x{size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview & Download */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">{t('pages.faviconGenerator.previewTitle')}</h2>
            {image ? (
              <div className="grid grid-cols-3 gap-4">
                {selectedSizes.map((size) => (
                  <div key={size} className="text-center">
                    <div 
                      className="mx-auto mb-2 rounded-lg flex items-center justify-center"
                      style={{ 
                        width: Math.min(size, 64), 
                        height: Math.min(size, 64),
                        backgroundColor: transparent ? 'transparent' : bgColor,
                        backgroundImage: transparent 
                          ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                          : 'none',
                        backgroundSize: transparent ? '10px 10px' : 'auto',
                        backgroundPosition: transparent ? '0 0, 0 5px, 5px -5px, -5px 0px' : 'auto'
                      }}
                    >
                      {previewUrls[size] ? (
                        <img
                          src={previewUrls[size]}
                          alt={`${size}x${size}`}
                          className="object-contain w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          {t('pages.faviconGenerator.generating')}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{size}x{size}</p>
                    <button
                      onClick={() => downloadFavicon(size)}
                      className="mt-1 text-xs text-fuchsia-600 hover:text-fuchsia-700"
                      aria-label={t('pages.faviconGenerator.downloadSizeAria', { size })}
                      title={t('pages.faviconGenerator.downloadSizeAria', { size })}
                    >
                      {t('pages.faviconGenerator.download')}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                {t('pages.faviconGenerator.uploadFirst')}
              </div>
            )}
          </div>

          {image && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-800 mb-4">{t('pages.faviconGenerator.downloadTitle')}</h2>
              <div className="space-y-3">
                <button
                  onClick={downloadAll}
                  className="w-full py-3 bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 text-white rounded-lg hover:from-fuchsia-600 hover:to-fuchsia-700 transition-colors flex items-center justify-center gap-2"
                  aria-label={t('pages.faviconGenerator.downloadAllPng')}
                  title={t('pages.faviconGenerator.downloadAllPngTitle')}
                >
                  <Download className="w-5 h-5" />
                  {t('pages.faviconGenerator.downloadAllPng')}
                </button>
                <button
                  onClick={downloadIco}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  aria-label={t('pages.faviconGenerator.downloadIco')}
                  title={t('pages.faviconGenerator.downloadIcoTitle')}
                >
                  <Download className="w-5 h-5" />
                  {t('pages.faviconGenerator.downloadIco')}
                </button>
              </div>
            </div>
          )}

          <div className="bg-fuchsia-50 rounded-xl p-6 border border-fuchsia-100">
            <h3 className="font-semibold text-fuchsia-800 mb-2">{t('pages.faviconGenerator.usageTitle')}</h3>
            <ul className="text-fuchsia-700 text-sm leading-relaxed space-y-1">
              {(t('pages.faviconGenerator.usageItems', { returnObjects: true }) as string[]).map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
