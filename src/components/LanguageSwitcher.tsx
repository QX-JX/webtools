import { ChevronDown, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { languageOptions } from '../i18n/languages'

interface LanguageSwitcherProps {
  mobile?: boolean
  /** 页头紧凑样式：与登录按钮同排，仅图标 + 下拉，选项数量与项目 locales 一致 */
  variant?: 'default' | 'header'
}

export default function LanguageSwitcher({ mobile = false, variant = 'default' }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation()

  const currentLanguage = languageOptions.some((option) => option.code === i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : 'zh_CN'

  const label = t('browserInfo.language')

  if (variant === 'header') {
    return (
      <label
        className="header-lang-switcher relative inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 text-slate-700 shadow-sm"
        title={label}
      >
        <Languages className="w-4 h-4 shrink-0 text-slate-500" aria-hidden />
        <span className="sr-only">{label}</span>
        <select
          value={currentLanguage}
          onChange={(event) => void i18n.changeLanguage(event.target.value)}
          className="appearance-none bg-transparent text-sm font-medium outline-none cursor-pointer min-w-[7.5rem] max-w-[10rem] pr-5 max-[768px]:min-w-[6.5rem] max-[768px]:max-w-[8.5rem]"
          aria-label={label}
        >
          {languageOptions.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
      </label>
    )
  }

  return (
    <label
      className={`relative flex items-center gap-2 rounded-lg border border-indigo-200 bg-white text-gray-700 shadow-sm ${
        mobile ? 'w-full px-3 py-3' : 'w-[148px] px-3 py-2'
      }`}
      title={label}
    >
      <Languages className="w-4 h-4 text-indigo-500 shrink-0" />
      <span className="text-sm font-medium shrink-0">{label}</span>
      <select
        value={currentLanguage}
        onChange={(event) => void i18n.changeLanguage(event.target.value)}
        className={`appearance-none bg-transparent text-sm outline-none min-w-0 flex-1 cursor-pointer pr-5 ${
          mobile ? 'text-right' : ''
        }`}
        aria-label={label}
      >
        {languageOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 pointer-events-none absolute right-3" />
    </label>
  )
}
