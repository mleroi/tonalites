// Chromatic note names using sharps (French notation).
export const NOTE_NAMES = [
  'Do',
  'Do#',
  'Ré',
  'Ré#',
  'Mi',
  'Fa',
  'Fa#',
  'Sol',
  'Sol#',
  'La',
  'La#',
  'Si',
]

// Same chromatic scale written with flats instead of sharps.
export const NOTE_NAMES_FLAT = [
  'Do',
  'Réb',
  'Ré',
  'Mib',
  'Mi',
  'Fa',
  'Solb',
  'Sol',
  'Lab',
  'La',
  'Sib',
  'Si',
]

// Lowest and highest selectable starting notes, expressed as absolute
// semitone indices where 0 = Do1.
export const MIN_NOTE = 0 // Do1
export const MAX_NOTE = 72 // Do7

// Range for the slider that chooses which note carries the number "1".
export const MIN_NUMBER_START = 0 // Do1
export const MAX_NUMBER_START = 96 // Do9

// Pitch class name (without octave) for an absolute semitone index.
export function pitchClassName(semitone, useFlats = false) {
  return (useFlats ? NOTE_NAMES_FLAT : NOTE_NAMES)[semitone % 12]
}

// Converts an absolute semitone index (0 = Do1) into its note name with octave.
export function noteName(semitone, useFlats = false) {
  const octave = Math.floor(semitone / 12) + 1
  return `${pitchClassName(semitone, useFlats)}${octave}`
}

// Interval symbols for each semitone degree from the tonic (degree 0 = root).
export const INTERVALS = ['R', 'b2', 'M2', 'b3', 'M3', 'P4', '#4', 'P5', 'b6', 'M6', 'b7', 'M7']

// Semitone positions within an octave that are black keys on a piano
// (the sharps: Do#, Ré#, Fa#, Sol#, La#).
const BLACK_KEYS = new Set([1, 3, 6, 8, 10])

// True if the given absolute semitone index is a black key on a piano.
export function isBlackKey(semitone) {
  return BLACK_KEYS.has(semitone % 12)
}

