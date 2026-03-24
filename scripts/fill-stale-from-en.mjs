/**
 * 将各语言 JSON 中仍与 en.json 相同的字符串递归翻译为目标语言（含嵌套对象与数组）。
 * 默认优先 Lingva 公开实例，失败则回退 MyMemory（见 translate-providers.mjs）。
 *
 * 用法:
 *   node scripts/fill-stale-from-en.mjs --locale=de [--max=2000] [--delay=100]
 *   node scripts/fill-stale-from-en.mjs --all [--max=2000] [--delay=100]
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { translateEnTo, cacheKey } from './translate-providers.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const LOCALS = path.join(ROOT, 'src', 'locals')
const CACHE_FILE = path.join(__dirname, '.i18n-translate-cache.json')
const LEGACY_STALE = path.join(__dirname, '.mymemory-stale-cache.json')

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
  zh_CN: 'zh-CN',
}

function parseArgs() {
  const a = process.argv.slice(2)
  const out = { all: false, locale: null, max: 5000, delay: 100 }
  for (const x of a) {
    if (x === '--all') out.all = true
    else if (x.startsWith('--locale=')) out.locale = x.slice('--locale='.length)
    else if (x.startsWith('--max=')) out.max = parseInt(x.slice('--max='.length), 10) || 5000
    else if (x.startsWith('--delay=')) out.delay = parseInt(x.slice('--delay='.length), 10) || 100
  }
  return out
}

function loadCache() {
  let merged = {}
  for (const p of [CACHE_FILE, LEGACY_STALE]) {
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

function shouldTranslate(s) {
  if (typeof s !== 'string') return false
  const t = s.trim()
  if (t.length === 0) return false
  if (/^[\d\s\-+().]+$/.test(t) && t.length < 28) return false
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return false
  if (/^https?:\/\//i.test(t)) return false
  return true
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

async function translateOnce(phrase, locale, cache, delayMs) {
  const { out, parts } = protect(phrase)
  const ck = cacheKey(locale, out)
  if (cache[ck]) {
    return cache[ck]
  }

  const raw = await translateEnTo(out, locale)
  const tr = unprotect(raw, parts)
  cache[ck] = tr
  saveCache(cache)
  await new Promise((r) => setTimeout(r, delayMs))
  return tr
}

function collectStale(target, sourceEn, out) {
  if (typeof target === 'string' && typeof sourceEn === 'string') {
    if (target === sourceEn && shouldTranslate(target)) {
      out.push(target)
    }
    return
  }
  if (Array.isArray(target) && Array.isArray(sourceEn)) {
    const n = Math.min(target.length, sourceEn.length)
    for (let i = 0; i < n; i++) {
      collectStale(target[i], sourceEn[i], out)
    }
    return
  }
  if (
    target &&
    typeof target === 'object' &&
    !Array.isArray(target) &&
    sourceEn &&
    typeof sourceEn === 'object' &&
    !Array.isArray(sourceEn)
  ) {
    for (const k of Object.keys(target)) {
      if (!(k in sourceEn)) continue
      collectStale(target[k], sourceEn[k], out)
    }
  }
}

function applyTranslations(target, sourceEn, enToTr) {
  if (typeof target === 'string' && typeof sourceEn === 'string') {
    if (target === sourceEn && shouldTranslate(target) && enToTr.has(target)) {
      return enToTr.get(target)
    }
    return target
  }
  if (Array.isArray(target) && Array.isArray(sourceEn)) {
    return target.map((item, i) =>
      i < sourceEn.length ? applyTranslations(item, sourceEn[i], enToTr) : item,
    )
  }
  if (
    target &&
    typeof target === 'object' &&
    !Array.isArray(target) &&
    sourceEn &&
    typeof sourceEn === 'object' &&
    !Array.isArray(sourceEn)
  ) {
    const result = { ...target }
    for (const k of Object.keys(target)) {
      if (k in sourceEn) {
        result[k] = applyTranslations(target[k], sourceEn[k], enToTr)
      }
    }
    return result
  }
  return target
}

async function processLocale(locale, enObj, args, cache) {
  if (!LANGPAIR[locale]) {
    console.error('unknown locale', locale)
    return
  }
  const filePath = path.join(LOCALS, `${locale}.json`)
  if (!fs.existsSync(filePath)) return

  let locObj = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const staleList = []
  collectStale(locObj, enObj, staleList)
  const unique = [...new Set(staleList)]
  console.log(locale, 'stale occurrences:', staleList.length, 'unique phrases:', unique.length)

  const enToTr = new Map()
  let done = 0
  let failed = 0
  for (const phrase of unique) {
    if (done >= args.max) {
      console.log(locale, 'reached --max', args.max, ', stopping this locale (可再次运行继续)')
      break
    }
    try {
      const tr = await translateOnce(phrase, locale, cache, args.delay)
      enToTr.set(phrase, tr)
      done++
      if (done % 50 === 0) {
        console.log(locale, 'progress', done, '/', Math.min(unique.length, args.max))
      }
    } catch (e) {
      failed++
      console.error(locale, 'skip phrase:', phrase.slice(0, 72), '…', e.message)
      if (failed > 30 && /QUOTA|quota|429/i.test(String(e.message))) {
        console.error(locale, '过多连续失败，请稍后重试。已写入当前进度。')
        break
      }
    }
  }

  locObj = applyTranslations(locObj, enObj, enToTr)
  fs.writeFileSync(filePath, JSON.stringify(locObj, null, 2) + '\n', 'utf8')
  console.log(locale, 'done translated unique:', enToTr.size, 'written')
}

async function main() {
  const args = parseArgs()
  const enObj = JSON.parse(fs.readFileSync(path.join(LOCALS, 'en.json'), 'utf8'))
  const cache = loadCache()

  const list = args.all
    ? Object.keys(LANGPAIR).filter((l) => l !== 'en')
    : args.locale
      ? [args.locale]
      : []

  if (list.length === 0) {
    console.error('Usage: --locale=de | --all')
    process.exit(1)
  }

  for (const loc of list) {
    await processLocale(loc, enObj, args, cache)
  }
}

main().catch(console.error)
