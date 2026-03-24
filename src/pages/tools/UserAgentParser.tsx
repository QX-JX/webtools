import { useState } from 'react'
import { UserCircle, Search, Monitor, Smartphone, Tablet, Globe, Cpu, RefreshCw } from 'lucide-react'
import { useI18nSection } from '../../i18n/helpers'

interface ParsedUA {
  browser: {
    name: string
    version: string
    major: string
  }
  os: {
    name: string
    version: string
  }
  device: {
    type: string
    vendor: string
    model: string
  }
  engine: {
    name: string
    version: string
  }
  cpu: {
    architecture: string
  }
}

// 简单的 UA 解析器
function parseUserAgent(ua: string): ParsedUA {
  const result: ParsedUA = {
    browser: { name: '', version: '', major: '' },
    os: { name: '', version: '' },
    device: { type: 'desktop', vendor: '', model: '' },
    engine: { name: '', version: '' },
    cpu: { architecture: '' }
  }

  // 浏览器检测
  if (ua.includes('Edg/')) {
    const match = ua.match(/Edg\/([\d.]+)/)
    result.browser = { name: 'Microsoft Edge', version: match?.[1] || '', major: match?.[1]?.split('.')[0] || '' }
  } else if (ua.includes('Chrome/')) {
    const match = ua.match(/Chrome\/([\d.]+)/)
    result.browser = { name: 'Google Chrome', version: match?.[1] || '', major: match?.[1]?.split('.')[0] || '' }
  } else if (ua.includes('Firefox/')) {
    const match = ua.match(/Firefox\/([\d.]+)/)
    result.browser = { name: 'Mozilla Firefox', version: match?.[1] || '', major: match?.[1]?.split('.')[0] || '' }
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    const match = ua.match(/Version\/([\d.]+)/)
    result.browser = { name: 'Apple Safari', version: match?.[1] || '', major: match?.[1]?.split('.')[0] || '' }
  } else if (ua.includes('Opera') || ua.includes('OPR/')) {
    const match = ua.match(/(?:Opera|OPR)\/([\d.]+)/)
    result.browser = { name: 'Opera', version: match?.[1] || '', major: match?.[1]?.split('.')[0] || '' }
  }

  // 操作系统检测
  if (ua.includes('Windows NT 10')) {
    result.os = { name: 'Windows', version: '10/11' }
  } else if (ua.includes('Windows NT 6.3')) {
    result.os = { name: 'Windows', version: '8.1' }
  } else if (ua.includes('Windows NT 6.1')) {
    result.os = { name: 'Windows', version: '7' }
  } else if (ua.includes('Mac OS X')) {
    const match = ua.match(/Mac OS X ([\d_]+)/)
    result.os = { name: 'macOS', version: match?.[1]?.replace(/_/g, '.') || '' }
  } else if (ua.includes('Android')) {
    const match = ua.match(/Android ([\d.]+)/)
    result.os = { name: 'Android', version: match?.[1] || '' }
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    const match = ua.match(/OS ([\d_]+)/)
    result.os = { name: 'iOS', version: match?.[1]?.replace(/_/g, '.') || '' }
  } else if (ua.includes('Linux')) {
    result.os = { name: 'Linux', version: '' }
  }

  // 设备类型检测
  if (ua.includes('Mobile') || ua.includes('Android') && !ua.includes('Tablet')) {
    result.device.type = 'mobile'
  } else if (ua.includes('Tablet') || ua.includes('iPad')) {
    result.device.type = 'tablet'
  }

  // 设备厂商检测
  if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('Mac')) {
    result.device.vendor = 'Apple'
  } else if (ua.includes('Samsung')) {
    result.device.vendor = 'Samsung'
  } else if (ua.includes('Huawei') || ua.includes('HUAWEI')) {
    result.device.vendor = 'Huawei'
  } else if (ua.includes('Xiaomi') || ua.includes('MI ')) {
    result.device.vendor = 'Xiaomi'
  }

  // 渲染引擎检测
  if (ua.includes('Gecko/')) {
    result.engine = { name: 'Gecko', version: '' }
  } else if (ua.includes('AppleWebKit/')) {
    const match = ua.match(/AppleWebKit\/([\d.]+)/)
    result.engine = { name: 'WebKit', version: match?.[1] || '' }
  } else if (ua.includes('Trident/')) {
    result.engine = { name: 'Trident', version: '' }
  }

  // CPU 架构检测
  if (ua.includes('x64') || ua.includes('x86_64') || ua.includes('Win64')) {
    result.cpu.architecture = 'x64'
  } else if (ua.includes('arm64') || ua.includes('aarch64')) {
    result.cpu.architecture = 'ARM64'
  } else if (ua.includes('arm')) {
    result.cpu.architecture = 'ARM'
  }

  return result
}

