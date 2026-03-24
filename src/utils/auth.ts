import i18n from '../i18n/config'
import { API_BASE_URL } from '../config/api'
import { KUNQIONG_AITOOLS_LOGIN } from '../config/kunqiongLinks'

const AUTH_API_BASE_URL = `${API_BASE_URL}/api/auth`

export interface SignedNonce {
  nonce: string
  timestamp: number
  signature: string
}

export interface UserInfo {
  avatar: string
  nickname: string
}

/**
 * 将鲲穹账号体系接口（含主站 https://www.kunqiongai.com 与 /user/user_all_info、soft_desktop/get_user_info）
 * 返回的多种字段形态统一为 avatar + nickname，便于页头与官网一致展示头像。
 */
export function normalizeKunqiongUserInfo(data: unknown): UserInfo {
  const empty: UserInfo = { avatar: '', nickname: '' }
  if (!data || typeof data !== 'object') return empty

  const root = data as Record<string, unknown>
  const raw =
    root.user_info && typeof root.user_info === 'object'
      ? (root.user_info as Record<string, unknown>)
      : root

  const pickStr = (...vals: unknown[]) => {
    for (const v of vals) {
      if (typeof v === 'string' && v.trim()) return v.trim()
    }
    return ''
  }

  let avatar = pickStr(
    raw.avatar,
    raw.headimgurl,
    raw.head_img,
    raw.avatar_url,
    raw.photo,
    raw.user_avatar,
  )

  if (avatar) {
    if (avatar.startsWith('//')) {
      avatar = `https:${avatar}`
    } else if (avatar.startsWith('/') && !/^https?:\/\//i.test(avatar)) {
      avatar = `https://www.kunqiongai.com${avatar}`
    }
  }

  const nickname = pickStr(raw.nickname, raw.nick_name, raw.username, raw.name)

  return { avatar, nickname }
}

export interface LoginResponse {
  code: number
  msg: string
  data: any
}

/**
 * 获取网页端登录地址
 */
export async function getWebLoginUrl(): Promise<string> {
  try {
    const response = await fetch(`${AUTH_API_BASE_URL}/get-web-login-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: '',
    })
    const raw = await response.text()
    let result: LoginResponse
    try {
      result = raw ? JSON.parse(raw) : { code: 0, msg: 'empty', data: null }
    } catch {
      console.warn('[auth] getWebLoginUrl 响应非 JSON，使用内置登录地址。HTTP', response.status, raw.slice(0, 120))
      return KUNQIONG_AITOOLS_LOGIN
    }
    if (!response.ok) {
      console.warn('[auth] getWebLoginUrl HTTP 异常，使用内置登录地址:', response.status, result.msg)
      return KUNQIONG_AITOOLS_LOGIN
    }
    if (result.code === 1 && result.data?.login_url) {
      return result.data.login_url
    }
    console.warn('[auth] getWebLoginUrl 业务失败，使用内置登录地址:', result.msg)
    return KUNQIONG_AITOOLS_LOGIN
  } catch (error) {
    console.warn('[auth] getWebLoginUrl 异常，使用内置登录地址:', error)
    return KUNQIONG_AITOOLS_LOGIN
  }
}

export interface AuthStartResult {
  loginUrl: string
  clientNonce: string
}

export interface AuthPollResult {
  status: 'success' | 'pending' | 'error'
  token?: string
  user_info?: UserInfo
  message?: string
}

/** 代理失败或后端未启动时常返回空体，避免 response.json() 抛错 */
function parseJsonBody<T = Record<string, unknown>>(raw: string): T | null {
  const t = raw?.trim()
  if (!t) return null
  try {
    return JSON.parse(t) as T
  } catch {
    return null
  }
}

function authFetchErrorHint(status: number, raw: string): string {
  const empty = !raw?.trim()
  if (empty && (status === 502 || status === 503 || status === 504)) {
    return i18n.t('auth.errors.backendUnreachable')
  }
  if (empty && (status === 500 || status === 0)) {
    return i18n.t('auth.errors.backendUnreachable')
  }
  if (empty) {
    return i18n.t('auth.errors.emptyResponse', { status })
  }
  const parsed = parseJsonBody<{ message?: string; msg?: string }>(raw)
  if (parsed?.message) return parsed.message
  if (parsed?.msg) return parsed.msg
  return raw.slice(0, 200)
}

/**
 * 启动登录/注册流程：后端返回完整登录地址与 client_nonce
 */
export async function startAuthFlow(mode: 'login' | 'register' = 'login'): Promise<AuthStartResult> {
  const response = await fetch(`${AUTH_API_BASE_URL}/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mode }),
  })
  const raw = await response.text()
  const result = parseJsonBody<{
    login_url?: string
    client_nonce?: string
    message?: string
    status?: string
  }>(raw)
  if (!response.ok || !result?.login_url || !result?.client_nonce) {
    const detail = result?.message || authFetchErrorHint(response.status, raw)
    throw new Error(i18n.t('auth.errors.getLoginUrlFailed', { message: detail }))
  }
  const clientNonce = String(result.client_nonce)
  try {
    localStorage.setItem(AUTH_LOGIN_NONCE_KEY, clientNonce)
  } catch {
    /* ignore */
  }
  return {
    loginUrl: String(result.login_url),
    clientNonce,
  }
}

