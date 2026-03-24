/**
 * 与 http://aiformat.kunqiongai.com/index.html 页头、页脚导航一致（指向 www.kunqiongai.com）
 */
export const KUNQIONG_ORIGIN = 'https://www.kunqiongai.com'

/** 与参考页 DOM 结构一致：plain | AI 带下拉箭头 | 仅包裹一层 wrapper */
export type KunqiongHeaderNavBlock =
  | { variant: 'plain'; href: string; i18nKey: string; active?: boolean }
  | { variant: 'aiDropdown'; href: string; i18nKey: string }
  | { variant: 'wrapped'; href: string; i18nKey: string; active?: boolean }

export const kunqiongHeaderNavBlocks: KunqiongHeaderNavBlock[] = [
  { variant: 'plain', href: `${KUNQIONG_ORIGIN}/`, i18nKey: 'kunqiongNav.home' },
  { variant: 'aiDropdown', href: `${KUNQIONG_ORIGIN}/category/ai`, i18nKey: 'kunqiongNav.aiTools' },
  { variant: 'wrapped', href: `${KUNQIONG_ORIGIN}/category/office`, i18nKey: 'kunqiongNav.office' },
  { variant: 'wrapped', href: `${KUNQIONG_ORIGIN}/category/multimedia`, i18nKey: 'kunqiongNav.multimedia' },
  { variant: 'wrapped', href: `${KUNQIONG_ORIGIN}/category/development`, i18nKey: 'kunqiongNav.development' },
  /** 参考页 index 上「文本处理」为 current */
  { variant: 'wrapped', href: `${KUNQIONG_ORIGIN}/category/text`, i18nKey: 'kunqiongNav.text', active: true },
  { variant: 'wrapped', href: `${KUNQIONG_ORIGIN}/category/file`, i18nKey: 'kunqiongNav.file' },
  { variant: 'wrapped', href: `${KUNQIONG_ORIGIN}/category/system`, i18nKey: 'kunqiongNav.system' },
  { variant: 'wrapped', href: `${KUNQIONG_ORIGIN}/category/life`, i18nKey: 'kunqiongNav.life' },
  { variant: 'plain', href: `${KUNQIONG_ORIGIN}/news`, i18nKey: 'kunqiongNav.news' },
  { variant: 'plain', href: `${KUNQIONG_ORIGIN}/custom`, i18nKey: 'kunqiongNav.custom' },
]

export const kunqiongFooterQuick = [
  { href: `${KUNQIONG_ORIGIN}/`, i18nKey: 'kunqiongNav.home' },
  { href: `${KUNQIONG_ORIGIN}/category/ai`, i18nKey: 'kunqiongNav.aiTools' },
  { href: `${KUNQIONG_ORIGIN}/custom`, i18nKey: 'kunqiongNav.consult' },
  { href: `${KUNQIONG_ORIGIN}/news`, i18nKey: 'kunqiongNav.industryNews' },
  { href: `${KUNQIONG_ORIGIN}/feedback`, i18nKey: 'kunqiongNav.feedback' },
] as const

export const kunqiongFooterCategories = [
  { href: `${KUNQIONG_ORIGIN}/category/text`, i18nKey: 'kunqiongNav.text' },
  { href: `${KUNQIONG_ORIGIN}/category/multimedia`, i18nKey: 'kunqiongNav.imageGen' },
  { href: `${KUNQIONG_ORIGIN}/category/office`, i18nKey: 'kunqiongNav.office' },
  { href: `${KUNQIONG_ORIGIN}/category/file`, i18nKey: 'kunqiongNav.file' },
  { href: `${KUNQIONG_ORIGIN}/category/development`, i18nKey: 'kunqiongNav.codeDev' },
] as const

export const kunqiongFooterLegal = {
  agreement: `${KUNQIONG_ORIGIN}/agreement`,
  privacy: `${KUNQIONG_ORIGIN}/privacy`,
} as const

export const kunqiongLogoUrl = `${KUNQIONG_ORIGIN}/logo.png`
export const kunqiongFooterLogoUrl = `${KUNQIONG_ORIGIN}/logo2.png`

/** 鲲穹 AI 工具站个人中心（与 aitools.kunqiongai.com 一致） */
export const KUNQIONG_AITOOLS_ORIGIN = 'https://aitools.kunqiongai.com'
export const KUNQIONG_AITOOLS_LOGIN = `${KUNQIONG_AITOOLS_ORIGIN}/login`
export const KUNQIONG_AITOOLS_REGISTER = `${KUNQIONG_AITOOLS_ORIGIN}/register`

