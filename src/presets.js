// Presets: named sets of settings applied in one go from the "Presets"
// dropdown. To add one, append an entry with a unique `key`, the `label`
// shown in the dropdown, and the `settings` it changes.
//
// The first preset is the default one: the app starts on it, and it must
// list every setting. Any other preset only lists the settings it changes —
// the others take their value from the default preset — so that choosing a
// preset always leads to the same screen, whatever was set before.
//
// A preset can also draw some settings at random, listed in `random` as
// { name: [min, max] } (whole numbers, both included): each time the preset is
// chosen, they take a new value in that range, and any value in it still
// counts as the preset. Controls that only make sense with one preset (to
// draw again, for instance) go in the "preset actions" area of App.vue.
//
// The settings listed in `free` are still set when the preset is chosen, but
// can then be changed without leaving it. The VIEW_SETTINGS below are free in
// every preset. With `free: 'all'`, every setting is: such a preset matches
// any settings, so it is only left by choosing another one.
//
// A preset can also offer `variants`: sub-choices picked from a dropdown in
// the preset actions, each { key, label, settings }. Choosing one applies the
// preset again, then the variant's settings on top of it; the preset alone
// (no variant) is what choosing it from the "Presets" dropdown gives.
//
// A preset or a variant can list `scaleTypes`, kinds of selection among
// 'scale' (seven-note scales), 'pentatonic', 'interval' and 'chord': a list
// of them is then shown in the preset actions, setting scaleKey. A variant's
// list replaces its preset's.
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
//                    | 'marked' (notes marked by hand only)
//   accidentals      'sharps' | 'flats'
//   intervalNames    spelling of the ambiguous intervals, by semitone:
//                    { 6: '#4' or 'b5', 8: 'b6' or '#5', 9: 'M6' or '7°' }
//   showGlide        true / false
//   showNotes        true / false (names with the octave number: Do4)
//   showSimpleNotes  true / false (names without it: Do); not both at once
//   showFrequencies  true / false
//   pianoMode        true / false
//   droneOn          true / false
//   droneNote        drone note, as a semitone index, from 0 to 96; it follows
//                    numberStart, so give it the same value (or make it free
//                    when numberStart is random)
//   droneVolume      from 0 to 100
//   scaleKey         '' (none) or a key of SCALES in notes.js ('ionian'…)
//   scaleAudioMode   'scale-only' | 'all' | 'chords' | 'entity' (the whole
//                    selection played from the hovered note)
//   chordSize        number of notes per chord: 3, 4 or 5
//   scaleHighlightMode    'single' | 'all' | 'none'
//   hideLabelsOutOfScale  true / false
//   hideNotesOutOfScale   true / false
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
      hideNotesOutOfScale: false,
      showDegrees: false,
      playMode: 'short',
      instrumentKey: '',
      keyChoice: '',
      tessituraChoice: '',
    },
  },
  {
    key: 'note-origins',
    label: 'Origines',
    settings: {
      instrumentKey: 'piano',
      playMode: 'sustain',
      highlightOnes: true,
    },
    // Chosen in the dropdown of the preset actions.
    variants: [
      {
        key: 'fifth',
        label: 'Les douzes notes (par le cycle des quintes)',
        // Settings of this sub-choice, on top of the preset's above.
        settings: {
          labelMode: 'numbers',
          labelScope: 'all',
          scaleKey: 'i-p5', 
          scaleAudioMode: 'entity',
          scaleHighlightMode: 'none',
          hideLabelsOutOfScale: false,
        },
      },
      {
        key: 'major-third',
        label: 'La gamme majeure (par les accords majeurs des I IV V)',
        // Settings of this sub-choice, on top of the preset's above.
        settings: {
          labelMode: 'numbers',
          labelScope: 'all',
          scaleKey: 'c-maj', 
          scaleAudioMode: 'entity',
          scaleHighlightMode: 'none',
          hideLabelsOutOfScale: false,
        },
      },
      {
        key: 'major-scale',
        label: 'La gamme majeure',
        // Settings of this sub-choice, on top of the preset's above.
        settings: {
          labelMode: 'numbers',
          labelScope: 'all',
          scaleKey: 'ionian', 
          scaleAudioMode: 'scale-only',
          scaleHighlightMode: 'single',
          hideLabelsOutOfScale: true,
        },
      },
    ],
    free: 'all',
  },
  {
    key: 'hear-intervals',
    label: 'Ecouter les intervalles',
    settings: {
      instrumentKey: 'piano',
      playMode: 'sustain',
      octaves: 2,
      numberStart: 36,
      firstNote: 36,
      labelScope: 'all',
      labelMode: 'intervals',
      showGlide: false,
    },
    free: 'all',
  },
  {
    key: 'identify-intervals',
    label: 'Trouver les intervalles',
    settings: {
      instrumentKey: 'piano',
      playMode: 'sustain',
      octaves: 6,
      firstNote: 12,
      labelScope: 'all',
      scaleKey: 'i-p5',
      scaleHighlightMode: 'all',
      hideNotesOutOfScale: true,
      showGlide: false,
    },
    // The lower note of the interval: any note from Do4 to Si4, drawn again
    // with each interval by the "Changer" buttons of the preset actions.
    random: { numberStart: [36, 47] },
    free: 'all',
  },
  {
    key: 'hear-scales',
    label: 'Ecouter les gammes',
    settings: {
      instrumentKey: 'piano',
      playMode: 'sustain',
      octaves: 2,
      numberStart: 36,
      firstNote: 36,
      labelScope: 'all',
      scaleKey: 'ionian',
      labelMode: 'intervals',
      scaleAudioMode: 'entity',
      scaleHighlightMode: 'scaleHighlightMode',
      showGlide: false,
    },
    free: 'all',
  },
  {
    key: 'identify-scales',
    label: 'Trouver les gammes',
    settings: {
      instrumentKey: 'piano',
      playMode: 'sustain',
      octaves: 3,
      firstNote: 36,
      labelScope: 'all',
      scaleKey: 'ionian',
      scaleHighlightMode: 'all',
      hideNotesOutOfScale: true,
      showGlide: false,
    },
    // The tonic of the scale: any note from Do4 to Si4, drawn again with each
    // scale by the "Changer" buttons of the preset actions.
    random: { numberStart: [36, 47] },
    free: 'all',
  },
  {
    key: 'guess-root',
    label: 'Trouver la tonique',
    settings: {
      instrumentKey: 'piano',
      scaleKey: 'ionian',
      playMode: 'sustain',
      scaleHighlightMode: 'all',
      hideNotesOutOfScale: true,
      showGlide: false,
      highlightOnes: false,
    },
    // The tonic to find by ear: any note from Do4 to Si4.
    random: { numberStart: [36, 47] },
    // Showing the 1s or playing the drone (on the tonic, the drawn "note du
    // 1") gives the answer away: it can be done to check. The scale the tonic
    // is heard in can be picked among the preset actions.
    free: ['highlightOnes', 'droneOn', 'droneNote', 'scaleKey'],
  },
  {
    key: 'hear-chords',
    label: 'Ecouter les accords',
    settings: {
      instrumentKey: 'piano',
      playMode: 'sustain',
      octaves: 2,
      numberStart: 36,
      firstNote: 36,
      labelScope: 'all',
      scaleKey: 'c-maj',
      labelMode: 'intervals',
      scaleHighlightMode: 'all',
      showGlide: false,
    },
    variants: [
      {
        key: 'same-root',
        label: 'Même fondamentale, différentes natures',
        // Settings of this sub-choice, on top of the preset's above.
        settings: {
          scaleAudioMode: 'entity',
        },
        // Every kind of chord, listed in the preset actions.
        scaleTypes: ['chord'],
      },
      {
        key: 'from-scale',
        label: 'Harmonisation des gammes',
        // Settings of this sub-choice, on top of the preset's above.
        settings: {
          scaleKey: 'ionian',
          scaleAudioMode: 'chords',
          labelMode: 'degrees',
        },
        // Every seven-note scale, listed in the preset actions.
        scaleTypes: ['scale'],
      },
    ],
    free: 'all',
  },
  {
    key: 'identify-chords',
    label: 'Trouver la nature des accords',
    settings: {
      instrumentKey: 'piano',
      playMode: 'sustain',
      octaves: 6,
      firstNote: 12,
      scaleKey: 'c-maj',
      scaleHighlightMode: 'all',
      hideNotesOutOfScale: true,
    },
    // The root of the chord: any note from Do4 to Si4, drawn again with each
    // chord by the "Changer" buttons of the preset actions.
    random: { numberStart: [36, 47] },
    free: 'all',
  },
  {
    key: 'melodies',
    label: 'Mélodies',
    settings: {
      instrumentKey: 'piano',
      playMode: 'sustain',
      labelMode: 'intervals',
      // Melodies go above and below the "note du 1": number every octave.
      labelScope: 'all',
      showGlide: false,
      scaleHighlightMode: 'all',
      // Every note stays playable alongside a melody, which may well step out
      // of the chosen scale.
      scaleAudioMode: 'all',
    },
    // A melody is meant to be heard in any key (from the "note du 1") and
    // under any display, so everything can be changed without leaving the
    // preset. The melody itself is chosen among the preset actions, and is
    // not a setting.
    free: 'all',
  },
]

export const DEFAULT_PRESET = PRESETS[0]

// The part of the keyboard in view, moved by the zoom and the drag: a preset
// sets them, but moving around never leaves it.
export const VIEW_SETTINGS = ['firstNote', 'octaves']

// Full settings of a preset: the default ones, overridden by its own, then by
// those of its variant `variantKey` ('' = none).
export function presetSettings(preset, variantKey = '') {
  const variant = preset.variants?.find((v) => v.key === variantKey)
  return { ...DEFAULT_PRESET.settings, ...preset.settings, ...variant?.settings }
}

// A whole number drawn at random between min and max (both included). When
// `current` is given and in range, it is left out, so that drawing again
// always changes the value.
export function drawRandom([min, max], current) {
  const skip = current >= min && current <= max && max > min
  const value = min + Math.floor(Math.random() * (max - min + (skip ? 0 : 1)))
  return skip && value >= current ? value + 1 : value
}
