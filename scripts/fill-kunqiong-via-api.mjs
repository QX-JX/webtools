/**
 * 将 en.json 中的 kunqiongNav / footer 相关键翻译到各语言文件。
 * 使用 translate-providers（Lingva 优先，MyMemory 备用）。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { translateEnTo, cacheKey } from './translate-providers.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const LOCALS = path.join(ROOT, 'src', 'locals')
const CACHE_FILE = path.join(__dirname, '.i18n-translate-cache.json')
const LEGACY_KUNQIONG = path.join(__dirname, '.mymemory-kunqiong-cache.json')

const EN = JSON.parse(fs.readFileSync(path.join(LOCALS, 'en.json'), 'utf8'))

const LANGPAIR = {
  ar: 'ar',
  bn: 'bn',
  de: 'de',
  es: 'es',
  fa: 'fa',
  fr: 'fr',
  he: 'he',
  hi: 'hi',
  id: 'id',
  it: 'it',
  ja: 'ja',
  ko: 'ko',
  ms: 'ms',
  nl: 'nl',
  pl: 'pl',
  pt: 'pt',
  pt_BR: 'pt',
  ru: 'ru',
  sw: 'sw',
  ta: 'ta',
  th: 'th',
  tl: 'tl',
  tr: 'tr',
  uk: 'uk',
  ur: 'ur',
  vi: 'vi',
  zh_TW: 'zh-TW',
}

const KEYS = {
  kunqiongNav: [
    'home',
    'aiTools',
    'office',
    'multimedia',
    'development',
    'text',
    'file',
    'system',
    'life',
    'news',
    'custom',
    'consult',
    'industryNews',
    'feedback',
    'imageGen',
    'codeDev',
    'logoAlt',
    'footerLogoAlt',
    'loginRegister',
    'navExpandAria',
    'navSearchAria',
    'navMenuAria',
  ],
  footer: [
    'kunqiongBrandDesc',
    'quickLinks',
    'contactTitle',
    'contactCompany',
    'contactPhone',
    'contactRegion',
    'contactEmail',
    'copyrightLine',
    'userAgreement',
    'privacyPolicy',
  ],
}

function loadCache() {
  let merged = {}
  for (const p of [CACHE_FILE, LEGACY_KUNQIONG]) {
    try {
      merged = { ...merged, ...JSON.parse(fs.readFileSync(p, 'utf8')) }
    } catch {
      /* empty */
    }
  }
  return merged
}

function saveCache(c) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(c, null, 2), 'utf8')
}

function protect(s) {
  const parts = []
  const out = s.replace(/\{\{[^}]+\}\}/g, (m) => {
    const i = parts.length
    parts.push(m)
    return `⟦${i}⟧`
  })
  return { out, parts }
}

function unprotect(s, parts) {
  let r = s
  parts.forEach((p, i) => {
    r = r.split(`⟦${i}⟧`).join(p)
  })
  return r
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  let cache = loadCache()
  const targets = Object.keys(LANGPAIR).filter((c) => c !== 'en')

  for (const locale of targets) {
    const filePath = path.join(LOCALS, `${locale}.json`)
    if (!fs.existsSync(filePath)) {
      console.warn('skip missing file', locale)
      continue
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

    for (const section of ['kunqiongNav', 'footer']) {
      for (const key of KEYS[section]) {
        const sourceText = EN[section]?.[key]
        if (sourceText == null || typeof sourceText !== 'string') continue

        const { out, parts } = protect(sourceText)
        const ck = cacheKey(locale, out)
        let translated
        if (cache[ck]) {
          translated = cache[ck]
        } else {
          try {
            const raw = await translateEnTo(out, locale)
            translated = unprotect(raw, parts)
            cache[ck] = translated
            saveCache(cache)
            await sleep(120)
          } catch (e) {
            console.error(locale, section, key, e.message)
            translated = sourceText
          }
        }

        if (!data[section]) data[section] = {}
        data[section][key] = translated
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8')
    console.log('updated', locale)
  }
}

main().catch(console.error)
