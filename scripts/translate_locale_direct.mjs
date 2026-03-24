#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const LANGUAGE_NAMES = {
  ar: 'Arabic',
  bn: 'Bengali',
  de: 'German',
  en: 'English',
  es: 'Spanish',
  fa: 'Farsi (Persian)',
  fr: 'French',
  he: 'Hebrew',
  hi: 'Hindi',
  id: 'Indonesian',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  ms: 'Malay',
  nl: 'Dutch',
  pl: 'Polish',
  pt: 'Portuguese',
  pt_BR: 'Brazilian Portuguese',
  ru: 'Russian',
  sw: 'Swahili',
  ta: 'Tamil',
  th: 'Thai',
  tl: 'Tagalog',
  tr: 'Turkish',
  uk: 'Ukrainian',
  ur: 'Urdu',
  vi: 'Vietnamese',
  zh_CN: 'Simplified Chinese',
  zh_TW: 'Traditional Chinese',
}

const PLACEHOLDER_RE = /\{\{\s*[^{}]+\s*\}\}|\{[A-Za-z0-9_.-]+\}/g
const PATH_TOKEN_RE = /([^[.\]]+)|\[(\d+)\]/g
const CJK_RE = /[\u3400-\u4dbf\u4e00-\u9fff]/
const CJK_SAFE_LANGS = new Set(['zh_CN', 'zh_TW', 'ja'])
const ASCII_WORD_RE = /[A-Za-z]{3,}/g
const ASCII_LETTER_RE = /[A-Za-z]/g
const BROKEN_TEXT_RE = /\?{2,}|^\?$|^\?\s|\s\?$|\s\?\s/

function parseArgs(argv) {
  const args = {}
  for (let index = 2; index < argv.length; index += 1) {
    const item = argv[index]
    if (!item.startsWith('--')) continue
    const key = item.slice(2)
    const value = argv[index + 1]
    if (value && !value.startsWith('--')) {
      args[key] = value
      index += 1
    } else {
      args[key] = 'true'
    }
  }
  return args
}

function sortedPlaceholders(text) {
  return [...text.matchAll(PLACEHOLDER_RE)].map((match) => match[0]).sort()
}

function samePlaceholders(source, translated) {
  return JSON.stringify(sortedPlaceholders(source)) === JSON.stringify(sortedPlaceholders(translated))
}

function isProbablyNaturalEnglish(text) {
  const stripped = text.trim()
  if (!stripped) return false
  if (CJK_RE.test(stripped)) return false
  if (stripped.includes('://')) return false
  if (['console.log', 'function ', 'const ', '=>', '</', '/>', '{', '};'].some((token) => stripped.includes(token))) {
    return false
  }
  if (/^(?:[a-z0-9:_./$-]+)(?:\s+[a-z0-9:_./$-]+)+$/i.test(stripped) && /[-_:/$]/.test(stripped)) {
    return false
  }
  if (/^[A-Za-z_][A-Za-z0-9_]*\([^)]*\):\s*.+$/.test(stripped)) {
    return false
  }
  if (/^[A-Z0-9_./:#()[\]\-+*=,;<>|\\\s]+$/.test(stripped)) return false
  if (/^[a-z0-9_-]+$/i.test(stripped) && stripped.length <= 24) return false
  if (/^[\d\s.,:%+-]+$/.test(stripped)) return false
  const letters = (stripped.match(ASCII_LETTER_RE) || []).length
  const words = stripped.match(ASCII_WORD_RE) || []
  return letters >= 8 && words.length >= 2
}

function isSuspiciousTranslation(lang, candidateValue) {
  const stripped = candidateValue.trim()
  if (!stripped) return true
  if (candidateValue.includes('\uFFFD') || candidateValue.includes('�')) return true
  if (BROKEN_TEXT_RE.test(candidateValue)) return true
  if (lang !== 'en' && isProbablyNaturalEnglish(candidateValue)) return true
  return false
}

function collectStringLeaves(value, prefix = '', acc = new Map()) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectStringLeaves(item, `${prefix}[${index}]`, acc))
    return acc
  }

  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const next = prefix ? `${prefix}.${key}` : key
      collectStringLeaves(child, next, acc)
    }
    return acc
  }

  if (typeof value === 'string') {
    acc.set(prefix, value)
  }
  return acc
}

function parsePathTokens(pathKey) {
  const tokens = []
  for (const match of pathKey.matchAll(PATH_TOKEN_RE)) {
    if (match[1] !== undefined) tokens.push(match[1])
    else tokens.push(Number(match[2]))
  }
  if (tokens.length === 0) {
    throw new Error(`Invalid flattened path: ${pathKey}`)
  }
  return tokens
}

function setPathValue(root, pathKey, value) {
  const tokens = parsePathTokens(pathKey)
  let cursor = root
  for (const token of tokens.slice(0, -1)) {
    cursor = cursor[token]
  }
  cursor[tokens.at(-1)] = value
}

