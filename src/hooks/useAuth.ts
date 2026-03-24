import { useState, useEffect, useCallback, useRef } from 'react'
import { isElectronRuntime } from '../config/api'
import {
  startAuthFlow,
  pollToken,
  checkLogin,
  getUserInfo,
  logout,
  saveToken,
  getToken,
  clearToken,
  saveStoredUserInfo,
  getStoredUserInfo,
  clearPendingLoginNonce,
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
  AUTH_LOGIN_NONCE_KEY,
  UserInfo
} from '../utils/auth'

export interface AuthState {
  isLoggedIn: boolean
  userInfo: UserInfo | null
  token: string | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isLoggedIn: false,
    userInfo: getStoredUserInfo(),
    token: getToken(),
    loading: false,
    error: null
  })

  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const cancelLoginRef = useRef(false)

  // 初始化时检查登录状态（官网是 Cookie；本地必须用 token + 缓存用户信息）
  useEffect(() => {
    const initAuth = async () => {
      const token = getToken()
      if (!token) {
        setState(prev => ({
          ...prev,
          isLoggedIn: false,
          userInfo: null,
          token: null
        }))
        return
      }

      clearPendingLoginNonce()

      try {
        const userInfo = await getUserInfo(token)
        saveStoredUserInfo(userInfo)
        setState(prev => ({
          ...prev,
          isLoggedIn: true,
          userInfo,
          token
        }))
        return
      } catch {
        /* 继续校验 token */
      }

      const verify = await checkLogin(token)
      if (verify === 'valid') {
        try {
          const userInfo = await getUserInfo(token)
          saveStoredUserInfo(userInfo)
          setState(prev => ({
            ...prev,
            isLoggedIn: true,
            userInfo,
            token
          }))
        } catch {
          const cached = getStoredUserInfo()
          setState(prev => ({
            ...prev,
            isLoggedIn: true,
            userInfo: cached,
            token
          }))
        }
        return
      }

      if (verify === 'invalid') {
        clearToken()
        setState(prev => ({
          ...prev,
          isLoggedIn: false,
          userInfo: null,
          token: null
        }))
        return
      }

      // unknown：本地 /api 未启动、网关错误等，不能当作「未登录」清 token（否则官网回跳后永远拿不到头像）
      const cached = getStoredUserInfo()
      setState(prev => ({
        ...prev,
        isLoggedIn: true,
        userInfo: cached,
        token
      }))
    }

    void initAuth()

    // 监听 localStorage：新标签完成鲲穹登录回跳并写入 token 后，本页同步为已登录（与 www.kunqiongai.com 同源账号）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUTH_TOKEN_STORAGE_KEY || e.key === AUTH_USER_STORAGE_KEY) {
        void initAuth()
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void initAuth()
    }

    window.addEventListener('storage', handleStorageChange)
    document.addEventListener('visibilitychange', handleVisibility)

    // Electron：高频轮询新窗口登录；Web：较低频重试，便于后端晚于 Vite 启动后仍能拉到头像昵称
    const interval = isElectronRuntime
      ? setInterval(initAuth, 1000)
      : setInterval(initAuth, 8000)
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  /** 刷新后若存在未完成的 nonce，自动继续轮询（与鲲穹文档 resumePendingLogin 一致） */
  useEffect(() => {
    if (getToken()) return
    const nonce = typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_LOGIN_NONCE_KEY) : null
    if (!nonce?.trim()) return
    let cancelled = false
    setIsLoggingIn(true)
    setState(prev => ({ ...prev, loading: true, error: null }))

    const finalize = async (newToken: string) => {
      saveToken(newToken)
      const userInfo = await getUserInfo(newToken)
      saveStoredUserInfo(userInfo)
      setState(prev => ({
        ...prev,
        isLoggedIn: true,
        userInfo,
        token: newToken,
        loading: false,
        error: null,
      }))
    }

    void (async () => {
      try {
        const newToken = await pollToken(nonce.trim(), 180, () => cancelled)
        await finalize(newToken)
      } catch (e) {
        clearPendingLoginNonce()
        const errorMsg = e instanceof Error ? e.message : '登录失败'
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMsg,
        }))
      } finally {
        if (!cancelled) setIsLoggingIn(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const runLoginFlow = useCallback(async (mode: 'login' | 'register' = 'login') => {
    setIsLoggingIn(true)
    cancelLoginRef.current = false
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // 1. 启动登录流程，由后端返回完整登录地址与 client_nonce
      const { loginUrl, clientNonce } = await startAuthFlow(mode)

      // 2. 打开登录网页
      if (window.electron?.openExternal) {
        await window.electron.openExternal(loginUrl)
      } else {
        window.open(loginUrl, '_blank', 'noopener,noreferrer')
      }

      // 3. 轮询获取Token（文档建议 3 分钟内完成）
      const token = await pollToken(clientNonce, 180, () => cancelLoginRef.current)

      // 4. 保存Token并获取用户信息
      saveToken(token)
      const userInfo = await getUserInfo(token)
      saveStoredUserInfo(userInfo)

      setState(prev => ({
        ...prev,
        isLoggedIn: true,
        userInfo,
        token,
        loading: false,
        error: null
      }))
    } catch (error) {
      clearPendingLoginNonce()
      const errorMsg = error instanceof Error ? error.message : '登录失败'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMsg
      }))
    } finally {
      setIsLoggingIn(false)
    }
  }, [])

  /** Web 与 Electron 统一：后端代理鲲穹 + 新窗口登录 + 轮询 token（见 kunqiong-web-login-integration-guide） */
  const login = useCallback(async () => {
    await runLoginFlow('login')
  }, [runLoginFlow])

  const register = useCallback(async () => {
    await runLoginFlow('register')
  }, [runLoginFlow])

  const handleLogout = useCallback(async () => {
    if (!state.token) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      await logout(state.token)
      clearToken()
      saveStoredUserInfo(null)
      setState(prev => ({
        ...prev,
        isLoggedIn: false,
        userInfo: null,
        token: null,
        loading: false,
        error: null
      }))
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '退出登录失败'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMsg
      }))
    }
  }, [state.token])

  const cancelLoginFlow = useCallback(() => {
    cancelLoginRef.current = true
    clearPendingLoginNonce()
  }, [])

  return {
    ...state,
    login,
    register,
    logout: handleLogout,
    cancelLogin: cancelLoginFlow,
    isLoggingIn
  }
}
