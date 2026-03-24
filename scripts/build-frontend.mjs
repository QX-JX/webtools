import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { build } from 'esbuild'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir = path.join(root, 'temp_build')
const publicDir = path.join(root, 'public')
const srcDir = path.join(root, 'src')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8').replace(/^\uFEFF/, ''))

await fs.promises.rm(outDir, { recursive: true, force: true })
await fs.promises.mkdir(path.join(outDir, 'assets', 'js'), { recursive: true })
await fs.promises.mkdir(path.join(outDir, 'assets', 'css'), { recursive: true })

const aliasMap = {
  '@': path.join(root, 'src'),
  '@components': path.join(root, 'src', 'components'),
  '@pages': path.join(root, 'src', 'pages'),
  '@utils': path.join(root, 'src', 'utils'),
  '@hooks': path.join(root, 'src', 'hooks'),
  '@data': path.join(root, 'src', 'data'),
  '@types': path.join(root, 'src', 'types'),
  '@workers': path.join(root, 'src', 'workers'),
}

const cssPlugin = {
  name: 'css-postcss',
  setup(buildApi) {
    buildApi.onLoad({ filter: /\.css$/ }, async (args) => {
      const source = await fs.promises.readFile(args.path, 'utf8')
      const result = await postcss([
        tailwindcss(path.join(root, 'tailwind.config.js')),
        autoprefixer(),
      ]).process(source, {
        from: args.path,
      })

      return {
        contents: result.css,
        loader: 'css',
        resolveDir: path.dirname(args.path),
      }
    })
  },
}

const aliasPlugin = {
  name: 'alias',
  setup(buildApi) {
    for (const [key, target] of Object.entries(aliasMap)) {
      buildApi.onResolve({ filter: new RegExp(`^${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:/.*)?$`) }, (args) => {
        const suffix = args.path.slice(key.length).replace(/^\//, '')
        const resolved = suffix ? path.join(target, suffix) : target
        return { path: resolved }
      })
    }
  },
}

const result = await build({
  absWorkingDir: root,
  entryPoints: [path.join(srcDir, 'main.tsx')],
  outdir: path.join(outDir, 'assets', 'js'),
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'browser',
  target: ['esnext'],
  jsx: 'automatic',
  sourcemap: false,
  minify: false,
  entryNames: '[name]-[hash]',
  chunkNames: '[name]-[hash]',
  assetNames: '../[ext]/[name]-[hash]',
  metafile: true,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  loader: {
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.svg': 'file',
    '.gif': 'file',
    '.webp': 'file',
    '.ico': 'file',
    '.json': 'json',
  },
  plugins: [aliasPlugin, cssPlugin],
  logLevel: 'info',
})

const outputs = Object.keys(result.metafile.outputs)
const entryJs = outputs.find((file) => file.endsWith('.js') && result.metafile.outputs[file].entryPoint?.endsWith('src/main.tsx'))
const entryCss = outputs.find((file) => file.endsWith('.css'))

if (!entryJs) {
  throw new Error('Failed to locate built JS entry file')
}

const relativeEntryJs = path.relative(outDir, path.resolve(root, entryJs)).replace(/\\/g, '/')
const relativeEntryCss = entryCss
  ? path.relative(outDir, path.resolve(root, entryCss)).replace(/\\/g, '/')
  : null

const indexHtml = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/x-icon" href="./app.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>全能站长工具 - 专业的在线站长工具箱</title>
    <meta name="description" content="全能站长工具提供CSR生成、WHOIS查询、DNS解析、SSL检测、HTTP状态检测等专业站长工具" />
    <link rel="manifest" href="./manifest.json" />
    <meta name="theme-color" content="#3b82f6" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="全能站长工具" />
    <link rel="apple-touch-icon" href="./app.ico" />
    ${relativeEntryCss ? `<link rel="stylesheet" href="./${relativeEntryCss}">` : ''}
    <script type="module" src="./${relativeEntryJs}"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`

await fs.promises.writeFile(path.join(outDir, 'index.html'), indexHtml, 'utf8')

for (const fileName of await fs.promises.readdir(publicDir)) {
  const source = path.join(publicDir, fileName)
  const target = path.join(outDir, fileName)
  await fs.promises.cp(source, target, { recursive: true, force: true })
}
