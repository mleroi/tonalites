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

// Lowest and highest selectable starting notes, expressed as absolute
// semitone indices where 0 = Do1.
export const MIN_NOTE = 0 // Do1
export const MAX_NOTE = 72 // Do7

// Range for the slider that chooses which note carries the number "1".
export const MIN_NUMBER_START = 0 // Do1
export const MAX_NUMBER_START = 96 // Do9

// Converts an absolute semitone index (0 = Do1) into its note name with octave.
export function noteName(semitone) {
  const name = NOTE_NAMES[semitone % 12]
  const octave = Math.floor(semitone / 12) + 1
  return `${name}${octave}`
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

// The seven modes of the major scale, each described by its semitone
// intervals from the tonic (degree 0). They are rotations of one another.
export const SCALES = [
  { key: 'ionian', label: 'Gamme majeure (Mode Ionien)', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { key: 'dorian', label: 'Mode Dorien', intervals: [0, 2, 3, 5, 7, 9, 10] },
  { key: 'phrygian', label: 'Mode Phrygien', intervals: [0, 1, 3, 5, 7, 8, 10] },
  { key: 'lydian', label: 'Mode Lydien', intervals: [0, 2, 4, 6, 7, 9, 11] },
  { key: 'mixolydian', label: 'Mode Mixolydien', intervals: [0, 2, 4, 5, 7, 9, 10] },
  { key: 'aeolian', label: 'Gamme mineure (Mode Aéolien)', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { key: 'locrian', label: 'Mode Locrien', intervals: [0, 1, 3, 5, 6, 8, 10] },
]

// True if `semitone` belongs to the scale built on `tonic` with the given
// intervals (compared modulo the octave).
export function isInScale(semitone, tonic, intervals) {
  const degree = (((semitone - tonic) % 12) + 12) % 12
  return intervals.includes(degree)
}
