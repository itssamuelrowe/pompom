/**
 * Build-time static site generation for the docs.
 *
 * Uses the shared renderer (src/docs/render) to turn the Markdown sources into
 * full HTML pages, then writes them into the Vite output directory (dist/docs)
 * so they deploy alongside the app. The same renderer serves docs in dev via a
 * Vite plugin, so dev and production output match.
 *
 * Run after `vite build` (see package.json "build").
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { renderDocs } from '../src/docs/render'

// Bundled and run from the web project directory (see run-prerender.mjs and the
// build:docs npm script), so cwd is the web root.
const ROOT = process.cwd()
const OUT_DIR = join(ROOT, 'dist/docs')

const docs = renderDocs(ROOT)
mkdirSync(OUT_DIR, { recursive: true })

for (const doc of docs) {
  const outFile = join(OUT_DIR, doc.fileName)
  writeFileSync(outFile, doc.html, 'utf8')
  console.log(`  docs: wrote ${outFile.replace(ROOT + '/', '')}`)
}

console.log(`Prerendered ${docs.length} docs page(s).`)
