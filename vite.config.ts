import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'
import pkg from './package.json'

export default defineConfig(({ mode }) => {
  return {
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version)
    },
    base: './',
    plugins: [
      react()
    ],
    resolve: {
      alias: {
        '@': resolve(process.cwd(), './src'),
        '@components': resolve(process.cwd(), './src/components'),
        '@pages': resolve(process.cwd(), './src/pages'),
        '@utils': resolve(process.cwd(), './src/utils'),
        '@hooks': resolve(process.cwd(), './src/hooks'),
        '@data': resolve(process.cwd(), './src/data'),
        '@types': resolve(process.cwd(), './src/types'),
        '@workers': resolve(process.cwd(), './src/workers')
      }
    },
    server: {
      port: 5888,
      proxy: {
        '/api': {
          target: 'http://localhost:3888',
          changeOrigin: true
        },
        '/ws': {
          target: 'ws://localhost:3888',
          ws: true
        }
      }
    },
    build: {
      target: 'esnext',
      minify: false,
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash][extname]'
        }
      },
      chunkSizeWarningLimit: 2000,
      reportCompressedSize: false,
      cssCodeSplit: true,
      sourcemap: false
    }
  }
})