/** 构建 returnUrl / 回跳后清栏时，需从地址去掉的敏感或一次性参数 */
export const KUNQIONG_RETURN_URL_STRIP_KEYS = [
  'token',
  'login_token',
  'auth_token',
  'access_token',
  'kq_token',
  'ticket',
  'data',
  'user_info',
  'userInfo',
  'client_nonce',
  'nonce',
] as const

/**
 * 从当前 window.location 去掉敏感查询参数并 replaceState（官网回跳带 token 后使用）。
 */
export function stripAuthParamsFromCurrentLocation(): void {
  if (typeof window === 'undefined') return
  const u = new URL(window.location.href)
  let changed = false
  for (const k of KUNQIONG_RETURN_URL_STRIP_KEYS) {
    if (u.searchParams.has(k)) {
      u.searchParams.delete(k)
      changed = true
    }
  }
  if (u.hash && u.hash.includes('=')) {
    const raw = u.hash.startsWith('#') ? u.hash.slice(1) : u.hash
    const hp = new URLSearchParams(raw)
    for (const k of KUNQIONG_RETURN_URL_STRIP_KEYS) {
      if (hp.has(k)) {
        hp.delete(k)
        changed = true
      }
    }
    const next = hp.toString()
    u.hash = next ? `#${next}` : ''
  }
  if (changed) {
    window.history.replaceState({}, document.title, u.pathname + u.search + u.hash)
  }
}

/**
 * 鲲穹 Web 登录/注册：跳转官网并在登录成功后回到当前页（见 kunqiong-web-login）。
 */
export function buildKunqiongWebAuthUrl(mode: 'login' | 'register'): string {
  if (typeof window === 'undefined') {
    return mode === 'register' ? KUNQIONG_AITOOLS_REGISTER : KUNQIONG_AITOOLS_LOGIN
  }
  const base = mode === 'register' ? KUNQIONG_AITOOLS_REGISTER : KUNQIONG_AITOOLS_LOGIN
  const u = new URL(window.location.href)
  for (const k of KUNQIONG_RETURN_URL_STRIP_KEYS) {
    u.searchParams.delete(k)
  }
  if (u.hash && u.hash.includes('=')) {
    const raw = u.hash.startsWith('#') ? u.hash.slice(1) : u.hash
    const hp = new URLSearchParams(raw)
    for (const k of KUNQIONG_RETURN_URL_STRIP_KEYS) {
      hp.delete(k)
    }
    const next = hp.toString()
    u.hash = next ? `#${next}` : ''
  }
  const returnUrl = `${u.origin}${u.pathname}${u.search}${u.hash}`
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}returnUrl=${encodeURIComponent(returnUrl)}`
}
export const KUNQIONG_AITOOLS_USER_CENTER = `${KUNQIONG_AITOOLS_ORIGIN}/user-center`
export const KUNQIONG_AITOOLS_SETTINGS = `${KUNQIONG_AITOOLS_ORIGIN}/setting`
/** 与线上一致：打开鲲穹 AI 工具站登录页，登录后默认进入个人中心路径 */
export const KUNQIONG_AITOOLS_LOGIN_REDIRECT_USER_CENTER =
  `${KUNQIONG_AITOOLS_LOGIN}?redirect=/user-center`

/**
 * 构建「登录/注册」跳转地址（用户要求入口为 aitools 登录页 + redirect=/user-center）。
 * 附加 returnUrl 为当前完整页面地址，便于登录成功后由官网回跳到本地工具站（若官网支持该参数）。
 */
export function buildAitoolsLoginUrl(): string {
  const base = KUNQIONG_AITOOLS_LOGIN_REDIRECT_USER_CENTER
  if (typeof window === 'undefined') return base
  const returnUrl = `${window.location.origin}${window.location.pathname}${window.location.search || ''}`
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}returnUrl=${encodeURIComponent(returnUrl)}`
}

/** 注册页：同样带 redirect=/user-center 与 returnUrl */
export function buildAitoolsRegisterUrl(): string {
  const base = `${KUNQIONG_AITOOLS_REGISTER}?redirect=/user-center`
  if (typeof window === 'undefined') return base
  const returnUrl = `${window.location.origin}${window.location.pathname}${window.location.search || ''}`
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}returnUrl=${encodeURIComponent(returnUrl)}`
}

/** 登录成功后回跳到本地 web 首页 */
export const KUNQIONG_AITOOLS_LOGIN_REDIRECT_LOCALHOST =
  `${KUNQIONG_AITOOLS_LOGIN}?returnUrl=%2Flogin%3Fredirect%3Dhttp%253A%252F%252Flocalhost%253A5888%252F`
export const KUNQIONG_AITOOLS_REGISTER_REDIRECT_LOCALHOST =
  `${KUNQIONG_AITOOLS_REGISTER}?returnUrl=%2Flogin%3Fredirect%3Dhttp%253A%252F%252Flocalhost%253A5888%252F`