/**
 * 单次轮询登录状态
 */
export async function pollLoginStatus(clientNonce: string): Promise<AuthPollResult> {
  const response = await fetch(`${AUTH_API_BASE_URL}/poll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ client_nonce: clientNonce }),
  })
  const raw = await response.text()
  const result = parseJsonBody<AuthPollResult>(raw)
  if (!response.ok) {
    return {
      status: 'error',
      message: result?.message || authFetchErrorHint(response.status, raw),
    }
  }
  if (!result) {
    return { status: 'error', message: authFetchErrorHint(response.status, raw) }
  }
  return result
}

/**
 * 轮询获取Token
 */
export async function pollToken(
  clientNonce: string,
  /** 秒；文档建议 3 分钟内完成登录 */
  timeout: number = 180,
  onCancel?: () => boolean
): Promise<string> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout * 1000) {
    // 检查是否被取消
    if (onCancel && onCancel()) {
      throw new Error(i18n.t('auth.errors.loginCancelled'))
    }

    try {
      const result = await pollLoginStatus(clientNonce)
      if (result.status === 'success' && result.token) {
        return result.token
      }
      if (result.status === 'error') {
        throw new Error(result.message || i18n.t('auth.errors.pollingAbnormal', { message: 'unknown' }))
      }
    } catch (error) {
      console.log(i18n.t('auth.errors.pollingFailed', { error: error instanceof Error ? error.message : String(error) }))
    }

    // 与鲲穹文档一致：约 2.5s 间隔
    await new Promise(resolve => setTimeout(resolve, 2500))
  }

  throw new Error(i18n.t('auth.errors.loginTimeout'))
}

/**
 * 校验 token 是否仍有效（经同域 /api/auth/verify）。
 * - valid：服务端明确认定有效
 * - invalid：服务端明确认定无效，应退出本地登录态
 * - unknown：网络错误、5xx、无法解析等，不得据此清除 token（避免本地后端未启动时误删刚回跳的 token）
 */
export type LoginVerifyStatus = 'valid' | 'invalid' | 'unknown'

export async function checkLogin(token: string): Promise<LoginVerifyStatus> {
  try {
    const response = await fetch(`${AUTH_API_BASE_URL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      console.warn(i18n.t('auth.errors.checkLoginStatusFailed', { status: response.status }))
      return 'unknown'
    }

    const result = (await response.json()) as { valid?: boolean }
    if (result.valid === true) return 'valid'
    if (result.valid === false) return 'invalid'
    return 'unknown'
  } catch (error) {
    console.error(i18n.t('auth.errors.checkLoginException'), error)
    return 'unknown'
  }
}

