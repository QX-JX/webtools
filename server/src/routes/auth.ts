import { Router, Request, Response } from 'express'
import { createHmac, randomBytes } from 'node:crypto'

const router = Router()

/** 远程 API 基址，可通过环境变量覆盖（便于内网/测试） */
const REMOTE_BASE_URL = process.env.KQ_API_BASE_URL?.replace(/\/$/, '') || 'https://api-web.kunqiongai.com'

/** 当远程接口不可用时，与产品约定一致的默认网页登录入口 */
const FALLBACK_WEB_LOGIN_URL = 'https://aitools.kunqiongai.com/login'
const FALLBACK_WEB_REGISTER_URL = 'https://aitools.kunqiongai.com/register'
const CLIENT_TYPE = 'desktop'
const AUTH_SECRET_KEY = process.env.KQ_AUTH_SECRET || '7530bfb1ad6c41627b0f0620078fa5ed'

type AnyRecord = Record<string, string | number | undefined | null>

function generateSignedNonce(): string {
  /** 与旧版前端一致：32 位十六进制随机串（不依赖 randomUUID，避免部分运行环境缺 API 导致 500） */
  const nonce = randomBytes(16).toString('hex')
  const timestamp = Math.floor(Date.now() / 1000)
  const message = `${nonce}|${timestamp}`
  const signature = createHmac('sha256', AUTH_SECRET_KEY).update(message).digest('base64')
  const payload = JSON.stringify({ nonce, timestamp, signature })
  return Buffer.from(payload)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function toFormUrlEncoded(data: AnyRecord): string {
  const params = new URLSearchParams()
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.set(key, String(value))
    }
  })
  return params.toString()
}

/**
 * 请求远程接口并解析 JSON。
 * 避免 response.json() 在返回 HTML/空体时直接抛错导致本地 500。
 */
async function postRemote(
  path: string,
  body?: AnyRecord,
  headers?: Record<string, string>,
): Promise<any> {
  const url = `${REMOTE_BASE_URL}${path}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'KunqiongWebTools-Server/1.0',
        ...(headers || {}),
      },
      /** 部分网关要求 urlencoded 时 body 不能为空字符串 */
      body: body !== undefined ? toFormUrlEncoded(body) : '',
      signal: controller.signal,
    })

    const text = await response.text()
    let data: unknown = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      const preview = text.slice(0, 240).replace(/\s+/g, ' ')
      throw new Error(`远程返回非 JSON (HTTP ${response.status}): ${preview}`)
    }

    if (!response.ok) {
      const msg =
        data && typeof data === 'object' && data !== null && 'msg' in data
          ? String((data as { msg?: unknown }).msg)
          : `HTTP ${response.status}`
      throw new Error(msg)
    }

    return data
  } finally {
    clearTimeout(timer)
  }
}

type KunqiongUserInfoFlat = { avatar: string; nickname: string }

/** 从上游 JSON 中抽出头像、昵称（与鲲穹主站账号体系字段兼容） */
function extractUserInfoFromUpstreamBody(result: Record<string, unknown>): KunqiongUserInfoFlat {
  const empty: KunqiongUserInfoFlat = { avatar: '', nickname: '' }
  if (result.code !== 1 || result.data == null || typeof result.data !== 'object') return empty
  const data = result.data as Record<string, unknown>
  const raw =
    data.user_info && typeof data.user_info === 'object'
      ? (data.user_info as Record<string, unknown>)
      : data

  const pick = (o: Record<string, unknown>, keys: string[]): string => {
    for (const k of keys) {
      const v = o[k]
      if (typeof v === 'string' && v.trim()) return v.trim()
    }
    return ''
  }

  let avatar = pick(raw, ['avatar', 'headimgurl', 'head_img', 'avatar_url', 'photo', 'user_avatar'])
  const nickname = pick(raw, ['nickname', 'nick_name', 'username', 'name'])

  if (avatar) {
    if (avatar.startsWith('//')) avatar = `https:${avatar}`
    else if (avatar.startsWith('/') && !/^https?:\/\//i.test(avatar)) {
      avatar = `https://www.kunqiongai.com${avatar}`
    }
  }

  return { avatar: avatar || '', nickname: nickname || '' }
}

function mergeUserInfo(a: KunqiongUserInfoFlat, b: KunqiongUserInfoFlat): KunqiongUserInfoFlat {
  return {
    avatar: a.avatar || b.avatar,
    nickname: a.nickname || b.nickname,
  }
}

/** 统一响应体中的 data.user_info，便于前端与主站展示一致 */
function withUnifiedUserInfo(
  template: Record<string, unknown>,
  userInfo: KunqiongUserInfoFlat,
): Record<string, unknown> {
  const data =
    template.data && typeof template.data === 'object'
      ? ({ ...(template.data as object) } as Record<string, unknown>)
      : {}
  return {
    ...template,
    data: {
      ...data,
      user_info: {
        avatar: userInfo.avatar,
        nickname: userInfo.nickname,
      },
    },
  }
}

