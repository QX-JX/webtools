import { useState, useEffect } from 'react'
import { Monitor, Cpu, Globe, Smartphone, Battery, Wifi, HardDrive, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ToolPageLayout from '../../components/ToolPageLayout'
import { LoadingSpinner } from '../../components/LoadingStates'

interface BrowserData {
  userAgent: string
  platform: string
  language: string
  languages: string[]
  cookieEnabled: boolean
  doNotTrack: string | null
  onLine: boolean
  hardwareConcurrency: number
  deviceMemory: number | undefined
  maxTouchPoints: number
  vendor: string
  screen: {
    width: number
    height: number
    availWidth: number
    availHeight: number
    colorDepth: number
    pixelDepth: number
    orientation: string
  }
  window: {
    innerWidth: number
    innerHeight: number
    outerWidth: number
    outerHeight: number
    devicePixelRatio: number
  }
  connection: {
    effectiveType: string
    downlink: number
    rtt: number
    saveData: boolean
  } | null
  battery: {
    charging: boolean
    level: number
    chargingTime: number
    dischargingTime: number
  } | null
  timezone: string
  timezoneOffset: number
}

export default function BrowserInfo() {
  const { t } = useTranslation()
  const [data, setData] = useState<BrowserData | null>(null)

  useEffect(() => {
    const getBrowserInfo = async () => {
      const nav = navigator as any
      const screen = window.screen
      
      // 获取网络信息
      let connection = null
      if (nav.connection) {
        connection = {
          effectiveType: nav.connection.effectiveType || '',
          downlink: nav.connection.downlink || 0,
          rtt: nav.connection.rtt || 0,
          saveData: nav.connection.saveData || false,
        }
      }

      // 获取电池信息
      let battery = null
      try {
        if (nav.getBattery) {
          const bat = await nav.getBattery()
          battery = {
            charging: bat.charging,
            level: Math.round(bat.level * 100),
            chargingTime: bat.chargingTime,
            dischargingTime: bat.dischargingTime,
          }
        }
      } catch {}

      setData({
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        languages: [...navigator.languages],
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        onLine: navigator.onLine,
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        deviceMemory: nav.deviceMemory,
        maxTouchPoints: navigator.maxTouchPoints || 0,
        vendor: navigator.vendor,
        screen: {
          width: screen.width,
          height: screen.height,
          availWidth: screen.availWidth,
          availHeight: screen.availHeight,
          colorDepth: screen.colorDepth,
          pixelDepth: screen.pixelDepth,
          orientation: (screen as any).orientation?.type || '',
        },
        window: {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          outerWidth: window.outerWidth,
          outerHeight: window.outerHeight,
          devicePixelRatio: window.devicePixelRatio,
        },
        connection,
        battery,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
      })
    }

    getBrowserInfo()
  }, [])

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <LoadingSpinner text={t('common.loading')} />
      </div>
    )
  }

  return (
    <ToolPageLayout
      toolId="browser-info"
      title={t('browserInfo.title')}
      description={t('browserInfo.description')}
      icon={Monitor}
      iconColor="from-indigo-400 to-indigo-600"
    >
      <div className="space-y-4">
        {/* User Agent */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            {t('browserInfo.userAgent')}
          </h2>
          <p className="p-4 bg-gray-50 rounded-lg font-mono text-sm text-gray-700 break-all">
            {data.userAgent}
          </p>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            {t('browserInfo.basicInfo')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard label={t('browserInfo.platform')} value={data.platform} />
            <InfoCard label={t('browserInfo.vendor')} value={data.vendor} />
            <InfoCard label={t('browserInfo.language')} value={data.language} />
            <InfoCard label={t('browserInfo.languages')} value={data.languages.join(', ')} />
            <InfoCard 
              label={t('browserInfo.cookie')} 
              value={data.cookieEnabled ? t('browserInfo.enabled') : t('browserInfo.disabled')} 
              status={data.cookieEnabled} 
            />
            <InfoCard 
              label={t('browserInfo.onlineStatus')} 
              value={data.onLine ? t('browserInfo.online') : t('browserInfo.offline')} 
              status={data.onLine} 
            />
            <InfoCard 
              label={t('browserInfo.doNotTrack')} 
              value={data.doNotTrack === '1' ? t('browserInfo.enabled') : t('browserInfo.disabled')} 
            />
            <InfoCard label={t('browserInfo.touchPoints')} value={String(data.maxTouchPoints)} />
          </div>
        </div>

        {/* Hardware */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-600" />
            {t('browserInfo.hardwareInfo')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard label={t('browserInfo.cpuCores')} value={t('browserInfo.cpuCoresValue', { count: data.hardwareConcurrency })} />
            {data.deviceMemory && (
              <InfoCard label={t('browserInfo.deviceMemory')} value={`${data.deviceMemory} GB`} />
            )}
          </div>
        </div>

        {/* Screen */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-600" />
            {t('browserInfo.screenInfo')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard label={t('browserInfo.screen')} value={`${data.screen.width} × ${data.screen.height}`} />
            <InfoCard label={t('browserInfo.availArea')} value={`${data.screen.availWidth} × ${data.screen.availHeight}`} />
            <InfoCard label={t('browserInfo.windowSize')} value={`${data.window.innerWidth} × ${data.window.innerHeight}`} />
            <InfoCard label={t('browserInfo.pixelRatio')} value={`${data.window.devicePixelRatio}x`} />
            <InfoCard label={t('browserInfo.colorDepth')} value={`${data.screen.colorDepth} bit`} />
            <InfoCard label={t('browserInfo.screenOrientation')} value={data.screen.orientation || t('browserInfo.unknown')} />
          </div>
        </div>

        {/* Network */}
        {data.connection && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Wifi className="w-5 h-5 text-indigo-600" />
              {t('browserInfo.networkInfo')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard label={t('browserInfo.networkType')} value={data.connection.effectiveType.toUpperCase()} />
              <InfoCard label={t('browserInfo.downlink')} value={`${data.connection.downlink} Mbps`} />
              <InfoCard label={t('browserInfo.rtt')} value={`${data.connection.rtt} ms`} />
              <InfoCard 
                label={t('browserInfo.saveData')} 
                value={data.connection.saveData ? t('browserInfo.enabled') : t('browserInfo.disabled')} 
              />
            </div>
          </div>
        )}

        {/* Battery */}
        {data.battery && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Battery className="w-5 h-5 text-indigo-600" />
              {t('browserInfo.batteryInfo')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard label={t('browserInfo.batteryLevel')} value={`${data.battery.level}%`} />
              <InfoCard 
                label={t('browserInfo.chargingStatus')} 
                value={data.battery.charging ? t('browserInfo.charging') : t('browserInfo.notCharging')} 
                status={data.battery.charging} 
              />
            </div>
            <div className="mt-4">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    data.battery.level > 20 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${data.battery.level}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Timezone */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            {t('browserInfo.timezoneInfo')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard label={t('browserInfo.timezone')} value={data.timezone} />
            <InfoCard 
              label={t('browserInfo.utcOffset')} 
              value={`UTC${data.timezoneOffset > 0 ? '-' : '+'}${Math.abs(data.timezoneOffset / 60)}`} 
            />
          </div>
        </div>
      </div>
    </ToolPageLayout>
  )
}

function InfoCard({ label, value, status }: { label: string; value: string; status?: boolean }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="font-medium text-gray-800 flex items-center gap-2">
        {value}
        {status !== undefined && (
          <span className={`w-2 h-2 rounded-full ${status ? 'bg-green-500' : 'bg-red-500'}`} />
        )}
      </p>
    </div>
  )
}
