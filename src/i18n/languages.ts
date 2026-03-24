export const languageStorageKey = 'kunqiong-language'

const allLanguageOptions = [
  { code: 'zh_CN', label: '简体中文' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'fa', label: 'فارسی' },
  { code: 'fr', label: 'Français' },
  { code: 'he', label: 'עברית' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'it', label: 'Italiano' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'ms', label: 'Bahasa Melayu' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'pl', label: 'Polski' },
  { code: 'pt', label: 'Português' },
  { code: 'pt_BR', label: 'Português (Brasil)' },
  { code: 'ru', label: 'Русский' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'th', label: 'ไทย' },
  { code: 'tl', label: 'Tagalog' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'uk', label: 'Українська' },
  { code: 'ur', label: 'اردو' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'zh_TW', label: '繁體中文' },
] as const

export type AppLanguage = (typeof allLanguageOptions)[number]['code']

const allLanguageCodes = allLanguageOptions.map((option) => option.code) as AppLanguage[]
const knownLanguageCodes = new Set<AppLanguage>(allLanguageCodes)
const rtlLanguages = new Set<AppLanguage>(['ar', 'fa', 'he', 'ur'])

const languageAliases: Record<string, AppLanguage> = {
  zh_CN: 'zh_CN',
  'zh-CN': 'zh_CN',
  zh_TW: 'zh_TW',
  'zh-TW': 'zh_TW',
  pt_BR: 'pt_BR',
  'pt-BR': 'pt_BR',
}

const localeModules = import.meta.glob('../locals/*.json')

function extractLanguageCode(path: string): string | null {
  const match = path.match(/\/([^/]+)\.json$/)
  return match ? match[1] : null
}

function isKnownLanguageCode(value: string): value is AppLanguage {
  return knownLanguageCodes.has(value as AppLanguage)
}

function normalizeLanguageCode(value: string): string {
  return languageAliases[value] ?? value
}

function toHtmlLang(language: string): string {
  if (language === 'zh_CN') {
    return 'zh-CN'
  }

  if (language === 'zh_TW') {
    return 'zh-TW'
  }

  if (language === 'pt_BR') {
    return 'pt-BR'
  }

  return language
}

function coerceSupportedLanguage(value: string | null | undefined): AppLanguage | null {
  if (!value) {
    return null
  }

  const normalized = normalizeLanguageCode(value)
  return supportedLanguages.includes(normalized as AppLanguage) ? (normalized as AppLanguage) : null
}

const availableLanguageCodes = new Set<AppLanguage>(
  Object.keys(localeModules)
    .map(extractLanguageCode)
    .filter((value): value is AppLanguage => Boolean(value) && isKnownLanguageCode(value))
)

export const supportedLanguages = allLanguageCodes.filter((code) => availableLanguageCodes.has(code))

export const languageOptions: Array<{ code: AppLanguage; label: string }> = allLanguageOptions.filter((option) =>
  availableLanguageCodes.has(option.code)
)

export function isSupportedLanguage(value: string): value is AppLanguage {
  return coerceSupportedLanguage(value) !== null
}

export function getInitialLanguage(): AppLanguage {
  const fallbackLanguage = supportedLanguages[0] ?? 'zh_CN'

  if (typeof window !== 'undefined') {
    const savedLanguage = coerceSupportedLanguage(window.localStorage.getItem(languageStorageKey))
    if (savedLanguage) {
      return savedLanguage
    }

    const browserLanguage = window.navigator.language
    const exactLanguage = coerceSupportedLanguage(browserLanguage)
    if (exactLanguage) {
      return exactLanguage
    }

    const normalizedBrowserLanguage = browserLanguage.toLowerCase()
    const matchedLanguage = supportedLanguages.find((language) => {
      const htmlLang = toHtmlLang(language).toLowerCase()
      return normalizedBrowserLanguage.startsWith(language.toLowerCase()) || normalizedBrowserLanguage.startsWith(htmlLang)
    })
    if (matchedLanguage) {
      return matchedLanguage
    }

    if (browserLanguage.startsWith('zh') && supportedLanguages.includes('zh_CN')) {
      return 'zh_CN'
    }
  }

  return fallbackLanguage
}

export function applyLanguageAttributes(language: string) {
  if (typeof document === 'undefined') return

  const appLanguage = coerceSupportedLanguage(language)

  document.documentElement.lang = toHtmlLang(appLanguage ?? language)
  document.documentElement.dir = appLanguage && rtlLanguages.has(appLanguage) ? 'rtl' : 'ltr'
}