async function getLoginUrlOrFallback(mode: 'login' | 'register'): Promise<string> {
  try {
    const result = await postRemote('/soft_desktop/get_web_login_url')
    if (result?.code === 1 && typeof result?.data?.login_url === 'string' && result.data.login_url.length > 0) {
      const loginUrl = result.data.login_url as string
      if (mode === 'register') {
        try {
          const parsed = new URL(loginUrl)
          parsed.pathname = '/register'
          return parsed.toString()
        } catch {
          return loginUrl.replace(/\/login\/?$/, '/register')
        }
      }
      return loginUrl
    }
  } catch (error) {
    console.warn('[auth] get_web_login_url 失败，使用兜底地址:', error)
  }
  return mode === 'register' ? FALLBACK_WEB_REGISTER_URL : FALLBACK_WEB_LOGIN_URL
}

/** GET /api/auth/signed-nonce — 与《鲲穹 Web 登录实现说明》契约一致，供前端或第三方直连 */
router.get('/signed-nonce', (_req: Request, res: Response) => {
  try {
    const encodedNonce = generateSignedNonce()
    return res.json({ code: 1, data: { encodedNonce } })
  } catch (error) {
    return res.json({ code: 0, msg: (error as Error).message || '生成 nonce 失败' })
  }
})

/**
 * GET /api/auth/login-url
 * 返回鲲穹侧基础登录地址；前端需自行拼接 client_type=desktop&client_nonce=<encodedNonce>
 */
router.get('/login-url', async (req: Request, res: Response) => {
  try {
    const mode = req.query.mode === 'register' ? 'register' : 'login'
    const baseUrl = await getLoginUrlOrFallback(mode)
    return res.json({ success: true, url: baseUrl })
  } catch (error) {
    return res.json({ success: false, msg: (error as Error).message || '获取登录地址失败' })
  }
})

/**
 * GET /api/auth/token?encodedNonce=...
 * 代理鲲穹 desktop_get_token，返回上游 JSON（含 code/msg/data.token）
 */
router.get('/token', async (req: Request, res: Response) => {
  try {
    const encodedNonce = String(req.query.encodedNonce || '').trim()
    if (!encodedNonce) {
      return res.status(400).json({ code: 0, msg: 'encodedNonce 不能为空' })
    }
    const tokenResp = await postRemote('/user/desktop_get_token', {
      client_type: CLIENT_TYPE,
      client_nonce: encodedNonce,
    })
    return res.json(tokenResp)
  } catch (error) {
    return res.status(500).json({ code: 0, msg: (error as Error).message || '代理请求失败' })
  }
})

router.post('/start', async (req: Request, res: Response) => {
  try {
    const mode = (req.body?.mode === 'register' ? 'register' : 'login') as 'login' | 'register'
    const clientNonce = generateSignedNonce()
    const baseLoginUrl = await getLoginUrlOrFallback(mode)
    const sep = baseLoginUrl.includes('?') ? '&' : '?'
    const fullUrl = `${baseLoginUrl}${sep}client_type=${CLIENT_TYPE}&client_nonce=${encodeURIComponent(clientNonce)}`
    return res.json({ login_url: fullUrl, client_nonce: clientNonce })
  } catch (error) {
    console.error('[auth] /start 异常:', error)
    return res.status(500).json({
      status: 'error',
      message: `启动登录失败: ${(error as Error).message}`,
      /** 兼容前端字段名 */
      login_url: null,
      client_nonce: null,
    })
  }
})

router.post('/poll', async (req: Request, res: Response) => {
  try {
    const clientNonce = String(req.body?.client_nonce || '').trim()
    if (!clientNonce) {
      return res.status(400).json({ status: 'error', message: 'client_nonce 不能为空' })
    }

    const tokenResp = await postRemote('/user/desktop_get_token', {
      client_type: CLIENT_TYPE,
      client_nonce: clientNonce,
    })

    if (tokenResp?.code !== 1 || !tokenResp?.data?.token) {
      return res.json({ status: 'pending' })
    }

    const token = String(tokenResp.data.token)
    const userResp = await postRemote('/soft_desktop/get_user_info', undefined, { token })
    if (userResp?.code !== 1 || !userResp?.data?.user_info) {
      return res.json({ status: 'error', message: userResp?.msg || '获取用户信息失败' })
    }

    return res.json({
      status: 'success',
      token,
      user_info: userResp.data.user_info,
    })
  } catch (error) {
    return res.json({ status: 'error', message: (error as Error).message || '轮询失败' })
  }
})

router.post('/verify', async (req: Request, res: Response) => {
  try {
    const token = String(req.body?.token || '').trim()
    if (!token) {
      return res.status(400).json({ valid: false, message: 'token 不能为空' })
    }
    const result = await postRemote('/user/check_login', { token })
    if (result?.code !== 1) {
      return res.json({ valid: false })
    }
    const userResp = await postRemote('/soft_desktop/get_user_info', undefined, { token })
    return res.json({
      valid: userResp?.code === 1,
      user_info: userResp?.code === 1 ? userResp?.data?.user_info : null,
    })
  } catch {
    return res.json({ valid: false })
  }
})

