# PomPom 🍅

A simple, local-first Pomodoro timer built with React, MUI and Vite. Focus on
what matters — no accounts, no backend, no tracking.

## Features

- **Three timer modes** — Pomodoro, Short Break, Long Break, each with an
  independently configurable duration.
- **Accurate, timestamp-based countdown** — remaining time is derived from an
  end timestamp, so background-tab throttling doesn't cause drift.
- **Start / Pause / Reset / Skip** controls with an explicit timer state model
  (`IDLE`, `RUNNING`, `PAUSED`, `COMPLETED`, `RINGING`).
- **Automatic session cycling** — Pomodoro → break → Pomodoro …, with a long
  break after a configurable number of Pomodoros (default 4). Can be disabled.
- **Built-in ringtones** — five tones synthesized locally with the Web Audio
  API (no external audio files, works fully offline). Preview and volume control
  included.
- **Keep ringing until stopped** — the completion sound loops indefinitely until
  you explicitly stop it (or plays a finite number of times when disabled).
- **Local persistence** — all preferences are saved to `localStorage` and
  restored on reload. Corrupted or missing settings fall back to safe defaults.
- **Theming** — light / dark / system modes and a curated palette of accent
  colors, all driven from the MUI theme object.
- **Responsive & accessible** — works from mobile to desktop, keyboard-operable,
  with accessible labels and non-color-only status cues.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run lint     # run ESLint
```

## Architecture

```
src/
├── App.tsx                  Orchestration: state model, cycling, audio wiring
├── types.ts                 Shared types, defaults, validation limits
├── utils.ts                 Time formatting, quotes
├── theme/
│   ├── palette.ts           Fixed accent-color palette (no arbitrary RGB)
│   └── createAppTheme.ts     MUI theme factory (mode + accent -> theme object)
├── audio/
│   ├── ringtones.ts          Ringtone definitions as oscillator patterns
│   └── AudioManager.ts       Web Audio synthesis + autoplay handling
├── hooks/
│   ├── useSettings.ts        localStorage persistence + validation
│   ├── useTimer.ts           Timestamp-based countdown state machine
│   └── useResolvedMode.ts    Resolves light/dark/system preference
└── components/               Header, ModeTabs, TimerDial, Controls,
                              SessionIndicator, SettingsPanel, AccentColorPicker
```

## Privacy

PomPom collects nothing. There are no analytics, no accounts, and no network
requests after the app has loaded. Your settings never leave your device.
