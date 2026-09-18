// Sampled instruments that can be played instead of the built-in synth.
//
// Adding an instrument is a matter of adding an entry to INSTRUMENTS: the code
// in audio.js is instrument-agnostic. Samples are only downloaded when the
// instrument is actually selected, so this costs nothing until then.
//
// Each entry carries:
// - `samples`: which notes have a sample file. Tone.Sampler repitches them to
//   cover every note in between, so one sample every three semitones is enough
//   to stay faithful.
// - `noteLength`: how long a note rings in "note courte" mode. Percussive
//   instruments only need a brief trigger; sustained ones (brass, strings)
//   would sound like a blip and need a longer one.
// - `release`: the fade, in seconds, applied when a note is released. On a
//   piano it stands in for the damper falling back onto the string, instead of
//   cutting the note dead.
// - `volume`: a trim, in dB, to sit at the same level as the synth.

// Sample files are named after the note they hold, with "s" standing in for
// the sharp sign: D#1 is stored as Ds1.mp3.
function sampleUrls(notes) {
  return Object.fromEntries(notes.map((note) => [note, `${note.replace('#', 's')}.mp3`]))
}

// The Salamander set: one sample every minor third, spanning the piano's own
// range (A0 to C8). These are the exact 30 files in public/samples/piano/.
const PIANO_NOTES = [
  'A0',
  'C1', 'D#1', 'F#1', 'A1',
  'C2', 'D#2', 'F#2', 'A2',
  'C3', 'D#3', 'F#3', 'A3',
  'C4', 'D#4', 'F#4', 'A4',
  'C5', 'D#5', 'F#5', 'A5',
  'C6', 'D#6', 'F#6', 'A6',
  'C7', 'D#7', 'F#7', 'A7',
  'C8',
]

// The acoustic guitar set, reduced to one sample every three semitones over
// the range the upstream recordings cover (D2 to D5). These are the 13 files
// in public/samples/guitar/.
const GUITAR_NOTES = [
  'D2', 'F2', 'G#2', 'B2',
  'D3', 'F3', 'G#3', 'B3',
  'D4', 'F4', 'G#4', 'B4',
  'D5',
]

export const INSTRUMENTS = [
  {
    key: 'piano',
    label: 'Piano',
    // Vite serves `public/` from the app's base path, which differs between
    // dev ("/") and the GitHub Pages build ("/tonalites/").
    baseUrl: `${import.meta.env.BASE_URL}samples/piano/`,
    samples: sampleUrls(PIANO_NOTES),
    noteLength: '8n',
    release: 1,
    // The samples peak around -8 dBFS where the synth peaks near 0, so they
    // need a boost to match; kept below that difference to leave headroom for
    // the four notes the "Ensemble" playback can trigger at once.
    volume: 4,
  },
  {
    key: 'guitar',
    label: 'Guitare',
    baseUrl: `${import.meta.env.BASE_URL}samples/guitar/`,
    samples: sampleUrls(GUITAR_NOTES),
    noteLength: '8n',
    // Shorter than the piano: lifting a finger off a fretted string damps it
    // quickly, where a piano's damper lets the note ring on a little.
    release: 0.4,
    // These samples are normalised to -3 dBFS, against the piano's -8, so they
    // need far less boost to land at the same level.
    volume: -1,
  },
]
