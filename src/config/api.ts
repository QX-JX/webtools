// 检测是否在 Electron 环境中（桌面端仍用 /start + 轮询；浏览器走官网 returnUrl 回跳）
export const isElectronRuntime =
  typeof window !== 'undefined' &&
  (((window as unknown as { process?: { type?: string } }).process?.type === 'renderer' ||
    window.navigator.userAgent.includes('Electron')))

const isElectron = isElectronRuntime

// API 基础路径
// 在 Electron 中强制使用 localhost:3888
// 在 Web 开发环境中由 Vite 代理处理 (为空字符串)
export const API_BASE_URL = isElectron ? 'http://localhost:3888' : ''

console.log('[Config] Environment:', isElectron ? 'Electron' : 'Web')
console.log('[Config] API Base URL:', API_BASE_URL)