/**
 * 获取用户信息（同域 POST /api/auth/user-info，由服务端转发上游，避免浏览器直连 api-web 跨域）
 */
export async function getUserInfo(token: string): Promise<UserInfo> {
  try {
    const response = await fetch(`${AUTH_API_BASE_URL}/user-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token,
      },
      body: '{}',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result: LoginResponse = await response.json()
    if (result.code === 1) {
      const u = normalizeKunqiongUserInfo(result.data)
      if (!u.avatar && !u.nickname) {
        throw new Error(i18n.t('auth.errors.getUserInfoFailed', { message: result.msg || 'empty user_info' }))
      }
      return u
    } else {
      throw new Error(i18n.t('auth.errors.getUserInfoFailed', { message: result.msg }))
    }
  } catch (error) {
    throw new Error(i18n.t('auth.errors.getUserInfoException', { error: error instanceof Error ? error.message : String(error) }))
  }
}

/**
 * 退出登录
 */
export async function logout(token: string): Promise<void> {
  try {
    const response = await fetch(`${AUTH_API_BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })

    const result: LoginResponse = await response.json()
    if (result.code !== 1) {
      throw new Error(i18n.t('auth.errors.logoutFailed', { message: result.msg }))
    }
  } catch (error) {
    throw new Error(i18n.t('auth.errors.logoutException', { error: error instanceof Error ? error.message : String(error) }))
  }
}

/**
 * 获取软件问题反馈页面链接
 */
export async function getFeedbackUrl(): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/soft_desktop/get_feedback_url`, {
      method: 'POST'
    })
    const result: LoginResponse = await response.json()
    if (result.code === 1) {
      return result.data.url
    } else {
      throw new Error(i18n.t('auth.errors.getFeedbackUrlFailed', { message: result.msg }))
    }
  } catch (error) {
    throw new Error(i18n.t('auth.errors.getFeedbackUrlException', { error: error instanceof Error ? error.message : String(error) }))
  }
}

/** Web 端本地存储键（localStorage）：登录令牌 */
export const AUTH_TOKEN_STORAGE_KEY = 'auth_token'
/** Web 端本地存储键：缓存的用户头像、昵称 JSON，与 token 配套 */
export const AUTH_USER_STORAGE_KEY = 'auth_user'
/**
 * 与《鲲穹 Web 登录实现说明》一致：未完成登录时保存 encodedNonce，刷新页面后可继续轮询。
 */
export const AUTH_LOGIN_NONCE_KEY = 'kq_login_nonce'

const STORAGE_USER = AUTH_USER_STORAGE_KEY

/**
 * 保存Token到本地存储
 */
export function saveToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
  try {
    localStorage.removeItem(AUTH_LOGIN_NONCE_KEY)
  } catch {
    /* ignore */
  }
}

/** 缓存用户信息，便于刷新页后仍先显示头像昵称（再异步校验 token） */
export function saveStoredUserInfo(user: UserInfo | null): void {
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_USER)
      return
    }
    const normalized = normalizeKunqiongUserInfo({ user_info: user })
    localStorage.setItem(STORAGE_USER, JSON.stringify(normalized))
  } catch {
    /* ignore */
  }
}

export function getStoredUserInfo(): UserInfo | null {
  try {
    const raw = localStorage.getItem(STORAGE_USER)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    const u = normalizeKunqiongUserInfo(parsed)
    if (!u.avatar && !u.nickname) return null
    return u
  } catch {
    return null
  }
}

/**
 * 获取本地保存的Token
 */
export function getToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
}

/**
 * 清除本地Token
 */
export function clearToken(): void {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
  localStorage.removeItem(STORAGE_USER)
  try {
    localStorage.removeItem(AUTH_LOGIN_NONCE_KEY)
  } catch {
    /* ignore */
  }
}

/** 取消登录流程或失败后清理挂起的 nonce（不删 token） */
export function clearPendingLoginNonce(): void {
  try {
    localStorage.removeItem(AUTH_LOGIN_NONCE_KEY)
  } catch {
    /* ignore */
  }
}