function buildObject(template, translatedFlat) {
  const result = JSON.parse(JSON.stringify(template))
  for (const [pathKey, value] of translatedFlat.entries()) {
    setPathValue(result, pathKey, value)
  }
  return result
}

function sanitizeJsonText(raw) {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  const content = fenced ? fenced[1] : trimmed
  const firstBrace = content.indexOf('{')
  const lastBrace = content.lastIndexOf('}')
  if (firstBrace < 0 || lastBrace <= firstBrace) {
    throw new Error('Model response does not contain a valid JSON object.')
  }
  return content.slice(firstBrace, lastBrace + 1)
}

async function requestChatCompletion({ baseUrl, apiKey, model, messages, timeoutSec }) {
  const timeout = AbortSignal.timeout(timeoutSec * 1000)
  const resp = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    signal: timeout,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, temperature: 0.2, messages }),
  })
  const body = await resp.text()
  if (!resp.ok) {
    throw new Error(`Translation API error (${resp.status}): ${body}`)
  }
  const data = JSON.parse(body)
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Translation API response is missing message content.')
  }
  return content
}

function isValidExistingValue({ lang, sourceValue, candidateValue }) {
  if (typeof candidateValue !== 'string' || !candidateValue.trim()) return false
  if (!samePlaceholders(sourceValue, candidateValue)) return false
  if (isSuspiciousTranslation(lang, candidateValue)) return false
  if (lang !== 'zh_CN' && candidateValue === sourceValue && CJK_RE.test(sourceValue)) return false
  if (!CJK_SAFE_LANGS.has(lang) && CJK_RE.test(candidateValue)) return false
  return true
}

function chunkEntries(entries, chunkSize) {
  const chunks = []
  for (let index = 0; index < entries.length; index += chunkSize) {
    chunks.push(entries.slice(index, index + chunkSize))
  }
  return chunks
}

function saveSnapshot({ outputPath, sourceData, sourceStrings, translatedFlat }) {
  const finalStrings = new Map()
  for (const [key, sourceValue] of sourceStrings.entries()) {
    finalStrings.set(key, translatedFlat.get(key) ?? sourceValue)
  }
  const finalObject = buildObject(sourceData, finalStrings)
  fs.writeFileSync(outputPath, `${JSON.stringify(finalObject, null, 2)}\n`, 'utf8')
}

function loadJsonObject(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''))
}

async function translateEntries({ lang, entries, baseUrl, model, apiKey, timeoutSec, retries, retryBackoffSec }) {
  const sourceKeys = entries.map(([key]) => key)
  const sourceValues = entries.map(([, value]) => value)
  const languageName = LANGUAGE_NAMES[lang] ?? lang
  const systemPrompt = [
    'You are a professional software localization translator.',
    `Translate UI strings into ${languageName}.`,
    'Return ONLY valid JSON in the exact format {"values":[...]} with the same item count and order as the input.',
    'Preserve placeholders exactly, including forms like {{count}} and {{ value }}.',
    'Preserve escaped newline markers (\\n), URLs, code syntax, and markdown.',
    'Do not add explanations or code fences.',
  ].join(' ')
  const userPrompt = [
    `Target language code: ${lang}`,
    'Translate each input item into the target language.',
    JSON.stringify(sourceValues, null, 2),
  ].join('\n')

  let lastError
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const content = await requestChatCompletion({
        baseUrl,
        apiKey,
        model,
        timeoutSec,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      })
      const parsed = JSON.parse(sanitizeJsonText(content))
      const values = parsed?.values
      if (!Array.isArray(values) || values.length !== sourceValues.length) {
        throw new Error(`Translated array mismatch for ${lang}.`)
      }

      const result = new Map()
      values.forEach((translated, index) => {
        const sourceValue = sourceValues[index]
        if (typeof translated !== 'string') {
          throw new Error(`Translated value is not string at key: ${sourceKeys[index]}`)
        }
        if (!samePlaceholders(sourceValue, translated)) {
          throw new Error(`Placeholder mismatch at key: ${sourceKeys[index]}`)
        }
        result.set(sourceKeys[index], translated)
      })
      return result
    } catch (error) {
      lastError = error
      if (attempt >= retries) break
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * retryBackoffSec * 1000))
    }
  }

  throw lastError
}

