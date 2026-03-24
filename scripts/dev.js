import fs from 'fs'
import os from 'os'
import path from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import electron from 'electron'
import react from '@vitejs/plugin-react-swc'
import { createServer } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8').replace(/^\uFEFF/, ''))
const userDataDir = path.join(os.tmpdir(), 'kunqiong-webtools-dev-user-data')

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

/** 开发时 Vite 把 /api 代理到 3888；仅 esbuild 打包不会监听端口，必须单独 node 运行打包产物 */
let apiProcess = null

function startLocalApiServer() {
  const serverBundle = path.join(root, 'electron/server/index.mjs')
  let tries = 0
  const tryStart = () => {
    if (!fs.existsSync(serverBundle)) {
      tries += 1
      if (tries > 150) {
        log(
          'Timed out waiting for electron/server/index.mjs. Ensure esbuild (npm run dev:server) succeeded.',
          colors.red,
        )
        return
      }
      setTimeout(tryStart, 200)
      return
    }
    log('Starting local API server at http://127.0.0.1:3888 (required for login / user-info)...', colors.green)
    apiProcess = spawn(process.execPath, [serverBundle], {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' },
    })
    apiProcess.on('error', (err) => log(`API server spawn error: ${err}`, colors.red))
    apiProcess.on('exit', (code, signal) => {
      log(`Local API server exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`, colors.yellow)
    })
  }
  tryStart()
}

async function start() {
  try {
    log('Starting Vite dev server...', colors.blue)

    const viteServer = await createServer({
      configFile: false,
      root,
      base: './',
      define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(root, './src'),
          '@components': path.resolve(root, './src/components'),
          '@pages': path.resolve(root, './src/pages'),
          '@utils': path.resolve(root, './src/utils'),
          '@hooks': path.resolve(root, './src/hooks'),
          '@data': path.resolve(root, './src/data'),
          '@types': path.resolve(root, './src/types'),
          '@workers': path.resolve(root, './src/workers'),
        },
      },
      server: {
        host: '127.0.0.1',
        port: 5888,
        strictPort: false,
        proxy: {
          '/api': {
            target: 'http://localhost:3888',
            changeOrigin: true,
          },
          '/ws': {
            target: 'ws://localhost:3888',
            ws: true,
          },
        },
      },
      build: {
        target: 'esnext',
        minify: false,
        rollupOptions: {
          output: {
            chunkFileNames: 'assets/js/[name]-[hash].js',
            entryFileNames: 'assets/js/[name]-[hash].js',
            assetFileNames: 'assets/[ext]/[name]-[hash][extname]',
          },
        },
        chunkSizeWarningLimit: 2000,
        reportCompressedSize: false,
        cssCodeSplit: true,
        sourcemap: false,
      },
    })

    await viteServer.listen()

    const address = viteServer.httpServer?.address()
    const port = typeof address === 'string' ? 5888 : (address?.port ?? 5888)

    log(`Vite started at http://127.0.0.1:${port}`, colors.green)
    if (port !== 5888) {
      log(
        '注意：默认端口 5888 已被占用，当前使用上面地址。用浏览器开发时请打开该地址，不要用书签里的旧端口。',
        colors.yellow,
      )
    }

    log('Starting backend watcher...', colors.blue)
    const serverBuild = spawn('cmd', ['/c', 'npm', 'run', 'dev:server'], {
      cwd: root,
      stdio: 'inherit',
    })

    serverBuild.on('error', (error) => {
      log(`Backend watcher failed: ${error}`, colors.red)
    })

    serverBuild.on('close', (code, signal) => {
      log(`Backend watcher exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`, colors.yellow)
    })

    startLocalApiServer()

    log('Starting Electron...', colors.blue)
    const electronEnv = {
      ...process.env,
      VITE_DEV_SERVER_URL: `http://127.0.0.1:${port}`,
      KQ_USER_DATA_DIR: userDataDir,
    }

    delete electronEnv.ELECTRON_RUN_AS_NODE

    const electronProcess = spawn(electron, ['.'], {
      cwd: root,
      env: electronEnv,
      stdio: 'inherit',
    })

    electronProcess.on('error', (error) => {
      log(`Electron failed to start: ${error}`, colors.red)
    })

    electronProcess.on('close', (code, signal) => {
      log(`Electron exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`, colors.yellow)
      viteServer.close()
      if (!serverBuild.killed) {
        serverBuild.kill()
      }
      if (apiProcess && !apiProcess.killed) {
        try {
          apiProcess.kill()
        } catch {
          /* ignore */
        }
      }
      process.exit(code ?? 0)
    })
  } catch (error) {
    log(`Startup failed: ${error}`, colors.red)
    process.exit(1)
  }
}

start()
