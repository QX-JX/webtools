import { useState } from 'react'
import { Square, Copy, Link, Unlink } from 'lucide-react'
import { copyToClipboard } from '../../utils/clipboard'
import { useI18nSection } from '../../i18n/helpers'

export default function CssBorderRadius() {
  const text = useI18nSection<any>('pages.cssBorderRadius')
  const [linked, setLinked] = useState(true)
  const [topLeft, setTopLeft] = useState(16)
  const [topRight, setTopRight] = useState(16)
  const [bottomRight, setBottomRight] = useState(16)
  const [bottomLeft, setBottomLeft] = useState(16)
  const [bgColor, setBgColor] = useState('#6366f1')
  const [copied, setCopied] = useState(false)

  const handleChange = (corner: string, value: number) => {
    if (linked) {
      setTopLeft(value)
      setTopRight(value)
      setBottomRight(value)
      setBottomLeft(value)
    } else {
      switch (corner) {
        case 'topLeft': setTopLeft(value); break
        case 'topRight': setTopRight(value); break
        case 'bottomRight': setBottomRight(value); break
        case 'bottomLeft': setBottomLeft(value); break
      }
    }
  }

  const generateCss = () => {
    if (topLeft === topRight && topRight === bottomRight && bottomRight === bottomLeft) {
      return `border-radius: ${topLeft}px;`
    }
    return `border-radius: ${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px;`
  }

  const copyCode = async () => {
    const success = await copyToClipboard(generateCss())
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const presets = text.presets

  const applyPreset = (values: number[]) => {
    setLinked(false)
    setTopLeft(values[0])
    setTopRight(values[1])
    setBottomRight(values[2])
    setBottomLeft(values[3])
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center">
          <Square className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
          <p className="text-gray-500">{text.description}</p>
        </div>
      </div>

      {/* Presets */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 py-2">{text.presetsLabel}</span>
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset.values)}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-red-100 hover:text-red-700 text-sm transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview */}
        <div className="bg-gray-100 rounded-xl p-8 min-h-[400px] flex items-center justify-center">
          <div
            className="w-64 h-64 flex items-center justify-center text-white font-semibold shadow-lg"
            style={{
              backgroundColor: bgColor,
              borderRadius: `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`,
            }}
          >
            <div className="text-center">
              <p className="text-lg">{text.preview}</p>
              <p className="text-sm opacity-80 mt-1">
                {topLeft} / {topRight} / {bottomRight} / {bottomLeft}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">{text.settings}</h2>
              <button
                onClick={() => setLinked(!linked)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  linked ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {linked ? <Link className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
                {linked ? text.linked : text.unlinked}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <SliderControl
                label={text.corners.topLeft}
                value={topLeft}
                onChange={(v) => handleChange('topLeft', v)}
                max={100}
              />
              <SliderControl
                label={text.corners.topRight}
                value={topRight}
                onChange={(v) => handleChange('topRight', v)}
                max={100}
              />
              <SliderControl
                label={text.corners.bottomLeft}
                value={bottomLeft}
                onChange={(v) => handleChange('bottomLeft', v)}
                max={100}
              />
              <SliderControl
                label={text.corners.bottomRight}
                value={bottomRight}
                onChange={(v) => handleChange('bottomRight', v)}
                max={100}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">{text.elementColor}</h2>
            <div className="flex gap-3">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">{text.codeTitle}</h2>
              <button
                onClick={copyCode}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                {copied ? text.copied : text.copy}
              </button>
            </div>
            <pre className="p-4 bg-gray-800 text-gray-100 rounded-lg overflow-x-auto text-sm font-mono">
              {generateCss()}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

function SliderControl({ label, value, onChange, max }: {
  label: string; value: number; onChange: (value: number) => void; max: number
}) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm text-gray-500">{value}px</span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        min={0}
        max={max}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
      />
    </div>
  )
}
