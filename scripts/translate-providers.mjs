/**
 * 多后端英译：优先 Lingva 公开实例（配额较宽松），失败则回退 MyMemory。
 * 占位符 {{x}} 在调用方保护/恢复。
 */
import crypto from 'crypto'

/** 与 src/locals/*.json 文件名一致 */
export const LOCALE_TO_LINGVA = {
  ar: 'ar',
  bn: 'bn',
  de: 'de',
  es: 'es',
  fa: 'fa',
  fr: 'fr',
  he: 'iw',
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
  zh_CN: 'zh',
  zh_TW: 'zh_HANT',
}

/** MyMemory langpair 目标段（部分与 Lingva 不同） */
export const LOCALE_TO_MYMEMORY = {
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
  zh_CN: 'zh-CN',
  zh_TW: 'zh-TW',
}

const LINGVA_BASES = [
  'https://translate.plausibility.cloud',
  'https://lingva.ml',
  'https://translate.dyno.gg',
]

const FETCH_TIMEOUT_MS = 90000

async function fetchWithTimeout(url, options = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

function parseLingvaJson(text) {
  const data = JSON.parse(text)
  if (typeof data.translation === 'string') return data.translation
  if (data.data && typeof data.data === 'string') return data.data
  throw new Error('Lingva: unexpected JSON shape')
}

/**
 * @param {string} text 已替换占位符的纯文本
 * @param {string} localeKey 如 de、pt_BR、zh_TW
 * @param {{ prefer?: 'lingva'|'mymemory' }} opts
 */
export async function translateEnTo(text, localeKey, opts = {}) {
  const prefer = opts.prefer ?? 'lingva'

  const runLingva = async () => {
    const target = LOCALE_TO_LINGVA[localeKey]
    if (!target) throw new Error(`Lingva: unknown locale ${localeKey}`)
    const q = encodeURIComponent(text)
    let lastErr
    for (const base of LINGVA_BASES) {
      const url = `${base}/api/v1/en/${target}/${q}`
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetchWithTimeout(url, {
            headers: { Accept: 'application/json' },
          })
          const raw = await res.text()
          if (!res.ok || raw.startsWith('<!DOCTYPE') || raw.startsWith('<html')) {
            lastErr = new Error(`Lingva HTTP ${res.status}`)
            await sleep(400 * (attempt + 1))
            continue
          }
          return parseLingvaJson(raw)
        } catch (e) {
          lastErr = e
          await sleep(400 * (attempt + 1))
        }
      }
    }
    throw lastErr || new Error('Lingva failed')
  }

  const runMyMemory = async () => {
    const targetIso = LOCALE_TO_MYMEMORY[localeKey]
    if (!targetIso) throw new Error(`MyMemory: unknown locale ${localeKey}`)
    const pair = `en|${targetIso}`
    const q = encodeURIComponent(text)
    const url = `https://api.mymemory.translated.net/get?q=${q}&langpair=${pair}`
    const res = await fetchWithTimeout(url)
    const data = await res.json()
    const detail = String(data.responseDetails || '')
    if (/MYMEMORY WARNING|USAGE LIMIT|QUOTA/i.test(detail)) {
      const err = new Error('MYMEMORY_QUOTA')
      err.quota = true
      throw err
    }
    if (data.responseStatus !== 200 && data.responseStatus !== '200') {
      throw new Error(detail || JSON.stringify(data))
    }
    return data.responseData.translatedText
  }

  if (prefer === 'lingva') {
    try {
      return await runLingva()
    } catch (e1) {
      try {
        return await runMyMemory()
      } catch (e2) {
        if (e2.quota) {
          const err = new Error(`Lingva failed (${e1.message}); MyMemory quota`)
          err.quota = true
          throw err
        }
        throw e2
      }
    }
  }

  try {
    return await runMyMemory()
  } catch (e1) {
    if (e1.quota) throw e1
    try {
      return await runLingva()
    } catch (e2) {
      throw new Error(`MyMemory: ${e1.message}; Lingva: ${e2.message}`)
    }
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

/** 统一缓存键（跨脚本共用） */
export function cacheKey(targetIsoOrLocale, protectedText) {
  return `${targetIsoOrLocale}::${crypto.createHash('sha256').update(protectedText).digest('hex')}`
}