// Selectable note sets, each described by its semitone degrees from the tonic
// (degree 0). `type` groups them in the dropdown: scale / interval / chord.
export const SCALES = [
  // The seven modes of the major scale (rotations of one another).
  { key: 'ionian', type: 'scale', label: 'Gamme majeure (Mode Ionien)', intervals: [0, 2, 4, 5, 7, 9, 11, 12] },
  { key: 'dorian', type: 'scale', label: 'Mode Dorien', intervals: [0, 2, 3, 5, 7, 9, 10, 12] },
  { key: 'phrygian', type: 'scale', label: 'Mode Phrygien', intervals: [0, 1, 3, 5, 7, 8, 10, 12] },
  { key: 'lydian', type: 'scale', label: 'Mode Lydien', intervals: [0, 2, 4, 6, 7, 9, 11, 12] },
  { key: 'mixolydian', type: 'scale', label: 'Mode Mixolydien', intervals: [0, 2, 4, 5, 7, 9, 10, 12] },
  { key: 'aeolian', type: 'scale', label: 'Gamme mineure (Mode Aéolien)', intervals: [0, 2, 3, 5, 7, 8, 10, 12] },
  { key: 'min-harmonic', type: 'scale', label: 'Gamme mineure harmonique', intervals: [0, 2, 3, 5, 7, 8, 11, 12] },
  { key: 'min-melodic', type: 'scale', label: 'Gamme mineure mélodique', intervals: [0, 2, 3, 5, 7, 9, 11, 12] },
  { key: 'locrian', type: 'scale', label: 'Mode Locrien', intervals: [0, 1, 3, 5, 6, 8, 10, 12] },

  // Five-note scales. Their labels stay explicit because a collapsed <select>
  // shows the option alone, without its group heading.
  { key: 'penta-maj', type: 'pentatonic', label: 'Pentatonique majeure', intervals: [0, 2, 4, 7, 9, 12] },
  { key: 'penta-min', type: 'pentatonic', label: 'Pentatonique mineure', intervals: [0, 3, 5, 7, 10, 12] },

  // Every interval from the tonic, within one octave.
  { key: 'i-min2', type: 'interval', label: 'Seconde mineure (b2)', intervals: [0, 1] },
  { key: 'i-maj2', type: 'interval', label: 'Seconde majeure (M2)', intervals: [0, 2] },
  { key: 'i-min3', type: 'interval', label: 'Tierce mineure (b3)', intervals: [0, 3] },
  { key: 'i-maj3', type: 'interval', label: 'Tierce majeure (M3)', intervals: [0, 4] },
  { key: 'i-p4', type: 'interval', label: 'Quarte juste (P4)', intervals: [0, 5] },
  { key: 'i-tritone', type: 'interval', label: 'Triton, Quarte augmentée, Quinte diminuée (#4 / b5)', intervals: [0, 6] },
  { key: 'i-p5', type: 'interval', label: 'Quinte juste (P5)', intervals: [0, 7] },
  { key: 'i-min6', type: 'interval', label: 'Quinte augmentée, Sixte mineure (#5 / b6)', intervals: [0, 8] },
  { key: 'i-maj6', type: 'interval', label: 'Sixte majeure (M6)', intervals: [0, 9] },
  { key: 'i-min7', type: 'interval', label: 'Septième mineure (b7)', intervals: [0, 10] },
  { key: 'i-maj7', type: 'interval', label: 'Septième majeure (M7)', intervals: [0, 11] },
  { key: 'i-octave', type: 'interval', label: 'Octave (8ve)', intervals: [0, 12] },

  // Three-note chords (triads).
  { key: 'c-maj', type: 'chord', label: 'Majeur', intervals: [0, 4, 7] },
  { key: 'c-min', type: 'chord', label: 'Mineur (m)', intervals: [0, 3, 7] },
  { key: 'c-dim', type: 'chord', label: 'Diminué (dim)', intervals: [0, 3, 6] },
  { key: 'c-aug', type: 'chord', label: 'Augmenté (aug)', intervals: [0, 4, 8] },
  { key: 'c-sus2', type: 'chord', label: 'Suspendu 2 (sus2)', intervals: [0, 2, 7] },
  { key: 'c-sus4', type: 'chord', label: 'Suspendu 4 (sus4)', intervals: [0, 5, 7] },

  // Four-note chords (seventh and sixth chords).
  { key: 'c-maj7', type: 'chord', label: 'Majeur 7 (maj7)', intervals: [0, 4, 7, 11] },
  { key: 'c-dom7', type: 'chord', label: 'Dominante 7 (7)', intervals: [0, 4, 7, 10] },
  { key: 'c-min7', type: 'chord', label: 'Mineur 7 (m7)', intervals: [0, 3, 7, 10] },
  { key: 'c-minmaj7', type: 'chord', label: 'Mineur majeur 7 (mMaj7)', intervals: [0, 3, 7, 11] },
  { key: 'c-m7b5', type: 'chord', label: 'Demi-diminué (m7b5)', intervals: [0, 3, 6, 10] },
  { key: 'c-dim7', type: 'chord', label: 'Diminué 7 (dim7)', intervals: [0, 3, 6, 9] },
  { key: 'c-maj6', type: 'chord', label: 'Majeur 6 (6)', intervals: [0, 4, 7, 9] },
  { key: 'c-min6', type: 'chord', label: 'Mineur 6 (m6)', intervals: [0, 3, 7, 9] },
  { key: 'c-7s5', type: 'chord', label: 'Septième augmentée (7#5)', intervals: [0, 4, 8, 10] },
  { key: 'c-maj7s5', type: 'chord', label: 'Majeur 7 augmenté (maj7#5)', intervals: [0, 4, 8, 11] },
]

