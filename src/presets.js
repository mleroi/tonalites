// Presets: named sets of settings applied in one go from the "Presets"
// dropdown. To add one, append an entry with a unique `key`, the `label`
// shown in the dropdown, and the `settings` it changes.
//
// The first preset is the default one: the app starts on it, and it must
// list every setting. Any other preset only lists the settings it changes —
// the others take their value from the default preset — so that choosing a
// preset always leads to the same screen, whatever was set before.
//
// Settings and their values:
//   firstNote        first square, as a semitone index (0 = Do1, 12 = Do2,
//                    24 = Do3, 36 = Do4…), from 0 to 72
//   octaves          number of octaves displayed, from 1 to 10
//   numberStart      "note du 1", as a semitone index, from 0 to 96
//   highlightOnes    true / false
//   labelMode        'none' | 'numbers' | 'intervals' | 'names' | 'degrees'
//                    ('degrees' needs a seven-note scale in scaleKey)
//   labelScope       'single' (one octave) | 'all' (every octave)
//   accidentals      'sharps' | 'flats'
//   intervalNames    spelling of the ambiguous intervals, by semitone:
//                    { 6: '#4' or 'b5', 8: 'b6' or '#5', 9: 'M6' or '7°' }
//   showGlide        true / false
//   showNotes        true / false (names with the octave number: Do4)
//   showSimpleNotes  true / false (names without it: Do); not both at once
//   showFrequencies  true / false
//   pianoMode        true / false
//   droneOn          true / false
//   droneNote        drone note, as a semitone index, from 0 to 96
//   droneVolume      from 0 to 100
//   scaleKey         '' (none) or a key of SCALES in notes.js ('ionian'…)
//   scaleAudioMode   'scale-only' | 'all' | 'chords'
//   chordSize        number of notes per chord: 3, 4 or 5
//   scaleHighlightMode    'single' | 'all'
//   hideLabelsOutOfScale  true / false
//   showDegrees      true / false
//   playMode         'short' | 'sustain'
//   instrumentKey    '' (synth) or a key of INSTRUMENTS in instruments.js
//   keyChoice        '' (none) or a key of KEYS in notes.js; unlike choosing
//                    a key by hand, a preset does not let it change the other
//                    settings, so list numberStart, accidentals… as well
//   tessituraChoice  '' (none) or a key of TESSITURAS in notes.js
export const PRESETS = [
  {
    key: 'default',
    label: 'Par défaut',
    settings: {
      firstNote: 24,
      octaves: 3,
      numberStart: 36,
      highlightOnes: true,
      labelMode: 'none',
      labelScope: 'single',
      accidentals: 'sharps',
      intervalNames: { 6: '#4', 8: 'b6', 9: 'M6' },
      showGlide: true,
      showNotes: false,
      showSimpleNotes: false,
      showFrequencies: false,
      pianoMode: false,
      droneOn: false,
      droneNote: 36,
      droneVolume: 50,
      scaleKey: '',
      scaleAudioMode: 'scale-only',
      chordSize: 3,
      scaleHighlightMode: 'single',
      hideLabelsOutOfScale: true,
      showDegrees: false,
      playMode: 'short',
      instrumentKey: '',
      keyChoice: '',
      tessituraChoice: '',
    },
  },
  {
    key: 'major-scale',
    label: 'Gamme majeure',
    settings: {
      instrumentKey: 'piano',
      scaleKey: 'ionian',
      playMode: 'sustain',
      labelMode: 'names',
    },
  },
]

export const DEFAULT_PRESET = PRESETS[0]

// Full settings of a preset: the default ones, overridden by its own.
export function presetSettings(preset) {
  return { ...DEFAULT_PRESET.settings, ...preset.settings }
}
