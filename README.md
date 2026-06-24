# Tonalités

**Tonalités** is an interactive, in-browser instrument for *seeing* and *hearing*
the chromatic scale, and *understanding* the notion of tonality (musical key).
Notes are laid out left-to-right as a row of squares — one
per semitone — and you play them simply by hovering. The point is to make the
structure of music visible: where the octaves fall, which notes belong to a
scale, what an interval sounds like against a fixed root, and how a pitch glides
continuously from one note to the next.

It's a tool for learning, exploring and ear-training — no installation, no
account, just open the page and move your mouse.

**Live demo: https://mleroi.github.io/tonalites/**

## The idea

Each square is one chromatic note. You choose the lowest note and how many
octaves to display, and the squares resize to always fit the screen on a single
row. Hovering a square plays its note; sliding across them plays a run. On top of
that, several layers help you read what you hear:

- **Labels** inside each square — interval symbols (R, b2, M2…), scale-degree
  numbers (1–12) or note names (Do, Ré…), counted from a reference note.
- **Scales** — pick a mode and its notes are highlighted; optionally only the
  scale's notes are audible, so you can improvise "inside" a key.
- **A drone** — a sustained background note to hear every other note *as an
  interval* against a fixed root.
- **A continuous glissando band** above the row — sweep it to hear pitch vary
  smoothly, snapping to a note's exact frequency as you cross each square's
  center.

## Features

- **Chromatic row** that always fits the width of the screen, centered, on a
  single line, with squares that scale to the number of notes.
- **First note** and **number of octaves** sliders (Do1–Do7, 1–10 octaves).
- **Labels**: none, intervals, scale numbers, or note names — shown for a single
  octave or repeated across all octaves.
- **Reference note ("Note du 1")** that anchors numbering, intervals and scale
  tonic independently of the first displayed note.
- **Highlight every "1"** (the tonic and its octaves) with a distinct border.
- **Scales**: the seven modes of the major scale (Ionian/major, Dorian,
  Phrygian, Lydian, Mixolydian, Aeolian/minor, Locrian), with:
  - highlight of the scale notes (single octave or all octaves),
  - an option to hide labels outside the scale,
  - an audio mode to hear only the scale's notes.
- **Accidentals** displayed as sharps or flats, applied everywhere.
- **Playback modes**: short note on hover, or sustained while the pointer stays
  on the square.
- **Drone** with its own note and volume.
- **Glissando band** for continuous pitch, showing the live frequency and the
  note name when it lands on an exact pitch.
- **Piano mode** coloring (white/black keys).
- **Optional note names and frequencies** shown below each square.

## Tech stack

- [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`)
- [Vite](https://vite.dev/) for dev server and build
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Tone.js](https://tonejs.github.io/) for audio synthesis (Web Audio API)

## Requirements

- Node.js v22+ (tested with v22.23.0)
- npm

## Getting started

```bash
npm install
npm run dev
```

This starts the Vite dev server at `http://localhost:5173` with hot-module
reloading.

> Note: the file watcher uses polling (see `vite.config.js`) because the
> machine's `fs.inotify.max_user_watches` limit is saturated. Slightly slower
> reloads are expected.

### Other commands

```bash
npm run build     # production build into dist/
npm run preview   # serve the production build locally
```

## Deployment

The app is a fully static front-end (Web Audio runs in the browser), deployed to
**GitHub Pages** via GitHub Actions. Every push to `main` triggers the workflow
in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds
the site and publishes it to https://mleroi.github.io/tonalites/.

The production build sets Vite's `base` to `/tonalites/` (see `vite.config.js`),
which is required for assets to load correctly under the project's Pages URL.

## Project structure

```
src/
  App.vue              Main view: controls and the row of squares
  components/
    Carre.vue          A single note square (label, colors, events)
  audio.js             Tone.js setup: notes, drone, glissando
  notes.js             Note names, intervals, scales, helpers
  main.js              App entry point
  style.css            Tailwind entry
```

## Browser audio note

Browsers only allow audio to start after a user interaction. On first load a
welcome overlay ("Bienvenue") captures that first click, which unlocks the audio
context; afterwards, hovering plays sound directly.
