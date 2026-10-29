---
slug: getting-started
title: Getting started
navLabel: Getting started
pageTitle: "Getting Started with PomPom, How to Use the Pomodoro Timer"
description: "How to use the PomPom Pomodoro timer. Timer modes, Start, Pause, Reset and Skip controls, automatic session cycling, ringtones, and installing it as an app."
ogType: article
order: 1
jsonLd:
  "@context": https://schema.org
  "@type": HowTo
  name: How to use the PomPom Pomodoro timer
  step:
    - "@type": HowToStep
      name: Pick a format
      text: Choose a timer format on first run or in Settings.
    - "@type": HowToStep
      name: Start the timer
      text: Press Start to begin a focus session.
    - "@type": HowToStep
      name: Take breaks
      text: When a session ends, take the break the timer switches to.
    - "@type": HowToStep
      name: Repeat
      text: Continue the pomodoro and break cycle until your work is done.
prev:
  href: index.html
  label: Docs home
next:
  href: best-practices.html
  label: Best practices
---

# Getting started

A focus session takes about a minute to set up. Here is the whole flow.

## 1. Pick a format

The first time you open PomPom you choose a format, a preset of durations such as the classic 25/5/15. You can switch format or set your own custom durations any time from Settings. A format defines three things:

- **Pomodoro** is the focused work interval.
- **Short break** is the quick rest between pomodoros.
- **Long break** is a longer rest after several pomodoros.

## 2. Know the three modes

The tabs at the top switch between **Pomodoro**, **Short Break** and **Long Break**. The big dial shows the time remaining and the current status.

## 3. Use the controls

::: card
- **Start** begins the countdown.
- **Pause / Resume** pauses without losing your place.
- **Reset** returns the current mode to its full duration.
- **Skip** jumps to the next session in the cycle.
- **Stop Ringing** appears when a session ends. It silences the alarm and moves you to the next session.
:::

The countdown is timestamp-based, so it stays accurate even if your browser throttles the tab in the background.

## 4. Let sessions cycle

With auto-cycle on, PomPom moves Pomodoro to Short Break to Pomodoro and inserts a Long Break after a configurable number of pomodoros (default four). The dots under the controls show your progress through the current cycle. Prefer control? Turn auto-cycle off, or enable **Auto-start next timer** to have the next session begin on its own.

## 5. Pick a sound

PomPom synthesizes its ringtones locally with the Web Audio API, so sound works fully offline. Choose a tone, set the volume, and preview it in Settings. "Keep ringing until stopped" makes the alarm loop until you acknowledge it.

::: callout
**Tip:** browsers only allow sound after you interact with the page. Pressing Start (or Preview) unlocks audio for the session.
:::

## 6. Install it as an app

PomPom is a Progressive Web App. In a supporting browser you will see an install option in the address bar or menu. Installed, it opens in its own window, works offline, and can show reminder notifications.

## 7. Track your overtime

If you keep working past a timer, a small overtime counter appears in the corner. Each run is saved to your **overtime history**, which you can open from the history icon in the top bar.
