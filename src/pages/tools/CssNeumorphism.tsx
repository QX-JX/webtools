import { useState } from 'react'
import { Box, Copy } from 'lucide-react'
import { copyToClipboard } from '../../utils/clipboard'
import { useI18nSection } from '../../i18n/helpers'

export default function CssNeumorphism() {
  const text = useI18nSection<any>('pages.cssNeumorphism')
  const [bgColor, setBgColor] = useState('#e0e5ec')
  const [size, setSize] = useState(200)
  const [radius, setRadius] = useState(50)
  const [distance, setDistance] = useState(20)
  const [intensity, setIntensity] = useState(0.15)
  const [blur, setBlur] = useState(60)
  const [shape, setShape] = useState<'flat' | 'concave' | 'convex' | 'pressed'>('flat')
  const [copied, setCopied] = useState(false)

  // 计算阴影颜色
  const adjustColor = (hex: string, amount: number) => {
    const num = parseInt(hex.slice(1), 16)
    const r = Math.min(255, Math.max(0, (num >> 16) + amount))
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount))
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount))
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }

  const lightColor = adjustColor(bgColor, Math.round(255 * intensity))
  const darkColor = adjustColor(bgColor, -Math.round(255 * intensity))

  const generateShadow = () => {
    const d = distance
    const b = blur

    switch (shape) {
      case 'concave':
        return `inset ${d}px ${d}px ${b}px ${darkColor}, inset -${d}px -${d}px ${b}px ${lightColor}`
      case 'convex':
        return `${d}px ${d}px ${b}px ${darkColor}, -${d}px -${d}px ${b}px ${lightColor}, inset ${d}px ${d}px ${b}px ${lightColor}, inset -${d}px -${d}px ${b}px ${darkColor}`
      case 'pressed':
        return `inset ${d}px ${d}px ${b}px ${darkColor}, inset -${d}px -${d}px ${b}px ${lightColor}`
      default: // flat
        return `${d}px ${d}px ${b}px ${darkColor}, -${d}px -${d}px ${b}px ${lightColor}`
    }
  }

  const generateBackground = () => {
    switch (shape) {
      case 'concave':
        return `linear-gradient(145deg, ${darkColor}, ${lightColor})`
      case 'convex':
        return `linear-gradient(145deg, ${lightColor}, ${darkColor})`
      default:
        return bgColor
    }
  }

  const generateCss = () => {
    const bg = shape === 'concave' || shape === 'convex' 
      ? `background: ${generateBackground()};`
      : `background: ${bgColor};`
    
    return `${bg}
border-radius: ${radius}px;
box-shadow: ${generateShadow()};`
  }

  const copyCode = async () => {
    const success = await copyToClipboard(generateCss())
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center">
          <Box className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">新拟态风格CSS代码生成器</h1>
          <p className="text-gray-500">{text.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview */}
        <div 
          className="rounded-xl p-8 min-h-[400px] flex items-center justify-center transition-colors"
          style={{ backgroundColor: bgColor }}
        >
          <div
            className="flex items-center justify-center text-gray-500 font-medium transition-all"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: `${radius}px`,
              background: generateBackground(),
              boxShadow: generateShadow(),
            }}
          >
            {text.previewText}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Shape */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">{text.shapeTitle}</h2>
            <div className="grid grid-cols-4 gap-2">
              {text.shapeOptions.map((item: any) => (
                <button
                  key={item.value}
                  onClick={() => setShape(item.value as typeof shape)}
                  className={`py-3 rounded-lg font-medium transition-colors ${
                    shape === item.value
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">{text.colorTitle}</h2>
            
            {/* 预设颜色 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">{text.presetColors}</label>
              <div className="flex flex-wrap gap-2">
                {text.colorPresets.map((preset: any) => (
                  <button
                    key={preset.color}
                    onClick={() => setBgColor(preset.color)}
                    className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                      bgColor === preset.color ? 'border-gray-800 ring-2 ring-gray-400' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: preset.color }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>
            
            {/* 自定义颜色 */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{text.backgroundColor}</label>
                <div className="flex gap-3 items-center">
                  <input 
                    type="color" 
                    value={bgColor} 
                    onChange={(e) => setBgColor(e.target.value)} 
                    className="w-12 h-12 rounded-lg cursor-pointer border border-gray-200 flex-shrink-0" 
                  />
                  <input 
                    type="text" 
                    value={bgColor} 
                    onChange={(e) => setBgColor(e.target.value)} 
                    className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{text.lightColor}</label>
                  <div className="flex gap-3 items-center">
                    <div 
                      className="w-12 h-12 rounded-lg border border-gray-200 flex-shrink-0" 
                      style={{ backgroundColor: lightColor }} 
                    />
                    <span className="text-sm font-mono text-gray-500">{lightColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{text.darkColor}</label>
                  <div className="flex gap-3 items-center">
                    <div 
                      className="w-12 h-12 rounded-lg border border-gray-200 flex-shrink-0" 
                      style={{ backgroundColor: darkColor }} 
                    />
                    <span className="text-sm font-mono text-gray-500">{darkColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sliders */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">{text.sliderTitle}</h2>
            <div className="space-y-4">
              <SliderControl label={text.size} value={size} onChange={setSize} min={50} max={300} unit="px" />
              <SliderControl label={text.radius} value={radius} onChange={setRadius} min={0} max={150} unit="px" />
              <SliderControl label={text.distance} value={distance} onChange={setDistance} min={5} max={50} unit="px" />
              <SliderControl label={text.blur} value={blur} onChange={setBlur} min={10} max={100} unit="px" />
              <SliderControl label={text.intensity} value={intensity} onChange={setIntensity} min={0.05} max={0.3} step={0.01} />
            </div>
          </div>

          {/* Code */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">{text.codeTitle}</h2>
              <button onClick={copyCode} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                <Copy className="w-4 h-4" />
                {copied ? text.copied : text.copy}
              </button>
            </div>
            <pre className="p-4 bg-gray-800 text-gray-100 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
              {generateCss()}
            </pre>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-8 bg-gray-100 rounded-xl p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-2">{text.infoTitle}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          {text.infoDescription}
        </p>
      </div>
    </div>
  )
}

function SliderControl({ label, value, onChange, min, max, step = 1, unit = '' }: {
  label: string; value: number; onChange: (value: number) => void; min: number; max: number; step?: number; unit?: string
}) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm text-gray-500">{typeof value === 'number' && value < 1 ? value.toFixed(2) : value}{unit}</span>
      </div>
      <input type="range" value={value} onChange={(e) => onChange(parseFloat(e.target.value))} min={min} max={max} step={step} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-600" />
    </div>
  )
}