// Musical keys from 7 flats to 7 sharps (circle of fifths order). `pitchClass`
// is the tonic's chromatic index (0 = Do); `accidentals` is the spelling that
// keeps the key coherent.
export const KEYS = [
  { key: 'cb', label: 'Do bémol', pitchClass: 11, accidentals: 'flats', signature: '7 ♭' },
  { key: 'gb', label: 'Sol bémol', pitchClass: 6, accidentals: 'flats', signature: '6 ♭' },
  { key: 'db', label: 'Ré bémol', pitchClass: 1, accidentals: 'flats', signature: '5 ♭' },
  { key: 'ab', label: 'La bémol', pitchClass: 8, accidentals: 'flats', signature: '4 ♭' },
  { key: 'eb', label: 'Mi bémol', pitchClass: 3, accidentals: 'flats', signature: '3 ♭' },
  { key: 'bb', label: 'Si bémol', pitchClass: 10, accidentals: 'flats', signature: '2 ♭' },
  { key: 'f', label: 'Fa', pitchClass: 5, accidentals: 'flats', signature: '1 ♭' },
  { key: 'c', label: 'Do', pitchClass: 0, accidentals: 'sharps', signature: '' },
  { key: 'g', label: 'Sol', pitchClass: 7, accidentals: 'sharps', signature: '1 ♯' },
  { key: 'd', label: 'Ré', pitchClass: 2, accidentals: 'sharps', signature: '2 ♯' },
  { key: 'a', label: 'La', pitchClass: 9, accidentals: 'sharps', signature: '3 ♯' },
  { key: 'e', label: 'Mi', pitchClass: 4, accidentals: 'sharps', signature: '4 ♯' },
  { key: 'b', label: 'Si', pitchClass: 11, accidentals: 'sharps', signature: '5 ♯' },
  { key: 'fs', label: 'Fa dièse', pitchClass: 6, accidentals: 'sharps', signature: '6 ♯' },
  { key: 'cs', label: 'Do dièse', pitchClass: 1, accidentals: 'sharps', signature: '7 ♯' },
]

// Labels for the dropdown option groups, in display order.
export const SCALE_TYPES = [
  { type: 'scale', label: 'Gammes' },
  { type: 'pentatonic', label: 'Gammes pentatoniques' },
  { type: 'interval', label: 'Intervalles' },
  { type: 'chord', label: 'Accords' },
]

// Instrument and voice ranges (tessituras), as inclusive absolute semitone
// bounds (0 = Do1 = C1 = MIDI 24).
export const TESSITURAS = [
  { key: 'piano', type: 'instrument', label: 'Piano', low: -3, high: 84 }, // A0–C8
  { key: 'guitar', type: 'instrument', label: 'Guitare', low: 16, high: 64 }, // E2–E6
  { key: 'bass', type: 'instrument', label: 'Basse', low: 4, high: 43 }, // E1–G4
  { key: 'violin', type: 'instrument', label: 'Violon', low: 31, high: 76 }, // G3–E7
  { key: 'soprano', type: 'voice', label: 'Soprano', low: 36, high: 60 }, // Do4–Do6
  { key: 'alto', type: 'voice', label: 'Alto', low: 29, high: 53 }, // Fa3–Fa5
  { key: 'tenor', type: 'voice', label: 'Ténor', low: 24, high: 48 }, // Do3–Do5
  { key: 'basse-voix', type: 'voice', label: 'Basse', low: 16, high: 40 }, // Mi2–Mi4
]

// Labels for the tessitura dropdown option groups, in display order.
export const TESSITURA_TYPES = [
  { type: 'instrument', label: 'Instruments' },
  { type: 'voice', label: 'Voix' },
]

// True if `semitone` belongs to the scale built on `tonic` with the given
// intervals (compared modulo the octave).
export function isInScale(semitone, tonic, intervals) {
  const degree = (((semitone - tonic) % 12) + 12) % 12
  return intervals.includes(degree)
}

