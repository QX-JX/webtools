import { useState } from 'react'
import { Box, Copy, Plus, Trash2 } from 'lucide-react'
import { copyToClipboard } from '../../utils/clipboard'
import { useI18nSection } from '../../i18n/helpers'

interface Shadow {
  id: number
  x: number
  y: number
  blur: number
  spread: number
  color: string
  opacity: number
  inset: boolean
}

export default function CssBoxShadow() {
  const text = useI18nSection<any>('pages.cssBoxShadow')
  const [shadows, setShadows] = useState<Shadow[]>([
    { id: 1, x: 0, y: 4, blur: 20, spread: 0, color: '#000000', opacity: 0.15, inset: false }
  ])
  const [bgColor, setBgColor] = useState('#ffffff')
  const [boxColor, setBoxColor] = useState('#6366f1')
  const [borderRadius, setBorderRadius] = useState(16)
  const [copied, setCopied] = useState(false)

  const addShadow = () => {
    setShadows([...shadows, { id: Date.now(), x: 0, y: 8, blur: 30, spread: 0, color: '#000000', opacity: 0.1, inset: false }])
  }

  const removeShadow = (id: number) => {
    if (shadows.length > 1) {
      setShadows(shadows.filter(s => s.id !== id))
    }
  }

  const updateShadow = (id: number, field: keyof Shadow, value: number | string | boolean) => {
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
      return `${s.inset ? 'inset ' : ''}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${color}`
    }).join(',\n    ')
  }

  const generateCss = () => {
    return `box-shadow: ${generateShadow()};`
  }

  const copyCode = async () => {
    const success = await copyToClipboard(generateCss())
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
          <Box className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
          <p className="text-gray-500">{text.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview */}
        <div 
          className="rounded-xl p-8 min-h-[300px] flex items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <div
            className="w-48 h-48 flex items-center justify-center text-white font-semibold"
            style={{
              backgroundColor: boxColor,
              borderRadius: `${borderRadius}px`,
              boxShadow: generateShadow(),
            }}
          >
            {text.preview}
          </div>
        </div>

        {/* Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Colors */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">{text.basicSettings}</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{text.backgroundColor}</label>
                <div className="flex gap-2">
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                  <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{text.boxColor}</label>
                <div className="flex gap-2">
                  <input type="color" value={boxColor} onChange={(e) => setBoxColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                  <input type="text" value={boxColor} onChange={(e) => setBoxColor(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{text.borderRadius} ({borderRadius}px)</label>
                <input type="range" value={borderRadius} onChange={(e) => setBorderRadius(parseInt(e.target.value))} min={0} max={100} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-3" />
              </div>
            </div>
          </div>

          {/* Shadows */}
          {shadows.map((shadow, index) => (
            <div key={shadow.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">{text.shadowPrefix.replace('{{index}}', String(index + 1))}</h2>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={shadow.inset} onChange={(e) => updateShadow(shadow.id, 'inset', e.target.checked)} className="rounded" />
                    {text.inset}
                  </label>
                  {shadows.length > 1 && (
                    <button onClick={() => removeShadow(shadow.id)} className="text-red-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <SliderControl label={text.offsetX} value={shadow.x} onChange={(v) => updateShadow(shadow.id, 'x', v)} min={-50} max={50} unit="px" />
                <SliderControl label={text.offsetY} value={shadow.y} onChange={(v) => updateShadow(shadow.id, 'y', v)} min={-50} max={50} unit="px" />
                <SliderControl label={text.blur} value={shadow.blur} onChange={(v) => updateShadow(shadow.id, 'blur', v)} min={0} max={100} unit="px" />
                <SliderControl label={text.spread} value={shadow.spread} onChange={(v) => updateShadow(shadow.id, 'spread', v)} min={-50} max={50} unit="px" />
                <SliderControl label={text.opacity} value={shadow.opacity} onChange={(v) => updateShadow(shadow.id, 'opacity', v)} min={0} max={1} step={0.05} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{text.color}</label>
                  <div className="flex gap-2">
                    <input type="color" value={shadow.color} onChange={(e) => updateShadow(shadow.id, 'color', e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                    <input type="text" value={shadow.color} onChange={(e) => updateShadow(shadow.id, 'color', e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addShadow}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> {text.addShadow}
          </button>

          {/* Code */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">{text.codeTitle}</h2>
              <button onClick={copyCode} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2">
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
      <input type="range" value={value} onChange={(e) => onChange(parseFloat(e.target.value))} min={min} max={max} step={step} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
    </div>
  )
}
