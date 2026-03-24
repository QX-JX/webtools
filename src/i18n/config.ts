import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import {
  applyLanguageAttributes,
  getInitialLanguage,
  languageStorageKey,
  supportedLanguages,
} from './languages'
import { applyDocumentSeo } from './seo'

const localeModules = import.meta.glob('../locals/*.json', { eager: true }) as Record<string, { default: object }>

function extractLanguageCode(path: string): string | null {
  const match = path.match(/\/([^/]+)\.json$/)
  return match ? match[1] : null
}

const resources = Object.fromEntries(
  Object.entries(localeModules)
    .map(([path, module]) => {
      const code = extractLanguageCode(path)
      if (!code || !supportedLanguages.includes(code as (typeof supportedLanguages)[number])) {
        return null
      }

      return [code, { translation: module.default }]
    })
    .filter((entry): entry is [string, { translation: object }] => entry !== null)
)

/** 先回退到英文（键最全），再回退到简体中文 */
const fallbackChain: string[] = supportedLanguages.includes('en')
  ? ['en', ...(supportedLanguages.includes('zh_CN') ? ['zh_CN'] : [])]
  : supportedLanguages.includes('zh_CN')
    ? ['zh_CN']
    : [supportedLanguages[0] ?? 'en']

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: fallbackChain,
    supportedLngs: [...supportedLanguages],
    interpolation: {
      escapeValue: false,
    },
  })

i18n.on('languageChanged', (language) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(languageStorageKey, language)
  }

  applyLanguageAttributes(language)
  applyDocumentSeo(i18n)
})

applyLanguageAttributes(i18n.language)
applyDocumentSeo(i18n)

export default i18n
