import { useState } from 'react'
import { Type, Copy, Plus, Trash2 } from 'lucide-react'
import { copyToClipboard } from '../../utils/clipboard'
import { useI18nSection } from '../../i18n/helpers'

interface Shadow {
  id: number
  x: number
  y: number
  blur: number
  color: string
  opacity: number
}

export default function CssTextShadow() {
  const textMap = useI18nSection<any>('pages.cssTextShadow')
  const [shadows, setShadows] = useState<Shadow[]>([
    { id: 1, x: 2, y: 2, blur: 4, color: '#000000', opacity: 0.3 }
  ])
  const [text, setText] = useState(textMap.defaultText)
  const [fontSize, setFontSize] = useState(48)
  const [textColor, setTextColor] = useState('#333333')
  const [bgColor] = useState('#ffffff')
  const [copied, setCopied] = useState(false)

  const addShadow = () => {
    setShadows([...shadows, { id: Date.now(), x: 3, y: 3, blur: 6, color: '#000000', opacity: 0.2 }])
  }

  const removeShadow = (id: number) => {
    if (shadows.length > 1) {
      setShadows(shadows.filter(s => s.id !== id))
    }
  }

  const updateShadow = (id: number, field: keyof Shadow, value: number | string) => {
    setShadows(shadows.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  const generateShadow = () => {
    return shadows.map(s => {
      const color = hexToRgba(s.color, s.opacity)
      return `${s.x}px ${s.y}px ${s.blur}px ${color}`
    }).join(', ')
  }

  const generateCss = () => {
    return `text-shadow: ${generateShadow()};`
  }

  const copyCode = async () => {
    const success = await copyToClipboard(generateCss())
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const presets = textMap.presets

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
          <Type className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{textMap.title}</h1>
          <p className="text-gray-500">{textMap.description}</p>
        </div>
      </div>

      {/* Presets */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 py-2">{textMap.presetsLabel}</span>
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setShadows(preset.shadows)}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-purple-100 hover:text-purple-700 text-sm transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview */}
        <div 
          className="rounded-xl p-8 min-h-[250px] flex items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <p
            style={{
              fontSize: `${fontSize}px`,
              color: textColor,
              textShadow: generateShadow(),
              fontWeight: 'bold',
            }}
          >
            {text}
          </p>
        </div>

        {/* Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Text Settings */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">{textMap.textSettings}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{textMap.previewText}</label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{textMap.fontSize} ({fontSize}px)</label>
                <input type="range" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} min={12} max={100} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500 mt-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{textMap.textColor}</label>
                <div className="flex gap-3 items-center">
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-12 h-12 rounded-lg cursor-pointer border border-gray-200 flex-shrink-0" />
                  <input type="text" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono" />
                </div>
              </div>
            </div>
          </div>

          {/* Shadows */}
          {shadows.map((shadow, index) => (
            <div key={shadow.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">{textMap.shadowPrefix.replace('{{index}}', String(index + 1))}</h2>
                {shadows.length > 1 && (
                  <button onClick={() => removeShadow(shadow.id)} className="text-red-500 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <SliderControl label={textMap.offsetX} value={shadow.x} onChange={(v) => updateShadow(shadow.id, 'x', v)} min={-30} max={30} unit="px" />
                <SliderControl label={textMap.offsetY} value={shadow.y} onChange={(v) => updateShadow(shadow.id, 'y', v)} min={-30} max={30} unit="px" />
                <SliderControl label={textMap.blur} value={shadow.blur} onChange={(v) => updateShadow(shadow.id, 'blur', v)} min={0} max={50} unit="px" />
                <SliderControl label={textMap.opacity} value={shadow.opacity} onChange={(v) => updateShadow(shadow.id, 'opacity', v)} min={0} max={1} step={0.05} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{textMap.color}</label>
                  <div className="flex gap-3 items-center">
                    <input type="color" value={shadow.color} onChange={(e) => updateShadow(shadow.id, 'color', e.target.value)} className="w-12 h-12 rounded-lg cursor-pointer border border-gray-200 flex-shrink-0" />
                    <input type="text" value={shadow.color} onChange={(e) => updateShadow(shadow.id, 'color', e.target.value)} className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono" />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addShadow}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-purple-500 hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> {textMap.addShadow}
          </button>

          {/* Code */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">{textMap.codeTitle}</h2>
              <button onClick={copyCode} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2">
                <Copy className="w-4 h-4" />
                {copied ? textMap.copied : textMap.copy}
              </button>
            </div>
            <pre className="p-4 bg-gray-800 text-gray-100 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
              {generateCss()}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

function SliderControl({ label, value, onChange, min, max, step = 1, unit = '' }: {
  label: string; value: number; onChange: (value: number) => void; min: number; max: number; step?: number; unit?: string
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm text-gray-500">{value}{unit}</span>
      </div>
      <input type="range" value={value} onChange={(e) => onChange(parseFloat(e.target.value))} min={min} max={max} step={step} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500" />
    </div>
  )
}