// Scale degrees as Roman numerals, indexed by rank within the scale (0 = the
// tonic). These are plain numbers: no chord quality (major, minor, diminished)
// is implied by the casing or by any suffix.
export const ROMAN_DEGREES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

// Rank of `semitone` within the scale built on `tonic`, as a Roman numeral,
// or null when the note does not belong to the scale. The scale's trailing
// octave interval (12) is never matched, since the comparison is modulo the
// octave, so the tonic always reads "I".
//
// Rank and degree only coincide for the seven-note scales, which is why the
// caller restricts this to `type: 'scale'`. A pentatonic's degrees are named
// after the diatonic positions it keeps, so it would need its own mapping.
export function scaleDegree(semitone, tonic, intervals) {
  const rank = scaleRank(semitone, tonic, intervals)
  return rank >= 0 && rank < ROMAN_DEGREES.length ? ROMAN_DEGREES[rank] : null
}

// Rank of `semitone` within the scale built on `tonic`, counting from 0 for
// the tonic, or -1 when the note does not belong to the scale.
export function scaleRank(semitone, tonic, intervals) {
  const degree = (((semitone - tonic) % 12) + 12) % 12
  return intervals.indexOf(degree)
}

// Chord sizes offered by the chord-listening mode, in notes.
export const CHORD_SIZES = [3, 4, 5]

// Notes of the chord built on the scale's `rank` degree, as semitone intervals
// from the chord's own root (so the first is always 0). The chord is built the
// diatonic way, by stacking every other scale note — ranks r, r+2, r+4… — so
// it only ever contains notes of the scale. `count` is how many notes to take.
export function diatonicChordIntervals(intervals, rank, count) {
  const degrees = intervals.filter((d) => d < 12)
  const size = degrees.length
  // A rank past the last degree wraps around into the octave above.
  const at = (k) => degrees[((k % size) + size) % size] + 12 * Math.floor(k / size)
  const root = at(rank)
  return Array.from({ length: count }, (_, i) => at(rank + 2 * i) - root)
}

// Full-word names for every chord the construction above can produce, keyed by
// the chord's semitone intervals from its root. Stacking thirds over the nine
// seven-note scales yields exactly these 22 shapes — 4 of three notes, 7 of
// four and 11 of five — so the table is exhaustive rather than a best effort.
//
// The names state the chord's nature only, with no root note, and agree with
// "accord" (masculine), like the chord entries in SCALES.
export const CHORD_NAMES = {
  // Three notes
  '0,3,6': 'Diminué',
  '0,3,7': 'Mineur',
  '0,4,7': 'Majeur',
  '0,4,8': 'Augmenté',

  // Four notes
  '0,3,6,9': 'Diminué septième',
  '0,3,6,10': 'Demi-diminué',
  '0,3,7,10': 'Mineur septième',
  '0,3,7,11': 'Mineur majeur septième',
  '0,4,7,10': 'Dominante septième',
  '0,4,7,11': 'Majeur septième',
  '0,4,8,11': 'Majeur septième quinte augmentée',

  // Five notes
  '0,3,6,9,13': 'Diminué septième neuvième bémol',
  '0,3,6,10,13': 'Demi-diminué neuvième bémol',
  '0,3,6,10,14': 'Demi-diminué neuvième',
  '0,3,7,10,13': 'Mineur septième neuvième bémol',
  '0,3,7,10,14': 'Mineur neuvième',
  '0,3,7,11,14': 'Mineur majeur neuvième',
  '0,4,7,10,13': 'Dominante septième neuvième bémol',
  '0,4,7,10,14': 'Dominante neuvième',
  '0,4,7,11,14': 'Majeur neuvième',
  '0,4,7,11,15': 'Majeur septième neuvième augmentée',
  '0,4,8,11,14': 'Majeur neuvième quinte augmentée',
}

// Name of a chord from its intervals, or null when the shape is not listed.
export function chordName(chordIntervals) {
  return CHORD_NAMES[chordIntervals.join(',')] || null
}