router.post('/get-web-login-url', async (_req: Request, res: Response) => {
  try {
    const result = await postRemote('/soft_desktop/get_web_login_url')
    if (
      result &&
      typeof result === 'object' &&
      result.code === 1 &&
      result.data &&
      typeof result.data.login_url === 'string' &&
      result.data.login_url.length > 0
    ) {
      return res.json(result)
    }
    console.warn('[auth] get_web_login_url 响应异常，使用降级地址:', result)
    return res.json({
      code: 1,
      msg: '成功',
      data: { login_url: FALLBACK_WEB_LOGIN_URL },
    })
  } catch (error) {
    console.error('[auth] get_web_login_url 代理失败:', error)
    /** 降级：仍返回 200，让前端能打开官方登录页并完成后续轮询 */
    return res.json({
      code: 1,
      msg: '成功',
      data: { login_url: FALLBACK_WEB_LOGIN_URL },
    })
  }
})

router.post('/desktop-get-token', async (req: Request, res: Response) => {
  try {
    const { client_type, client_nonce } = req.body as {
      client_type?: string
      client_nonce?: string
    }
    const result = await postRemote('/user/desktop_get_token', {
      client_type: client_type || 'desktop',
      client_nonce,
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ code: 0, msg: `代理请求失败: ${(error as Error).message}` })
  }
})

router.post('/check-login', async (req: Request, res: Response) => {
  try {
    const { token } = req.body as { token?: string }
    const result = await postRemote('/user/check_login', { token })
    res.json(result)
  } catch (error) {
    res.status(500).json({ code: 0, msg: `代理请求失败: ${(error as Error).message}` })
  }
})

router.post('/get-user-info', async (req: Request, res: Response) => {
  try {
    const { token } = req.body as { token?: string }
    const result = await postRemote('/soft_desktop/get_user_info', undefined, token ? { token } : undefined)
    res.json(result)
  } catch (error) {
    res.status(500).json({ code: 0, msg: `代理请求失败: ${(error as Error).message}` })
  }
})

/**
 * POST /api/auth/user-info
 * 优先合并主站常用接口 /user/user_all_info 与桌面接口 get_user_info，头像昵称与 https://www.kunqiongai.com 同源账号一致。
 */
router.post('/user-info', async (req: Request, res: Response) => {
  try {
    const headerTok = req.headers['token']
    const bodyTok = req.body && typeof req.body === 'object' ? (req.body as { token?: string }).token : undefined
    const token = String(headerTok || bodyTok || '')
      .trim()
      .replace(/^Bearer\s+/i, '')
    if (!token) {
      return res.status(400).json({ code: 0, msg: 'token 不能为空' })
    }

    let allInfo: Record<string, unknown> | null = null
    let desktopInfo: Record<string, unknown> | null = null

    try {
      allInfo = (await postRemote('/user/user_all_info', undefined, { token })) as Record<string, unknown>
    } catch (e) {
      console.warn('[auth] /user/user_all_info 请求失败:', e)
    }

    try {
      desktopInfo = (await postRemote('/soft_desktop/get_user_info', undefined, { token })) as Record<string, unknown>
    } catch (e) {
      console.warn('[auth] /soft_desktop/get_user_info 请求失败:', e)
    }

    const uAll = allInfo ? extractUserInfoFromUpstreamBody(allInfo) : { avatar: '', nickname: '' }
    const uDesk = desktopInfo ? extractUserInfoFromUpstreamBody(desktopInfo) : { avatar: '', nickname: '' }
    const merged = mergeUserInfo(uAll, uDesk)

    const base =
      allInfo?.code === 1
        ? allInfo
        : desktopInfo?.code === 1
          ? desktopInfo
          : null

    if (!merged.avatar && !merged.nickname) {
      const msg =
        base && typeof base.msg === 'string'
          ? base.msg
          : '获取用户信息失败'
      return res.json({ code: 0, msg })
    }

    const template =
      base && typeof base === 'object'
        ? { ...base }
        : { code: 1, msg: '成功', data: {} }
    return res.json(withUnifiedUserInfo(template as Record<string, unknown>, merged))
  } catch (error) {
    console.error('[auth] /user-info 异常:', error)
    return res.status(500).json({ code: 0, msg: `代理请求失败: ${(error as Error).message}` })
  }
})

router.post('/logout', async (req: Request, res: Response) => {
  try {
    const headerTok = req.headers['token']
    const bodyTok =
      req.body && typeof req.body === 'object' ? (req.body as { token?: string }).token : undefined
    const token = String(headerTok || bodyTok || '')
      .trim()
      .replace(/^Bearer\s+/i, '')
    const result = await postRemote('/logout', undefined, token ? { token } : undefined)
    res.json(result)
  } catch (error) {
    res.status(500).json({ code: 0, msg: `代理请求失败: ${(error as Error).message}` })
  }
})

export default router
