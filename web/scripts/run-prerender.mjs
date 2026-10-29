/**
 * Runner for the docs prerender step.
 *
 * The prerender entry is written in TSX and imports a React component, so it
 * cannot be executed by Node directly. Instead we use Vite (already a project
 * dependency) to bundle it into a single ESM file for SSR, then import and run
 * that bundle. This avoids pulling in an extra TS runtime like tsx or ts-node.
 */
import { build } from 'vite'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { rmSync } from 'node:fs'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const outDir = join(root, 'node_modules/.tmp/prerender')
const entry = join(here, 'prerender-docs.tsx')

await build({
  root,
  logLevel: 'warn',
  configFile: false,
  build: {
    ssr: true,
    outDir,
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      input: entry,
      output: { entryFileNames: 'prerender-docs.mjs' },
    },
  },
  // Bundle everything so the output is self-contained and runnable.
  ssr: { noExternal: true },
})

// Executing the bundle runs build() at module load and writes the HTML files.
const bundlePath = join(outDir, 'prerender-docs.mjs')
await import(pathToFileURL(bundlePath).href)

// The temp bundle is disposable.
rmSync(outDir, { recursive: true, force: true })
