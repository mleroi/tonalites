import { Midi } from '@tonejs/midi'
import MIDI_FILES from 'virtual:midi-files'

// Melodies played from the MIDI files in public/midi (listed at build time by
// the `midi-files` plugin, see vite.config.js). Each file is expected to hold
// a single melody line; when it has several tracks, they are all merged.
//
// Files are named "[name]_[tonic].mid", the tonic being the note the melody is
// written on, so that it can be transposed onto the "note du 1": e.g.
// "frere-jacques_do4.mid". The tonic is a lowercase French note name (accents
// optional), an optional accidental ("#" or "s" for sharp, "b" for flat) and
// the octave, numbered as in the app (Do4 = C4 = MIDI 60): "fas3", "sib3".
//
// Melodies are grouped by the subfolder they are in, whose name is shown as
// the group's title ("Comptines/…"); files at the top of public/midi belong
// to no group.

// Pitch class of each note name.
const PITCH_CLASSES = { do: 0, re: 2, mi: 4, fa: 5, sol: 7, la: 9, si: 11 }

const ACCIDENTALS = { '#': 1, s: 1, b: -1 }

// Splits a file name into its name and its tonic, as an absolute semitone
// index (0 = Do1). The tonic is null when the name does not state one.
function parseFileName(file) {
  const base = file.replace(/\.midi?$/i, '')
  const match = base
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .match(/^(.*)_(do|re|mi|fa|sol|la|si)(#|s|b)?(\d)$/i)
  if (!match) return { name: base, tonic: null }
  const [, name, note, accidental, octave] = match
  const tonic =
    (Number(octave) - 1) * 12 +
    PITCH_CLASSES[note.toLowerCase()] +
    (accidental ? ACCIDENTALS[accidental.toLowerCase()] : 0)
  return { name, tonic }
}

// Fetches and parses one MIDI file, given by its path in public/midi, into
// { key, group, label, tonic, notes }, `notes` being sorted by start time,
// each as { semitone, time, duration, velocity } with times in seconds. The
// label is the file's own name (its header's track name), or the file name
// when it states none.
async function loadMelody(path) {
  const url = path.split('/').map(encodeURIComponent).join('/')
  const response = await fetch(`${import.meta.env.BASE_URL}midi/${url}`)
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`)
  const midi = new Midi(await response.arrayBuffer())
  const notes = midi.tracks
    .flatMap((track) => track.notes)
    .map((n) => ({
      // Absolute semitone index of the app: 0 = Do1 = MIDI 24.
      semitone: n.midi - 24,
      time: n.time,
      duration: n.duration,
      velocity: n.velocity,
    }))
    .sort((a, b) => a.time - b.time)
  const folders = path.split('/')
  const { name, tonic } = parseFileName(folders.pop())
  return {
    key: path,
    group: folders.join(' / '),
    label: midi.header.name.trim() || name,
    tonic,
    notes,
  }
}

// Loads every melody, sorted by label. A file that cannot be fetched or parsed
// is left out rather than failing the whole list.
export async function loadMelodies() {
  const results = await Promise.allSettled(MIDI_FILES.map(loadMelody))
  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value)
    .sort((a, b) => a.label.localeCompare(b.label, 'fr'))
}

// Splits melodies into their groups, as [{ label, melodies }], the melodies
// with no group first (label ''), then the groups sorted by title.
export function groupMelodies(melodies) {
  const groups = new Map()
  for (const melody of melodies) {
    if (!groups.has(melody.group)) groups.set(melody.group, [])
    groups.get(melody.group).push(melody)
  }
  return [...groups]
    .map(([label, list]) => ({ label, melodies: list }))
    .sort((a, b) => (a.label === '' ? -1 : b.label === '' ? 1 : a.label.localeCompare(b.label, 'fr')))
}