async function translateSingleEntry({ lang, entry, baseUrl, model, apiKey, timeoutSec, retries, retryBackoffSec }) {
  const [key, sourceValue] = entry
  const languageName = LANGUAGE_NAMES[lang] ?? lang
  const systemPrompt = [
    'You are a professional software localization translator.',
    `Translate the UI string into ${languageName}.`,
    'Return ONLY valid JSON in the exact format {"value":"..."}',
    'Preserve placeholders exactly, including forms like {{count}} and {{ value }}.',
    'Preserve escaped newline markers (\\n), URLs, code syntax, and markdown.',
    'Do not add explanations or code fences.',
  ].join(' ')
  const userPrompt = [
    `Target language code: ${lang}`,
    `Key: ${key}`,
    JSON.stringify(sourceValue),
  ].join('\n')

  let lastError
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const content = await requestChatCompletion({
        baseUrl,
        apiKey,
        model,
        timeoutSec,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      })
      const parsed = JSON.parse(sanitizeJsonText(content))
      const value = parsed?.value
      if (typeof value !== 'string') {
        throw new Error(`Translated value is not string at key: ${key}`)
      }
      if (!samePlaceholders(sourceValue, value)) {
        throw new Error(`Placeholder mismatch at key: ${key}`)
      }
      return new Map([[key, value]])
    } catch (error) {
      lastError = error
      if (attempt >= retries) break
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * retryBackoffSec * 1000))
    }
  }

  throw lastError
}

async function translateEntriesWithFallback(options) {
  try {
    return await translateEntries(options)
  } catch (error) {
    if (options.entries.length <= 1) {
      return translateSingleEntry({
        lang: options.lang,
        entry: options.entries[0],
        baseUrl: options.baseUrl,
        model: options.model,
        apiKey: options.apiKey,
        timeoutSec: options.timeoutSec,
        retries: options.retries,
        retryBackoffSec: options.retryBackoffSec,
      })
    }
    const midpoint = Math.floor(options.entries.length / 2)
    const left = await translateEntriesWithFallback({
      ...options,
      entries: options.entries.slice(0, midpoint),
    })
    const right = await translateEntriesWithFallback({
      ...options,
      entries: options.entries.slice(midpoint),
    })
    return new Map([...left.entries(), ...right.entries()])
  }
}

async function main() {
  const args = parseArgs(process.argv)
  const sourcePath = args.source ? path.resolve(args.source) : null
  const outputPath = args.output ? path.resolve(args.output) : null
  const lang = args.lang
  const baseUrl = args['base-url'] || process.env.LLM_BASE_URL || ''
  const model = args.model || process.env.LLM_MODEL || ''
  const apiKey = args['api-key'] || process.env.LLM_API_KEY || ''
  const chunkSize = Number(args['chunk-size'] || 20)
  const timeoutSec = Number(args['timeout-sec'] || 180)
  const retries = Number(args.retries || 3)
  const retryBackoffSec = Number(args['retry-backoff-sec'] || 3)
  const maxChunks = args['max-chunks'] ? Number(args['max-chunks']) : Number.POSITIVE_INFINITY

  if (!sourcePath || !outputPath || !lang) {
    throw new Error('Missing required arguments: --source --output --lang')
  }
  if (!apiKey) throw new Error('Missing API key')

  const sourceData = loadJsonObject(sourcePath)
  if (!sourceData || typeof sourceData !== 'object' || Array.isArray(sourceData)) {
    throw new Error('Source JSON must be a top-level object.')
  }

  const sourceStrings = collectStringLeaves(sourceData)
  const translatedFlat = new Map()
  const existingStrings = fs.existsSync(outputPath) ? collectStringLeaves(loadJsonObject(outputPath)) : new Map()

  for (const [key, sourceValue] of sourceStrings.entries()) {
    const existingValue = existingStrings.get(key)
    if (isValidExistingValue({ lang, sourceValue, candidateValue: existingValue })) {
      translatedFlat.set(key, existingValue)
    }
  }

  const pendingEntries = [...sourceStrings.entries()].filter(([key]) => !translatedFlat.has(key))
  if (pendingEntries.length === 0) {
    console.log(`[skip] ${lang} no pending keys (${outputPath})`)
    return
  }

  console.log(`[${lang}] incremental mode: reuse=${translatedFlat.size} pending=${pendingEntries.length}`)
  const chunks = chunkEntries(pendingEntries, chunkSize)
  for (const [index, chunk] of chunks.entries()) {
    if (index >= maxChunks) {
      console.log(`[${lang}] stopping early after ${maxChunks} chunks`)
      break
    }
    console.log(`[${lang}] chunk ${index + 1}/${chunks.length} request (${chunk.length} keys)`)
    const translatedChunk = await translateEntriesWithFallback({
      lang,
      entries: chunk,
      baseUrl,
      model,
      apiKey,
      timeoutSec,
      retries,
      retryBackoffSec,
    })
    for (const [key, value] of translatedChunk.entries()) {
      translatedFlat.set(key, value)
    }
    saveSnapshot({ outputPath, sourceData, sourceStrings, translatedFlat })
    console.log(`[${lang}] chunk ${index + 1}/${chunks.length} completed`)
  }

  console.log(`[done] ${lang} -> ${outputPath}`)
}

main().catch((error) => {
  console.error(String(error))
  process.exit(1)
})
