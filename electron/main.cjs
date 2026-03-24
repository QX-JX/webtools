const { app, BrowserWindow, Menu, ipcMain, shell, dialog } = require('electron')
const path = require('path')
const { fork, spawn } = require('child_process')
const http = require('http')
const dns = require('dns')
const fs = require('fs')

// 鎹曡幏鏈鐞嗙殑寮傚父锛岄槻姝㈡暣涓簲鐢ㄩ棯閫€
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
})

if (process.env.KQ_USER_DATA_DIR) {
  fs.mkdirSync(process.env.KQ_USER_DATA_DIR, { recursive: true })
  app.setPath('userData', process.env.KQ_USER_DATA_DIR)
}

app.setAppUserModelId('com.kunqiong.webtools')
app.disableHardwareAcceleration()

const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
  app.quit()
}

let mainWindow = null
let serverProcess = null
let currentAppUrl = null
let loadRetryTimer = null
let isQuitting = false
let startupRecovered = false
let appLoadedOnce = false
let loadAttempts = 0

function createLoadingHtml(message = 'Starting Kunqiong WebTools...') {
  return `<!doctype html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Kunqiong WebTools</title>
      <style>
        :root { color-scheme: light; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: "Segoe UI", system-ui, sans-serif;
          background: linear-gradient(135deg, #eef2ff, #f8fafc 60%, #e0f2fe);
          color: #0f172a;
        }
        .card {
          width: min(420px, calc(100vw - 48px));
          padding: 28px 24px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
          text-align: center;
        }
        .spinner {
          width: 42px;
          height: 42px;
          margin: 0 auto 16px;
          border: 4px solid rgba(99, 102, 241, 0.15);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .title {
          font-size: 22px;
          font-weight: 600;
          margin-bottom: 10px;
        }
        .message {
          font-size: 14px;
          color: #475569;
          line-height: 1.6;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="spinner"></div>
        <div class="title">Kunqiong WebTools</div>
        <div class="message">${message}</div>
      </div>
    </body>
  </html>`
}

function getLoadingUrl(message) {
  return `data:text/html;charset=UTF-8,${encodeURIComponent(createLoadingHtml(message))}`
}

function ensureWindowVisible() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }

  mainWindow.setSkipTaskbar(false)
  mainWindow.show()
  mainWindow.moveTop()
  mainWindow.focus()
  mainWindow.flashFrame(true)

  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.flashFrame(false)
    }
  }, 1200)
}

function clearLoadRetryTimer() {
  if (loadRetryTimer) {
    clearTimeout(loadRetryTimer)
    loadRetryTimer = null
  }
}

function scheduleReload() {
  clearLoadRetryTimer()
  loadRetryTimer = setTimeout(() => {
    if (!mainWindow || mainWindow.isDestroyed() || !currentAppUrl) {
      return
    }

    console.log('Retrying to load app:', currentAppUrl)
    mainWindow.loadURL(currentAppUrl).catch((error) => {
      console.error('Retry load failed:', error)
      scheduleReload()
    })
  }, 1500)
}

/**
 * 仅 TCP 连通不足以说明 Vite 已能响应 HTTP；过早 loadURL 易出现 ERR_FAILED(-2)。
 * 这里对开发地址发 GET /，直到收到任意 HTTP 响应头。
 */
function waitForHttpDevServer(
  baseUrl,
  { maxAttempts = 120, intervalMs = 400 } = {},
) {
  return new Promise((resolve, reject) => {
    const u = new URL(baseUrl)
    const port = Number(u.port || (u.protocol === 'https:' ? 443 : 80))
    if (!port) {
      reject(new Error(`Invalid dev server URL: ${baseUrl}`))
      return
    }

    let attempt = 0

    const ping = () => {
      /** Vite 仅监听 127.0.0.1 时，对 localhost 的探测须走 IPv4，否则会连到 ::1 导致永远失败 */
      const lookup =
        u.hostname === 'localhost'
          ? (hostname, _opts, cb) => {
              dns.lookup(hostname, { family: 4 }, cb)
            }
          : undefined

      const req = http.request(
        {
          hostname: u.hostname,
          port,
          path: '/',
          method: 'GET',
          timeout: 8000,
          ...(lookup ? { lookup } : {}),
          headers: {
            Connection: 'close',
            Accept: 'text/html,application/xhtml+xml,*/*',
          },
        },
        (res) => {
          res.resume()
          resolve()
        },
      )

      req.on('error', () => {
        attempt += 1
        if (attempt >= maxAttempts) {
          reject(new Error(`Dev server HTTP not ready: ${baseUrl}`))
          return
        }
        setTimeout(ping, intervalMs)
      })

      req.on('timeout', () => {
        req.destroy()
        attempt += 1
        if (attempt >= maxAttempts) {
          reject(new Error(`Dev server HTTP timeout: ${baseUrl}`))
          return
        }
        setTimeout(ping, intervalMs)
      })

      req.end()
    }

    ping()
  })
}

function alternateLocalhostUrl(urlString) {
  try {
    const u = new URL(urlString)
    if (u.hostname === '127.0.0.1') {
      u.hostname = 'localhost'
      return u.toString()
    }
    if (u.hostname === 'localhost') {
      u.hostname = '127.0.0.1'
      return u.toString()
    }
  } catch {
    /* ignore */
  }
  return null
}

