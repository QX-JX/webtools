import { useState } from 'react'
import { Square, Copy } from 'lucide-react'
import { copyToClipboard } from '../../utils/clipboard'
import { useI18nSection } from '../../i18n/helpers'

export default function CssGlassmorphism() {
  const text = useI18nSection<any>('pages.cssGlassmorphism')
  const [blur, setBlur] = useState(10)
  const [transparency, setTransparency] = useState(0.25)
  const [saturation, setSaturation] = useState(180)
  const [borderRadius, setBorderRadius] = useState(16)
  const [borderOpacity, setBorderOpacity] = useState(0.18)
  const [copied, setCopied] = useState(false)

  const generateCss = () => {
    return `background: rgba(255, 255, 255, ${transparency});
border-radius: ${borderRadius}px;
box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
backdrop-filter: blur(${blur}px) saturate(${saturation}%);
-webkit-backdrop-filter: blur(${blur}px) saturate(${saturation}%);
border: 1px solid rgba(255, 255, 255, ${borderOpacity});`
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
        <div className="w-14 h-14 bg-gradient-to-br from-sky-400 to-sky-600 rounded-2xl flex items-center justify-center">
          <Square className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
          <p className="text-gray-500">{text.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview */}
        <div 
          className="rounded-xl p-6 min-h-[400px] flex items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          }}
        >
          <div className="relative">
            {/* Background shapes */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-pink-400 rounded-full opacity-70" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-400 rounded-full opacity-70" />
            <div className="absolute top-20 right-10 w-24 h-24 bg-yellow-400 rounded-full opacity-70" />
            
            {/* Glass card */}
            <div
              className="relative z-10 w-72 p-8"
              style={{
                background: `rgba(255, 255, 255, ${transparency})`,
                borderRadius: `${borderRadius}px`,
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                backdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
                WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
                border: `1px solid rgba(255, 255, 255, ${borderOpacity})`,
              }}
            >
              <h3 className="text-xl font-bold text-white mb-2">{text.cardTitle}</h3>
              <p className="text-white/80 text-sm">
                {text.cardDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">{text.adjustTitle}</h2>
            <div className="space-y-6">
              <SliderControl
                label={text.blur}
                value={blur}
                onChange={setBlur}
                min={0}
                max={30}
                unit="px"
              />
              <SliderControl
                label={text.transparency}
                value={transparency}
                onChange={setTransparency}
                min={0}
                max={1}
                step={0.05}
              />
              <SliderControl
                label={text.saturation}
                value={saturation}
                onChange={setSaturation}
                min={100}
                max={300}
                unit="%"
              />
              <SliderControl
                label={text.borderRadius}
                value={borderRadius}
                onChange={setBorderRadius}
                min={0}
                max={50}
                unit="px"
              />
              <SliderControl
                label={text.borderOpacity}
                value={borderOpacity}
                onChange={setBorderOpacity}
                min={0}
                max={1}
                step={0.05}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">{text.codeTitle}</h2>
              <button
                onClick={copyCode}
                className="px-4 py-2 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 transition-colors flex items-center gap-2"
              >
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
      <div className="mt-8 bg-sky-50 rounded-xl p-6 border border-sky-100">
        <h3 className="font-semibold text-sky-800 mb-2">{text.infoTitle}</h3>
        <p className="text-sky-700 text-sm">
          {text.infoDescription}
        </p>
      </div>
    </div>
  )
}

function SliderControl({ label, value, onChange, min, max, step = 1, unit = '' }: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  unit?: string
}) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm text-gray-500">{value}{unit}</span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
      />
    </div>
  )
}
