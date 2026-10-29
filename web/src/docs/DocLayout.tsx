import type { ReactNode } from 'react'

const SITE = 'https://itssamuelrowe.github.io'
const BASE = '/pompom/'

export interface PagerLink {
  href: string
  label: string
}

export interface DocPage {
  slug: string
  navLabel: string
  pageTitle: string
  description: string
  ogType?: string
  jsonLd?: unknown
  prev?: PagerLink
  next?: PagerLink
  /** The Markdown body, already rendered to an HTML string. */
  bodyHtml: string
}

export interface NavItem {
  href: string
  label: string
  slug: string
}

interface DocLayoutProps {
  page: DocPage
  nav: NavItem[]
}

/** Absolute docs URL for a page, used for canonical and og:url. */
function docUrl(slug: string): string {
  const file = slug === 'index' ? '' : `${slug}.html`
  return `${SITE}${BASE}docs/${file}`
}

/**
 * Resolve a pager href (relative to the docs folder) to a site path. The home
 * page is linked as the directory URL to match its canonical form.
 */
function pagerUrl(href: string): string {
  if (href === 'index.html') return `${BASE}docs/`
  return `${BASE}docs/${href}`
}

/**
 * The full static HTML document for a single docs page. Rendered to a string at
 * build time with renderToStaticMarkup, so there is no client-side React here.
 */
export default function DocLayout({ page, nav }: DocLayoutProps): ReactNode {
  const canonical = docUrl(page.slug)
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{page.pageTitle}</title>
        <meta name="description" content={page.description} />
        <link rel="canonical" href={canonical} />
        <meta name="theme-color" content="#e5484d" />
        <link rel="icon" type="image/png" href={`${BASE}logo.png`} />
        <link rel="stylesheet" href={`${BASE}docs.css`} />
        <meta property="og:type" content={page.ogType ?? 'article'} />
        <meta property="og:title" content={page.pageTitle} />
        <meta property="og:description" content={page.description} />
        <meta property="og:url" content={canonical} />
        {page.jsonLd ? (
          <script
            type="application/ld+json"
            // The JSON-LD is authored by us in frontmatter, not user input.
            dangerouslySetInnerHTML={{ __html: JSON.stringify(page.jsonLd) }}
          />
        ) : null}
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site">
          <div className="inner">
            <a className="brand" href={BASE}>
              <img src={`${BASE}logo.png`} alt="" />
              PomPom
            </a>
            <nav aria-label="Documentation">
              {nav.map((item) => (
                <a
                  key={item.slug}
                  href={item.href}
                  aria-current={item.slug === page.slug ? 'page' : undefined}
                >
                  {item.label}
                </a>
              ))}
              <a href={BASE}>Open app</a>
            </nav>
          </div>
        </header>

        <main
          id="main"
          // bodyHtml is produced by our Markdown pipeline from trusted,
          // in-repo content, so injecting it as HTML is safe here.
          dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
        />

        {page.prev || page.next ? (
          <div className="pager">
            {page.prev ? (
              <a href={pagerUrl(page.prev.href)}>&larr; {page.prev.label}</a>
            ) : (
              <span />
            )}
            {page.next ? (
              <a href={pagerUrl(page.next.href)}>{page.next.label} &rarr;</a>
            ) : (
              <span />
            )}
          </div>
        ) : null}

        <footer className="site">
          PomPom, focus on what matters. &middot;{' '}
          <a href={BASE}>Open app</a> &middot;{' '}
          <a href="https://github.com/itssamuelrowe/pompom">GitHub</a>
        </footer>
      </body>
    </html>
  )
}
