import { resolve, join } from 'path'
import { cpSync, existsSync, readFileSync } from 'fs'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import nodeResolve from '@rollup/plugin-node-resolve'
import type { Plugin } from 'vite'

const EXCALIDRAW_FONTS_DIR = resolve(
  'node_modules/@excalidraw/excalidraw/dist/prod/fonts'
)

function excalidrawFontsPlugin(): Plugin {
  return {
    name: 'excalidraw-fonts',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/fonts/')) return next()
        const filePath = join(EXCALIDRAW_FONTS_DIR, req.url.slice('/fonts'.length))
        if (existsSync(filePath)) {
          res.setHeader('Content-Type', 'font/woff2')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(readFileSync(filePath))
        } else {
          next()
        }
      })
    },
    writeBundle(options) {
      const outDir = options.dir ?? resolve('out/renderer')
      const dest = resolve(outDir, 'fonts')
      if (existsSync(EXCALIDRAW_FONTS_DIR)) {
        cpSync(EXCALIDRAW_FONTS_DIR, dest, { recursive: true })
      }
    }
  }
}

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({ exclude: ['drizzle-orm'] }),
      nodeResolve({ exportConditions: ['node'] })
    ],
    build: {
      rollupOptions: {
        external: ['better-sqlite3']
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [
      tailwindcss(),
      react(),
      excalidrawFontsPlugin()
    ]
  }
})
