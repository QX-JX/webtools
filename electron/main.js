const { app, BrowserWindow, Menu, ipcMain, shell, dialog } = require('electron')
const path = require('path')
const { fork, spawn } = require('child_process')
const net = require('net')
const fs = require('fs')

// 捕获未处理的异常，防止整个应用闪退
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
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

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer()

    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close(() => resolve(true))
    })

    server.listen(port, '127.0.0.1')
  })
}

function waitForServer(port, retries = 30) {
  return new Promise((resolve, reject) => {
    let tries = 0

    const check = () => {
      const client = new net.Socket()

      client.once('connect', () => {
        client.destroy()
        resolve()
      })

      client.once('error', () => {
        client.destroy()
        tries += 1
        if (tries > retries) {
          reject(new Error(`Server start timeout on port ${port}`))
          return
        }
        setTimeout(check, 1000)
      })

      client.connect(port, '127.0.0.1')
    }

    check()
  })
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
        path.join(process.resourcesPath, '..', 'app.ico')
      ]

  return possibleIcons.find((item) => fs.existsSync(item))
}

async function startServer() {
  const port = 3888
  const isPortAvailable = await checkPort(port)

  if (!isPortAvailable) {
    console.log(`Port ${port} is busy, assuming server is already running.`)
    return
  }

  const isDev = !app.isPackaged
  const serverPath = resolveServerPath(isDev)
  const staticPath = resolveStaticPath(isDev)

  if (!fs.existsSync(serverPath)) {
    throw new Error(`Server file not found: ${serverPath}`)
  }

  if (!fs.existsSync(staticPath)) {
    console.warn('Static files directory not found:', staticPath)
  }

  const serverDir = path.dirname(serverPath)
  const logPath = path.join(app.getPath('userData'), 'server.log')
  const logStream = fs.createWriteStream(logPath, { flags: 'a' })

  console.log('Environment:', isDev ? 'Development' : 'Production')
  console.log('Starting server from:', serverPath)
  console.log('Serving static files from:', staticPath)
  console.log('Server logs will be written to:', logPath)

  serverProcess = fork(serverPath, [], {
    cwd: serverDir,
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: isDev ? 'development' : 'production',
      STATIC_PATH: staticPath
    },
    stdio: 'pipe'
  })

  serverProcess.stdout?.pipe(logStream)
  serverProcess.stderr?.pipe(logStream)

  serverProcess.stdout?.on('data', (data) => {
    console.log(`Server: ${data}`)
  })

  serverProcess.stderr?.on('data', (data) => {
    console.error(`Server Error: ${data}`)
  })

  serverProcess.on('exit', (code, signal) => {
    console.log(`Server process exited with code ${code ?? 'null'} signal ${signal ?? 'null'}`)
    serverProcess = null
  })

  await waitForServer(port)
}

async function checkForUpdates(window) {
  const softwareId = '10020'
  const currentVersion = app.getVersion()
  const updateUrl = `http://software.kunqiongai.com:8000/api/v1/updates/check/?software=${softwareId}&version=${currentVersion}`

  console.log('Checking for updates:', updateUrl)

  try {
    const response = await fetch(updateUrl)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (!data.has_update) {
      console.log('No updates found.')
      return
    }

    console.log('Update found:', data)
    const choice = dialog.showMessageBoxSync(window, {
      type: 'info',
      buttons: ['Update now', 'Later'],
      title: 'New version found',
      message: `A new version ${data.version} is available. Update now?`,
      detail: data.update_log || 'This update contains fixes and experience improvements.'
    })

    if (choice === 0) {
      startUpdate(data)
    }
  } catch (error) {
    console.error('Failed to check for updates:', error)
  }
}

function startUpdate(updateInfo) {
  const updaterPath = app.isPackaged
    ? path.join(process.resourcesPath, 'updater.exe')
    : path.join(__dirname, 'updater.exe')

  const appDir = path.dirname(app.getPath('exe'))
  const exeName = path.basename(app.getPath('exe'))
  const pid = process.pid
  const args = [
    '--url', updateInfo.download_url,
    '--hash', updateInfo.package_hash,
    '--dir', appDir,
    '--exe', exeName,
    '--pid', pid.toString()
  ]

  console.log('Starting updater with args:', args)

  try {
    const subprocess = spawn(updaterPath, args, {
      detached: true,
      stdio: 'ignore'
    })

    subprocess.unref()
    app.quit()
  } catch (error) {
    console.error('Failed to start updater:', error)
    dialog.showErrorBox('Update failed', `Failed to start updater: ${error.message}`)
  }
}

