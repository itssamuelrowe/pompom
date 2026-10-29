/**
 * Shared docs rendering pipeline.
 *
 * Turns the Markdown sources in src/docs/content into full static HTML pages
 * using the React DocLayout. This module is pure with respect to output: it
 * reads the Markdown files and returns rendered pages, but writes nothing. Both
 * the build-time prerender script and the dev-server Vite plugin use it, so the
 * docs are generated the same way in development and production.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { Marked } from 'marked'
import matter from 'gray-matter'
import DocLayout, {
  type DocPage,
  type NavItem,
  type PagerLink,
} from './DocLayout'

export interface FrontMatter {
  slug: string
  navLabel: string
  pageTitle: string
  description: string
  ogType?: string
  order: number
  jsonLd?: unknown
  prev?: PagerLink
  next?: PagerLink
}

/** A rendered docs page and the URLs it should be served/written at. */
export interface RenderedDoc {
  slug: string
  /** Output file name relative to the docs dir, e.g. "index.html". */
  fileName: string
  /** Dev-server request paths that should resolve to this page. */
  routes: string[]
  html: string
}

/**
 * A Markdown renderer with small custom extensions:
 *  - Container blocks: `::: grid|callout|card|settings` ... `:::`
 *  - CTA links: `[label](href){.cta}` adds the cta class to the link
 *  - `settings` containers turn a bold-led list into a <dl> definition list.
 */
function createRenderer(): Marked {
  const marked = new Marked({ gfm: true })

  marked.use({
    extensions: [
      {
        name: 'attrLink',
        level: 'inline',
        start(src: string) {
          return src.indexOf('[')
        },
        tokenizer(src: string) {
          const rule = /^\[([^\]]+)\]\(([^)]+)\)\{\.([a-z0-9-]+)\}/
          const match = rule.exec(src)
          if (!match) return undefined
          return {
            type: 'attrLink',
            raw: match[0],
            text: match[1],
            href: match[2],
            className: match[3],
          }
        },
        renderer(token) {
          const t = token as unknown as {
            href: string
            text: string
            className: string
          }
          return `<a class="${t.className}" href="${t.href}">${t.text}</a>`
        },
      },
    ],
  })

  return marked
}

function renderInner(marked: Marked, body: string): string {
  return marked.parse(body, { async: false }) as string
}

/**
 * Convert a bold-led bullet list into <dl> pairs. Each list item is expected to
 * look like: `**Term** description text`.
 */
function listToDefinitionList(marked: Marked, body: string): string {
  const items = body
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith('- '))
    .map((l) => l.slice(2))

  const pairs = items
    .map((item) => {
      const m = /^\*\*(.+?)\*\*\s*(.*)$/.exec(item)
      if (!m) return ''
      const term = m[1]
      const desc = renderInner(marked, m[2]).replace(/^<p>|<\/p>\s*$/g, '')
      return `<dt>${term}</dt><dd>${desc}</dd>`
    })
    .join('')

  return `<dl class="settings">${pairs}</dl>`
}

/**
 * Expand `::: name ... :::` container directives into styled <div>/<dl> blocks.
 * Container HTML is never fed through Markdown's block parser (which would wrap
 * a lone block-level element in a stray <p>).
 */
function renderWithContainers(marked: Marked, source: string): string {
  const containerRe =
    /^:::[ \t]*(grid|callout|card|settings)[ \t]*\n([\s\S]*?)\n:::[ \t]*$/gm
  let out = ''
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = containerRe.exec(source)) !== null) {
    const before = source.slice(lastIndex, match.index)
    if (before.trim()) out += renderInner(marked, before)

    const name = match[1]
    const inner = match[2]
    if (name === 'settings') {
      out += listToDefinitionList(marked, inner)
    } else {
      out += `<div class="${name}">${renderInner(marked, inner)}</div>`
    }
    lastIndex = containerRe.lastIndex
  }

  const rest = source.slice(lastIndex)
  if (rest.trim()) out += renderInner(marked, rest)
  return out
}

/**
 * Read and render every Markdown doc under src/docs/content into full HTML.
 * `root` is the web project directory (where src/ lives).
 */
export function renderDocs(root: string): RenderedDoc[] {
  const contentDir = join(root, 'src/docs/content')
  const marked = createRenderer()

  const files = readdirSync(contentDir).filter((f) => f.endsWith('.md'))
  const parsed = files.map((file) => {
    const raw = readFileSync(join(contentDir, file), 'utf8')
    const { data, content } = matter(raw)
    const fm = data as FrontMatter
    const bodyHtml = renderWithContainers(marked, content)
    return { fm, bodyHtml }
  })

  const nav: NavItem[] = parsed
    .slice()
    .sort((a, b) => a.fm.order - b.fm.order)
    .map(({ fm }) => ({
      slug: fm.slug,
      label: fm.navLabel,
      href:
        fm.slug === 'index' ? '/pompom/docs/' : `/pompom/docs/${fm.slug}.html`,
    }))

  return parsed.map(({ fm, bodyHtml }) => {
    const page: DocPage = {
      slug: fm.slug,
      navLabel: fm.navLabel,
      pageTitle: fm.pageTitle,
      description: fm.description,
      ogType: fm.ogType,
      jsonLd: fm.jsonLd,
      prev: fm.prev,
      next: fm.next,
      bodyHtml,
    }
    const html =
      '<!doctype html>\n' +
      renderToStaticMarkup(createElement(DocLayout, { page, nav }))

    const isIndex = fm.slug === 'index'
    const fileName = isIndex ? 'index.html' : `${fm.slug}.html`
    // Dev routes (under the Vite base): directory + index.html for home,
    // and both the bare slug and the .html form for the rest.
    const routes = isIndex
      ? ['/docs/', '/docs/index.html']
      : [`/docs/${fm.slug}.html`, `/docs/${fm.slug}`]

    return { slug: fm.slug, fileName, routes, html }
  })
}
