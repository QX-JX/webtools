import type { i18n as I18nInstance } from 'i18next'

const META_NAME_SELECTORS: Record<string, string> = {
  description: 'meta[name="description"]',
  keywords: 'meta[name="keywords"]',
  'twitter:card': 'meta[name="twitter:card"]',
  'twitter:title': 'meta[name="twitter:title"]',
  'twitter:description': 'meta[name="twitter:description"]',
  'twitter:image': 'meta[name="twitter:image"]',
  'apple-mobile-web-app-title': 'meta[name="apple-mobile-web-app-title"]',
}

const META_PROPERTY_SELECTORS: Record<string, string> = {
  'og:type': 'meta[property="og:type"]',
  'og:title': 'meta[property="og:title"]',
  'og:description': 'meta[property="og:description"]',
  'og:url': 'meta[property="og:url"]',
  'og:image': 'meta[property="og:image"]',
  'og:locale': 'meta[property="og:locale"]',
}

const JSON_LD_SELECTOR = 'script[type="application/ld+json"][data-dynamic="true"]'

function ensureMetaByName(name: string): HTMLMetaElement {
  const selector = META_NAME_SELECTORS[name] ?? `meta[name="${name}"]`
  let el = document.querySelector(selector) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  return el
}

function ensureMetaByProperty(property: string): HTMLMetaElement {
  const selector = META_PROPERTY_SELECTORS[property] ?? `meta[property="${property}"]`
  let el = document.querySelector(selector) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  return el
}

function ensureLinkCanonical(): HTMLLinkElement {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  return el
}

function ensureJsonLdScript(): HTMLScriptElement {
  let el = document.querySelector(JSON_LD_SELECTOR) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.setAttribute('data-dynamic', 'true')
    document.head.appendChild(el)
  }
  return el
}

function defaultOgImageAbsolute(): string {
  const fromEnv = import.meta.env.VITE_OG_IMAGE_URL as string | undefined
  if (fromEnv && /^https?:\/\//i.test(fromEnv)) {
    return fromEnv
  }
  if (typeof window !== 'undefined') {
    return new URL('/app.ico', window.location.origin).href
  }
  return '/app.ico'
}

/** BCP 47，用于 og:locale */
function ogLocaleFromHtmlLang(htmlLang: string): string {
  const map: Record<string, string> = {
    'zh-CN': 'zh_CN',
    'zh-TW': 'zh_TW',
    'pt-BR': 'pt_BR',
  }
  return map[htmlLang] ?? htmlLang.replace(/-/g, '_')
}

/**
 * 根据当前语言与页面地址更新 document title、基础 meta、Open Graph、Twitter Card、canonical 与 JSON-LD。
 * 在 i18n 语言切换与路由变化时调用。
 */
export function applyDocumentSeo(i18n: I18nInstance): void {
  if (typeof document === 'undefined') return

  const title = i18n.t('seo.title')
  const description = i18n.t('seo.description')
  const keywords = i18n.t('seo.keywords')
  const appName = i18n.t('common.appName')
  const ogType = i18n.t('seo.ogType')

  const pageUrl =
    typeof window !== 'undefined' ? window.location.href.split('#')[0] : ''
  const ogImage = defaultOgImageAbsolute()
  const htmlLang = document.documentElement.lang || 'en'
  const ogLocale = ogLocaleFromHtmlLang(htmlLang)

  document.title = title

  ensureMetaByName('description').setAttribute('content', description)
  ensureMetaByName('keywords').setAttribute('content', keywords)

  ensureMetaByProperty('og:type').setAttribute('content', ogType)
  ensureMetaByProperty('og:title').setAttribute('content', title)
  ensureMetaByProperty('og:description').setAttribute('content', description)
  ensureMetaByProperty('og:url').setAttribute('content', pageUrl)
  ensureMetaByProperty('og:image').setAttribute('content', ogImage)
  ensureMetaByProperty('og:locale').setAttribute('content', ogLocale)

  ensureMetaByName('twitter:card').setAttribute('content', 'summary_large_image')
  ensureMetaByName('twitter:title').setAttribute('content', title)
  ensureMetaByName('twitter:description').setAttribute('content', description)
  ensureMetaByName('twitter:image').setAttribute('content', ogImage)

  ensureMetaByName('apple-mobile-web-app-title').setAttribute('content', appName)

  ensureLinkCanonical().setAttribute('href', pageUrl)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: title,
    description,
    url: pageUrl,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    image: ogImage,
    inLanguage: htmlLang,
  }
  ensureJsonLdScript().textContent = JSON.stringify(jsonLd)
}