function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow
  }

  const iconPath = resolveIconPath(!app.isPackaged)
  console.log('Icon Path:', iconPath || 'Using default icon')

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    center: true,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#f8fafc',
    icon: iconPath,
    title: 'Kunqiong WebTools',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: false
    }
  })

  Menu.setApplicationMenu(null)

  mainWindow.once('ready-to-show', () => {
    console.log('Main window ready-to-show')
    ensureWindowVisible()
  })

  mainWindow.on('show', () => console.log('Main window shown'))
  mainWindow.on('hide', () => console.log('Main window hidden'))
  mainWindow.on('minimize', () => console.log('Main window minimized'))
  mainWindow.on('restore', () => console.log('Main window restored'))
  mainWindow.on('close', () => console.log('Main window closing'))
  mainWindow.on('closed', () => {
    console.log('Main window closed')
    mainWindow = null
    if (!isQuitting && !appLoadedOnce && !startupRecovered) {
      startupRecovered = true
      console.log('Main window closed before app finished loading, recreating once...')
      setTimeout(() => {
        if (!isQuitting && BrowserWindow.getAllWindows().length === 0) {
          createWindow()
        }
      }, 400)
    }
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully')
    if (mainWindow.webContents.getURL() === currentAppUrl) {
      appLoadedOnce = true
    }
    ensureWindowVisible()
  })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL)
    if (validatedURL === currentAppUrl) {
      loadAttempts += 1
      if (loadAttempts >= 3) {
        const indexFile = resolveIndexFile(!app.isPackaged)
        const fileUrl = `file://${indexFile.replace(/\\/g, '/')}`
        console.log('Falling back to local file:', fileUrl)
        mainWindow.loadURL(fileUrl).catch((error) => {
          console.error('Fallback load failed:', error)
          scheduleReload()
        })
        return
      }
      scheduleReload()
    }
  })

  mainWindow.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    console.log(`Renderer console[${level}]: ${message} (${sourceId}:${line})`)
  })

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process gone:', details)
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.log('Blocked window open, opening in external browser:', url)
    shell.openExternal(url)
    return { action: 'deny' }
  })
 

  return mainWindow
}

function loadMainApp() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }

  // 开发环境优先使用 Vite 的地址；生产环境指向内置后端端口 3888
  currentAppUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3888'
  clearLoadRetryTimer()
  loadAttempts = 0

  console.log('Loading URL:', currentAppUrl)
  
  // 增加加载延迟，确保 Vite 已经准备好
  setTimeout(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    mainWindow.loadURL(currentAppUrl).catch((error) => {
      console.error('loadURL failed:', error)
      scheduleReload()
    })
  }, 1000)

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }
}

async function createWindow() {
  createMainWindow()

  try {
    await startServer()
    loadMainApp()

    /* 暂时禁用更新检查，防止因网络请求失败导致的闪退
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        checkForUpdates(mainWindow)
      }
    }, 3000)
    */
  } catch (error) {
    console.error('Failed to start server:', error)

    if (mainWindow && !mainWindow.isDestroyed()) {
      await mainWindow.loadURL(
        getLoadingUrl('Backend service failed to start. Please restart the application.')
      ).catch(() => {})
      ensureWindowVisible()
    }

    dialog.showErrorBox('Startup failed', `Backend service failed to start: ${error.message}`)
  }
}

ipcMain.handle('open-external', async (_event, url) => {
  try {
    console.log('Opening external URL:', url)
    await shell.openExternal(url)
    return { success: true }
  } catch (error) {
    console.error('Failed to open external URL:', error)
    return { success: false, error: error.message }
  }
})

app.on('second-instance', () => {
  if (!mainWindow) {
    createWindow()
    return
  }

  ensureWindowVisible()
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  } else {
    ensureWindowVisible()
  }
})

app.on('before-quit', () => {
  isQuitting = true
  clearLoadRetryTimer()
  if (serverProcess) {
    serverProcess.kill()
  }
})
