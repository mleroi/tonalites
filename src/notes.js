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

// Labels for the dropdown option groups, in display order.
export const SCALE_TYPES = [
  { type: 'scale', label: 'Gammes' },
  { type: 'interval', label: 'Intervalles' },
  { type: 'chord', label: 'Accords' },
]

// True if `semitone` belongs to the scale built on `tonic` with the given
// intervals (compared modulo the octave).
export function isInScale(semitone, tonic, intervals) {
  const degree = (((semitone - tonic) % 12) + 12) % 12
  return intervals.includes(degree)
}
