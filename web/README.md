# PomPom 🍅

A Pomodoro timer built around the real reasons people fall off the method. The technique is simple, but sticking to it is not. PomPom removes the small frictions that make most people quit after a few days.

## The frictions PomPom fixes

- **You keep working past the bell and lose track.** The session ends, but you stay in flow. Most timers just stop and leave you guessing how long you overran. PomPom keeps counting your overtime after the bell and saves each run to a local history, so you can see your real pattern instead of the planned one.
- **You can't see whether the method is actually working.** A planned 25/5 rhythm tells you nothing about what really happened. PomPom logs every finished session (planned length, time actually worked, time spent over the bell, and the same for breaks) and turns it into an analytics page so your real habits are visible, not assumed.
- **You forget to press start.** A timer only helps if it is running. When PomPom sits idle, it can nudge you with a browser notification or a soft chime, so the timer does not quietly sit there doing nothing while you drift.
- **You miss the end bell during deep focus.** When you are heads-down, a single short beep is easy to miss. PomPom can keep ringing until you actually stop it, so a break never gets skipped by accident.
- **You waste time fiddling with durations before you begin.** Deciding 25 or 50, 5 or 10, kills momentum. Pick a ready rhythm on first open (Classic, Deep Work, or Eye and Back Relief) and start in one tap. Tune it later if you want.
- **The rigid cycle breaks your flow.** Manually switching between focus and breaks adds friction. PomPom auto-cycles Pomodoro to break to Pomodoro, schedules the long break for you, and can auto-start the next session hands-free. Turn any of it off if you prefer manual control.
- **Boring or jarring alarms make you dread the bell.** PomPom has eleven built-in tones, all made locally, with preview, volume control, and a "surprise me" random option.

## Analytics

Open the analytics page from the chart icon in the top bar (or visit `/analytics`). It reconstructs your real pattern from the sessions PomPom records:

- **Four tracked buckets.** Every session is split into *working*, *overworking* (past the bell on a Pomodoro), *breaking*, and *overbreaking* (past the bell on a break), so planned time and lingering time are never conflated.
- **Modern, interactive charts** built with [visx](https://airbnb.io/visx):
  - a stacked bar chart of time per day, switchable across 7/14/30-day windows,
  - a smooth gradient area chart showing your focus-time trend,
  - an interactive donut breaking down where your time really goes.
- **At-a-glance stats.** Total focus time, completed Pomodoros, current and longest day streaks, and average focus per active day.
- **Share your report.** The Share button turns the report into an image you can send anywhere. It uses the native share sheet where available, otherwise copies the image to your clipboard, otherwise downloads a PNG, so it works the same on a phone or a desktop.
- **Preview with sample data.** No history yet? Flip on "Sample data" in the toolbar to see exactly what the screen looks like with a month of activity. Nothing is saved; it is only a preview.
- All charts pull their colors from your chosen accent and theme, so analytics matches the rest of the app.

Everything is computed locally from your own data. You can clear the history any time.

## On the home screen

Below the timer, the home screen shows your momentum:

- **Streaks.** Current streak, longest streak, and total active days at a glance.
- **A GitHub-style heatmap** of daily focus over the past year, so you can see your consistency as one picture. Darker squares mean more focus that day.
- **A note from the author** at the very bottom, on why PomPom exists.

## Other things worth knowing

- **The timer follows you.** Browse to analytics and a mini timer appears in the bottom-right corner. It is the same running session, so you can start, pause, or skip from there, or tap to jump back to the full timer. Leaving the timer page never resets your countdown.
- **One toolbar everywhere.** Every screen shares the same top bar (a reusable `WorkspaceToolbar`), so the brand lockup and navigation stay consistent as you move around.
- **Works offline.** Install it like an app (PWA) and use it with no internet. Ringtones are synthesized on the fly with the Web Audio API, so there is nothing to download.
- **Stays on your device.** Settings, overtime history, and session analytics all live in your browser, not on a server. No account, no sign-up to get started.
- **Accurate countdown.** Time is derived from an end timestamp, so a background tab does not cause drift.
- **Theming.** Light, dark, or system mode, with a curated set of accent colors.
- **Responsive and accessible.** Works from mobile to desktop, keyboard-friendly, with labels and non-color status cues.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and production build
npm run lint     # run ESLint
```

## Tech stack

React 19, MUI, TypeScript, and Vite. Client-side routing uses [React Router](https://reactrouter.com/) (the timer at `/`, analytics at `/analytics`). Charts are drawn with [visx](https://airbnb.io/visx), and the shareable report image is generated with [html-to-image](https://github.com/bubkoo/html-to-image). Audio is built with the Web Audio API. Offline support comes from a service worker and a web manifest.

### How the timer survives navigation

The whole timer lifecycle (countdown, mode cycling, overtime, analytics
recording, idle reminders and audio) lives in a single `useTimerEngine` hook
(`src/hooks/useTimerEngine.ts`). A `TimerProvider` (`src/timer/`) hosts one
instance of it *above* the router, so both the full timer screen and the corner
mini timer read and control the same session. Navigating between pages never
unmounts the engine, which is why the countdown keeps running and the mini
timer stays in sync.

### How tracking is structured

Session tracking is encapsulated in a `SessionTracker` class (`src/analytics/SessionTracker.ts`) rather than scattered through components:

- **Observer pattern.** Components subscribe to the tracker and re-render only when the record set changes; React binds to it through `useSyncExternalStore` in the `useSessionTracker` hook.
- **Dependency injection.** Persistence lives behind a `SessionStore` interface (default: a guarded `localStorage` backend), so the tracker has no hard dependency on the browser and is easy to test with an in-memory store.
- **Pure aggregation.** `src/analytics/aggregate.ts` holds side-effect-free functions that turn raw records into daily buckets, category totals, streaks, and the heatmap grid, all trivial to memoize and verify.

The timer screen records a session whenever one finishes or is cut short (including partial, early-ended sessions), capturing the planned length, the time actually worked, and any overtime.

### Documentation

The docs pages (served at `/docs/`) are authored in Markdown and prerendered to
static, crawlable HTML at build time, so no React ships to those pages.

- Write content in `src/docs/content/*.md`. Each file has YAML frontmatter for
  its title, SEO description, nav order, optional JSON-LD, and prev/next links.
- The shared shell is a React component (`src/docs/DocLayout.tsx`) rendered to a
  string with `react-dom/server`. Styles live in `public/docs.css` and mirror
  the app theme.
- `npm run build:docs` runs the prerender step (`scripts/prerender-docs.tsx` via
  `scripts/run-prerender.mjs`) and writes the pages into `dist/docs/`. It is part
  of `npm run build`, and can be run on its own while editing docs.
- In `npm run dev` the same renderer serves `/docs/` on the fly through a small
  Vite plugin (`docsDevServer` in `vite.config.ts`), so the pages work locally
  and reflect Markdown edits without a build. The shared rendering logic lives
  in `src/docs/render.tsx`, used by both dev and build.

A few light Markdown extensions are supported for layout: `::: grid`,
`::: callout`, `::: card`, and `::: settings` container blocks, plus
`[label](url){.cta}` for a call-to-action button. Quote any frontmatter string
that contains a colon so the YAML parses cleanly.

### Deployment note

GitHub Pages has no server-side SPA fallback, so the build copies `index.html` to `404.html` (see `vite.config.ts`). That lets a hard refresh or a shared `/analytics` deep link load the app and hand off to React Router.

## License

Released under the MIT License. See [LICENSE](LICENSE) for details.