export default function UserAgentParser() {
  const text = useI18nSection<any>('pages.userAgentParser')
  const [ua, setUa] = useState(navigator.userAgent)
  const [parsed, setParsed] = useState<ParsedUA | null>(() => parseUserAgent(navigator.userAgent))

  const handleParse = () => {
    if (!ua.trim()) return
    setParsed(parseUserAgent(ua))
  }

  const useCurrentUA = () => {
    setUa(navigator.userAgent)
    setParsed(parseUserAgent(navigator.userAgent))
  }

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return Smartphone
      case 'tablet': return Tablet
      default: return Monitor
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center">
          <UserCircle className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
          <p className="text-gray-500">{text.description}</p>
        </div>
      </div>

      {/* Input */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-medium text-gray-700">{text.label}</label>
          <button
            onClick={useCurrentUA}
            className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            {text.useCurrent}
          </button>
        </div>
        <textarea
          value={ua}
          onChange={(e) => setUa(e.target.value)}
          placeholder={text.inputPlaceholder}
          className="w-full h-24 p-4 border border-gray-200 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button
          onClick={handleParse}
          className="mt-4 w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 rounded-lg font-medium hover:from-teal-600 hover:to-teal-700 transition-colors flex items-center justify-center gap-2"
        >
          <Search className="w-5 h-5" />
          {text.parse}
        </button>
      </div>

      {/* Result */}
      {parsed && (
        <div className="space-y-4">
          {/* Overview */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-6">
              {(() => {
                const DeviceIcon = getDeviceIcon(parsed.device.type)
                return <DeviceIcon className="w-16 h-16 text-teal-500" />
              })()}
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {parsed.browser.name || text.unknownBrowser} {parsed.browser.major}
                </h2>
                <p className="text-gray-500">
                  {parsed.os.name} {parsed.os.version} · {parsed.device.type === 'mobile' ? text.deviceTypes.mobile : parsed.device.type === 'tablet' ? text.deviceTypes.tablet : text.deviceTypes.desktop}
                </p>
              </div>
            </div>
          </div>

          {/* Browser */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-teal-600" />
              {text.browserInfo}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoCard label={text.browser} value={parsed.browser.name || text.unknown} />
              <InfoCard label={text.version} value={parsed.browser.version || text.unknown} />
              <InfoCard label={text.majorVersion} value={parsed.browser.major || text.unknown} />
            </div>
          </div>

          {/* OS */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-teal-600" />
              {text.operatingSystem}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard label={text.system} value={parsed.os.name || text.unknown} />
              <InfoCard label={text.version} value={parsed.os.version || text.unknown} />
            </div>
          </div>

          {/* Device */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-teal-600" />
              {text.deviceInfo}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoCard label={text.type} value={
                parsed.device.type === 'mobile' ? text.deviceTypes.mobile :
                parsed.device.type === 'tablet' ? text.deviceTypes.tablet : text.deviceTypes.desktop
              } />
              <InfoCard label={text.vendor} value={parsed.device.vendor || text.unknown} />
              <InfoCard label={text.model} value={parsed.device.model || text.unknown} />
            </div>
          </div>

          {/* Engine & CPU */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-teal-600" />
              {text.engineAndCpu}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoCard label={text.engine} value={parsed.engine.name || text.unknown} />
              <InfoCard label={text.engineVersion} value={parsed.engine.version || text.unknown} />
              <InfoCard label={text.cpuArchitecture} value={parsed.cpu.architecture || text.unknown} />
            </div>
          </div>
        </div>
      )}

      {/* Common UA Examples */}
      <div className="mt-8 bg-teal-50 rounded-xl p-6 border border-teal-100">
        <h3 className="font-semibold text-teal-800 mb-3">{text.examplesTitle}</h3>
        <div className="space-y-2 text-sm">
          {[
            { name: 'Chrome (Windows)', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
            { name: 'Safari (macOS)', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15' },
            { name: 'iPhone Safari', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => { setUa(item.ua); setParsed(parseUserAgent(item.ua)) }}
              className="block w-full text-left p-3 bg-white rounded-lg hover:bg-teal-100 transition-colors"
            >
              <span className="font-medium text-teal-700">{item.name}</span>
              <p className="text-gray-500 text-xs mt-1 truncate">{item.ua}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  )
}
