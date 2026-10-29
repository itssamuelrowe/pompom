import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import type { RenderedDoc } from './src/docs/render.tsx'

const BASE = '/pompom/'

/**
 * GitHub Pages has no server-side SPA fallback, so a hard refresh or a shared
 * deep link (e.g. /pompom/analytics) would 404. Copying the built index.html to
 * 404.html makes Pages serve the app for any unknown path, letting React Router
 * take over client-side.
 */
function spaFallback(): Plugin {
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    closeBundle() {
      const index = resolve(import.meta.dirname, 'dist/index.html')
      const notFound = resolve(import.meta.dirname, 'dist/404.html')
      if (existsSync(index)) copyFileSync(index, notFound)
    },
  }
}

/**
 * Serve the Markdown docs in dev.
 *
 * The docs are prerendered to static HTML for production (see
 * scripts/prerender-docs.tsx), but that output only exists after a build. In
 * `vite dev` there is no dist/docs, so a request to /pompom/docs/ would fall
 * through to the SPA and React Router would redirect it to the app root. This
 * middleware renders the docs on the fly with the same shared renderer, so the
 * pages work in dev and pick up Markdown edits on each request. It must run
 * before Vite's SPA history fallback.
 */
function docsDevServer(): Plugin {
  return {
    name: 'docs-dev-server',
    apply: 'serve',
    configureServer(server) {
      // Registered in the config body (not a returned post hook) so it runs
      // before Vite's HTML/SPA-fallback middleware and can claim /docs paths.
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? ''
        // Strip query/hash and the Vite base to get a base-relative path.
        const path = url.split('?')[0].split('#')[0]
        let rel = path.startsWith(BASE) ? path.slice(BASE.length - 1) : path
        // Normalize "/docs" to the canonical "/docs/" home path.
        if (rel === '/docs') rel = '/docs/'
        if (!rel.startsWith('/docs')) return next()

        try {
          // Load the renderer through Vite's SSR loader so its TSX/JSX is
          // compiled, and so edits are reflected without a server restart.
          const mod = (await server.ssrLoadModule('/src/docs/render.tsx')) as {
            renderDocs: (root: string) => RenderedDoc[]
          }
          const docs = mod.renderDocs(process.cwd())

          const doc = docs.find((d) => d.routes.includes(rel))
          if (!doc) return next()

          res.statusCode = 200
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.end(doc.html)
        } catch (err) {
          next(err as Error)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: BASE,
  plugins: [react(), spaFallback(), docsDevServer()],
  // The docs are static, crawlable HTML pages prerendered from Markdown at
  // build time (see scripts/run-prerender.mjs) and written into dist/docs. In
  // dev they are served on the fly by docsDevServer above.
})