function resolveServerPath(isDev) {
  const possiblePaths = isDev
    ? [
        path.join(__dirname, 'server/index.mjs'),
        path.join(__dirname, 'server/index.js')
      ]
    : [
        path.join(process.resourcesPath, 'server/index.mjs'),
        path.join(process.resourcesPath, 'server/index.js'),
        path.join(process.resourcesPath, 'server/dist/index.js')
      ]

  return possiblePaths.find((item) => fs.existsSync(item)) || possiblePaths[0]
}

function resolveStaticPath(isDev) {
  return isDev
    ? path.join(__dirname, 'dist')
    : path.join(process.resourcesPath, 'dist')
}

function resolveIndexFile(isDev) {
  return path.join(resolveStaticPath(isDev), 'index.html')
}

function resolveIconPath(isDev) {
  const possibleIcons = isDev
    ? [path.join(__dirname, 'app.ico')]
    : [
        path.join(process.resourcesPath, 'app.ico'),
        path.join(process.resourcesPath, 'buildResources', 'icon.ico'),
        path.join(app.getAppPath(), '..', 'app.ico'),
      ]

  return possibleIcons.find((item) => fs.existsSync(item)) || possibleIcons[0]
}

function getAppUrl() {
  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) {
    return devUrl
  }

  const indexFile = resolveIndexFile(false)
  return `file://${indexFile}`
}

/** 开发模式：直到 Vite 能对 GET / 返回 HTTP 响应，再继续 loadURL */
async function waitForDevServer(url) {
  await waitForHttpDevServer(url)
}

function startServerIfNeeded() {
  const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)
  if (isDev) {
    return
  }

  const serverPath = resolveServerPath(false)
  if (!fs.existsSync(serverPath)) {
    console.warn('Server bundle not found:', serverPath)
    return
  }

  serverProcess = fork(serverPath, [], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  })

  serverProcess.on('exit', (code, signal) => {
    console.log('Server process exited:', { code, signal })
    serverProcess = null
  })
}

function createWindow() {
  const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)
  const icon = resolveIconPath(isDev)

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: false
    }
  })

  currentAppUrl = getAppUrl()

  // 生产模式先显示 data: 占位页；开发模式在下方先等 Vite 端口再 loadURL（避免长 data URL 在 Windows 上触发 ERR_FAILED）。
  if (!isDev) {
    mainWindow.loadURL(getLoadingUrl('Loading application...')).catch((error) => {
      console.error('Failed to load initial loading page:', error)
    })
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.on('did-finish-load', () => {
    appLoadedOnce = true
    startupRecovered = false
    loadAttempts = 0
    clearLoadRetryTimer()
  })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    if (!currentAppUrl) {
      return
    }

    console.error('Main window failed to load:', { errorCode, errorDescription, url: currentAppUrl })

    if (!startupRecovered && loadAttempts < 8) {
      startupRecovered = true
      loadAttempts += 1
      scheduleReload()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (isDev) {
    // 不在此加载长 data: 占位页：Windows 上部分 Electron/Chromium 版本对超长 data URL 会报 ERR_FAILED(-2)。
    // 顺序：先等 Vite 能响应 HTTP，再 loadURL（带重试与 localhost/127.0.0.1 互换）。
    const loadDevApp = async () => {
      if (!mainWindow || mainWindow.isDestroyed()) return

      const candidates = [currentAppUrl]
      const alt = alternateLocalhostUrl(currentAppUrl)
      if (alt) {
        candidates.push(alt)
      }

      const maxPerUrl = 10
      for (const url of candidates) {
        for (let i = 0; i < maxPerUrl; i++) {
          if (!mainWindow || mainWindow.isDestroyed()) return
          try {
            await mainWindow.loadURL(url)
            return
          } catch (error) {
            const msg = error && error.message ? error.message : String(error)
            console.warn(`[dev] loadURL attempt ${i + 1}/${maxPerUrl} (${url}):`, msg)
            await new Promise((r) => setTimeout(r, 300 + i * 120))
          }
        }
      }

      throw new Error(`Failed to load dev app after retries: ${candidates.join(' , ')}`)
    }

    waitForDevServer(currentAppUrl)
      .then(loadDevApp)
      .catch((error) => {
        console.error('Dev server unavailable:', error)
        if (!mainWindow || mainWindow.isDestroyed()) return
        const shortHtml =
          '<!doctype html><meta charset="utf-8"><title>Kunqiong</title><body style="font:14px system-ui;padding:24px">' +
          '<p>开发服务器未就绪或地址错误。</p><p>请看运行 <code>npm run dev</code> 的终端里 <strong>Vite started at http://127.0.0.1:端口</strong>，' +
          '浏览器必须使用<strong>同一端口</strong>（若 5888 被占用则会是 5889 等）。</p></body>'
        mainWindow
          .loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(shortHtml)}`)
          .catch((e) => console.error('Failed to load error placeholder:', e))
      })
  } else {
    startServerIfNeeded()
    mainWindow.loadURL(currentAppUrl).catch((error) => {
      console.error('Failed to load app URL:', error)
    })
  }
}

Menu.setApplicationMenu(null)

ipcMain.handle('open-external', async (_event, url) => {
  if (!url) return false
  await shell.openExternal(url)
  return true
})

app.on('second-instance', () => {
  ensureWindowVisible()
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      ensureWindowVisible()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  isQuitting = true
  clearLoadRetryTimer()

  if (serverProcess && !serverProcess.killed) {
    try {
      serverProcess.kill()
    } catch (error) {
      console.error('Failed to kill server process:', error)
    }
  }
})
