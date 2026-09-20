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

- **Labels** inside each square — interval symbols (R, b2, M2…), chromatic
  numbers (1–12), scale degrees in Roman numerals, or note names (Do, Ré…),
  counted from a reference note.
- **Scales, intervals and chords** — pick a note set and its notes are
  highlighted; optionally only those notes are audible, so you can improvise
  "inside" a key.
- **Chords under the pointer** — in the chord-listening mode, hovering a note
  plays the chord built on it, names it, and draws its shape on a strip of
  squares below, so you can compare the *geometry* of one chord to the next.
- **A drone** — a sustained background note to hear every other note *as an
  interval* against a fixed root.
- **A continuous glissando band** above the row — sweep it to hear pitch vary
  smoothly, snapping to a note's exact frequency as you cross each square's
  center.

## Features

- **Chromatic row** that always fits the width of the screen, centered, on a
  single line, with squares that scale to the number of notes.
- **First note** and **number of octaves** sliders (Do1–Do7, 1–10 octaves).
- **Labels**: none, intervals, chromatic numbers, scale degrees (Roman
  numerals) or note names — shown for a single octave or repeated across all
  octaves.
- **Reference note ("Note du 1")** that anchors numbering, intervals and scale
  tonic independently of the first displayed note.
- **Highlight every "1"** (the tonic and its octaves) with a distinct border.
- **Note sets** to highlight, grouped by kind:
  - **Scales** — the seven modes of the major scale (Ionian/major, Dorian,
    Phrygian, Lydian, Mixolydian, Aeolian/minor, Locrian) plus the harmonic and
    melodic minor scales,
  - **Pentatonics** — major and minor,
  - **Intervals** — the twelve, from the minor second to the octave,
  - **Chords** — sixteen, from the major triad to the augmented major seventh.

  Whichever is selected comes with:
  - highlight of its notes (single octave or all octaves),
  - an option to hide labels outside the selection,
  - an audio mode to hear only its notes,
  - **"Écouter la sélection"** — play it ascending, descending or all at once,
    each note lighting up as it sounds.
- **Keys ("Tonalités")**: the fifteen keys with their signature; picking one
  sets the reference note, the major scale and the right accidentals in one go.
- **Scale degrees** ("Afficher les degrés") written in Roman numerals below
  each note of a seven-note scale.
- **Chord-listening mode** ("Entendre les accords"), for a seven-note scale:
  hovering a scale note plays the diatonic chord built on it — three, four or
  five notes, stacked in thirds — instead of the single note. Every note of the
  chord keeps a blue background for as long as the pointer stays in the square,
  and the chord's nature is named below the row ("Mineur septième",
  "Demi-diminué"…). For three- and four-note chords, a **geometry strip** under
  that name reports the chord onto twelve squares always starting on its root,
  labelled with the interval from that root (R, b3, P5…), so its shape can be
  read and compared from one chord to the next.
- **Tessituras**: the range of an instrument (piano, guitar, bass, violin) or of
  a voice (soprano, alto, tenor, bass), shown as a pastel-yellow background.
- **Accidentals** displayed as sharps or flats, applied everywhere.
- **Interval spelling** for the three intervals that have two correct names,
  chosen by hand and applied everywhere intervals are written: `#4`/`b5`,
  `b6`/`#5` and `M6`/`7°` — the right one depends on the chord being read (a
  diminished fifth in a diminished chord, an augmented fourth otherwise), and
  the app deliberately does not guess.
- **Playback modes**: short note on hover, or sustained while the pointer stays
  on the square.
- **Sound ("Sonorité")**: the built-in synth, or a sampled instrument — an
  acoustic piano or an acoustic guitar. Samples are only downloaded when the
  instrument is selected, and the synth keeps playing meanwhile, so the app is
  never silent or blocked.
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
  audio.js             Tone.js setup: notes, drone, glissando, samplers
  notes.js             Note names, intervals, scales, helpers
  instruments.js       Registry of sampled instruments (samples, levels)
  main.js              App entry point
  style.css            Tailwind entry
public/
  samples/piano/       The 30 piano samples, served as static files
  samples/guitar/      The 13 guitar samples, likewise
```

### Adding a sampled instrument

`audio.js` is instrument-agnostic: it builds a `Tone.Sampler` from whatever a
registry entry describes. Adding an instrument means dropping its samples in
`public/samples/<name>/` and adding one entry to `INSTRUMENTS` in
[`src/instruments.js`](src/instruments.js) — no change to the audio code.

Two things are worth knowing before adding one. Percussive instruments (piano,
guitar) suit the hover interaction naturally, whereas sustained ones (brass,
strings) need a much longer `noteLength` or a brief hover only produces a blip.
And the glissando band and the drone deliberately keep their own oscillators: a
sampler cannot sweep pitch continuously, and a piano cannot hold a drone.

## Credits

Both sample sets are distributed under the
[Creative Commons Attribution 3.0](https://creativecommons.org/licenses/by/3.0/)
licence, which requires that their authors be credited wherever the app is
published. Each folder under `public/samples/` also carries a `README` stating
its own origin, licence and what was selected from it.

- **Piano** — *Salamander Grand Piano* (Yamaha C5) by **Alexander Holm**. The
  30-sample subset published for Tone.js, one sample every minor third from A0
  to C8, copied unmodified into
  [`public/samples/piano/`](public/samples/piano/) alongside the author's
  original `README`.
- **Guitar** — recorded by the **University of Iowa Electronic Music Studios**,
  obtained via [nbrosowsky/tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments)
  (project code MIT, samples CC-BY 3.0). The upstream set is chromatic over
  D2–D5; [`public/samples/guitar/`](public/samples/guitar/) keeps 13 of those
  files, one every three semitones, to match the piano's fidelity at a
  comparable size. The files are unmodified — only the selection is reduced.

## Browser audio note

Browsers only allow audio to start after a user interaction. On first load a
welcome overlay ("Bienvenue") captures that first click, which unlocks the audio
context; afterwards, hovering plays sound directly.
