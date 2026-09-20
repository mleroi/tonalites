<script setup>
import { ref, computed, watch } from 'vue'
import Carre from './components/Carre.vue'
import {
  noteName,
  pitchClassName,
  isBlackKey,
  isInScale,
  scaleDegree,
  scaleRank,
  diatonicChordIntervals,
  chordName,
  CHORD_SIZES,
  INTERVALS,
  SCALES,
  SCALE_TYPES,
  KEYS,
  TESSITURAS,
  TESSITURA_TYPES,
  MIN_NOTE,
  MAX_NOTE,
  MIN_NUMBER_START,
  MAX_NUMBER_START,
} from './notes.js'
import { INSTRUMENTS } from './instruments.js'
import {
  playNote,
  startNote,
  stopNote,
  releaseAllNotes,
  setInstrument,
  startAudio,
  startDrone,
  stopDrone,
  setDroneNote,
  setDroneVolume,
  semitoneToFrequency,
  startGlide,
  setGlideFrequency,
  stopGlide,
} from './audio.js'

// Starting note of the first square, as an absolute semitone index (0 = Do1).
const firstNote = ref(24)

// Number of octaves selected by the slider (between 1 and 10).
const octaves = ref(3)

// When enabled, squares are colored like piano keys (white / black).
const pianoMode = ref(false)

// Whether to display the note names below the squares.
const showNotes = ref(false)

// Whether to display the frequencies (in Hz) below the note names.
const showFrequencies = ref(false)

// Note that carries the number "1", as an absolute semitone index (0 = Do1).
const numberStart = ref(36)

// Continuous background drone.
const droneOn = ref(false)

// Drone note, as an absolute semitone index (0 = Do1), independent of the
// "note du 1".
const droneNote = ref(36)

// Drone volume on the displayed 0..100 scale, which maps to 0..50% of the
// actual level (so the displayed 100 is half the level of the played notes).
const droneVolume = ref(50)

// Start/stop the drone when toggled, and follow its own note while active.
watch(droneOn, (on) => {
  if (on) {
    setDroneVolume(droneVolume.value / 2)
    startDrone(droneNote.value)
  } else {
    stopDrone()
  }
})
watch(droneNote, (n) => {
  if (droneOn.value) setDroneNote(n)
})
watch(droneVolume, (v) => setDroneVolume(v / 2))

// Label content shown in squares: 'none', 'intervals' (R, b2, M2…),
// 'numbers' (1..12) or 'names' (Do, Ré…). Intervals/numbers are counted from
// the "note du 1" (degree 0); names are the absolute pitch class.
const labelMode = ref('none')

// Label scope: 'single' = only the octave starting on the "note du 1",
// 'all' = every octave. Applies to both intervals and numbers.
const labelScope = ref('single')

// How accidentals are written everywhere note names appear: 'sharps' or 'flats'.
const accidentals = ref('sharps')
const useFlats = computed(() => accidentals.value === 'flats')

// Three intervals have two equally correct names, and which one applies
// depends on the chord being read: a diminished fifth in a diminished chord
// but an augmented fourth elsewhere, an augmented fifth in an augmented
// chord, a diminished seventh in a diminished seventh chord. The app makes no
// attempt to infer it — the spelling is picked by hand and applies wherever
// intervals are written, in the squares as on the chord geometry strip.
const INTERVAL_CHOICES = [
  { degree: 6, names: ['#4', 'b5'] },
  { degree: 8, names: ['b6', '#5'] },
  { degree: 9, names: ['M6', '7°'] },
]
const intervalNames = ref(
  Object.fromEntries(INTERVAL_CHOICES.map(({ degree, names }) => [degree, names[0]])),
)

// Name of the interval `degree` semitones above the reference note.
function intervalName(degree) {
  return intervalNames.value[degree] ?? INTERVALS[degree]
}

// Selected key ('' = none). Choosing one moves the "note du 1" to its tonic in
// octave 4 (Do4 = semitone 36) and adapts the accidentals spelling.
const keyChoice = ref('')
watch(keyChoice, (k) => {
  const key = KEYS.find((x) => x.key === k)
  if (!key) return
  numberStart.value = 36 + key.pitchClass
  accidentals.value = key.accidentals
  scaleKey.value = 'ionian' // Gamme majeure
  labelMode.value = 'names' // Libellés : nom des notes
})

// Resynchronize: if "note du 1" or accidentals are changed by hand so they no
// longer match the selected key, clear the key selection.
watch([numberStart, accidentals], () => {
  const key = KEYS.find((x) => x.key === keyChoice.value)
  if (!key) return
  if (numberStart.value !== 36 + key.pitchClass || accidentals.value !== key.accidentals) {
    keyChoice.value = ''
  }
})

// When enabled, every "1" (the tonic and its octaves) is highlighted, even
// when its number is not displayed.
const highlightOnes = ref(true)

// True if the note is a "1" (an octave of the "note du 1").
function isOneNote(semitone) {
  return (((semitone - numberStart.value) % 12) + 12) % 12 === 0
}

// Selected scale key ('' = no scale). Its tonic is the "note du 1".
const scaleKey = ref('')

// Audio mode for scales: 'scale-only' = only scale notes are heard,
// 'all' = every note is heard. Only relevant while a scale is selected.
const scaleAudioMode = ref('scale-only')

// Highlight scope: 'single' = highlight only the octave of the "note du 1",
// 'all' = highlight scale notes across every octave.
const scaleHighlightMode = ref('single')

// When a scale is selected, hide the labels of squares that are not
// highlighted (i.e. only scale notes keep their inner label).
const hideLabelsOutOfScale = ref(true)

// The currently selected scale object, or null when none is selected.
const selectedScale = computed(() => SCALES.find((s) => s.key === scaleKey.value) || null)

// Whether to write each scale note's degree in Roman numerals below its square.
const showDegrees = ref(false)

// True when the selection is one of the seven-note scales. Both the degrees
// and the chord-listening mode depend on this: intervals and chords are not
// numbered in degrees, and a pentatonic's degrees are named after the diatonic
// positions it keeps (I II III V VI) rather than its own five ranks, so
// stacking or numbering them here would be wrong.
const sevenNoteScale = computed(
  () => selectedScale.value !== null && selectedScale.value.type === 'scale',
)

// The degree labels only exist for a seven-note scale, so leaving one behind
// would blank out every square: fall back to the numbering instead.
watch(sevenNoteScale, (ok) => {
  if (!ok && labelMode.value === 'degrees') labelMode.value = 'numbers'
})

// Roman numeral of a note within the selected scale, or null when no
// seven-note scale is selected or the note falls outside it. Unlike the
// highlight, this is not limited to a single octave: a degree holds wherever
// the note appears. Shared by the degree line below the squares and by the
// 'degrees' label mode, so both read the same numeral.
function romanDegree(semitone) {
  if (!sevenNoteScale.value) return null
  return scaleDegree(semitone, numberStart.value, selectedScale.value.intervals)
}

// Roman numeral shown below a square, or null when degrees are hidden.
function squareDegree(semitone) {
  return showDegrees.value ? romanDegree(semitone) : null
}

// Note sets of a given type, for the grouped dropdown.
function scalesOfType(type) {
  return SCALES.filter((s) => s.type === type)
}

// Selected tessitura ('' = none); its notes get a pastel-yellow background.
const tessituraChoice = ref('')
const selectedTessitura = computed(
  () => TESSITURAS.find((t) => t.key === tessituraChoice.value) || null,
)

// Tessituras of a given type, for the grouped dropdown.
function tessiturasOfType(type) {
  return TESSITURAS.filter((t) => t.type === type)
}

// True if the note falls within the selected tessitura's range.
function inTessitura(semitone) {
  const t = selectedTessitura.value
  return t ? semitone >= t.low && semitone <= t.high : false
}

// The selection's notes, one octave from the tonic ("note du 1").
const selectionNotes = computed(() =>
  selectedScale.value ? selectedScale.value.intervals.map((d) => numberStart.value + d) : [],
)

// Pending timers for the sequential playback, cleared on each replay.
let sequenceTimers = []

// Absolute semitones currently being played, to highlight their squares.
const playingNotes = ref(new Set())

// Cancel any running playback and clear the highlight.
function clearPlayback() {
  sequenceTimers.forEach(clearTimeout)
  sequenceTimers = []
  playingNotes.value.clear()
}

// Highlight a square for a given duration (ms), then clear it.
function flashNote(semitone, duration) {
  playingNotes.value.add(semitone)
  setTimeout(() => playingNotes.value.delete(semitone), duration)
}

// Play a note and briefly highlight its square.
function playAndFlash(semitone, duration) {
  playNote(semitone)
  flashNote(semitone, duration)
}

// Play a list of notes one by one, 300 ms apart, highlighting each in turn.
function playSequence(notes) {
  clearPlayback()
  notes.forEach((n, i) => {
    sequenceTimers.push(setTimeout(() => playAndFlash(n, 280), i * 300))
  })
}

// Play all selection notes at once.
function playSelectionTogether() {
  clearPlayback()
  selectionNotes.value.forEach((n) => playAndFlash(n, 600))
}

// Play the selection notes one by one, ascending.
function playSelectionAscending() {
  playSequence(selectionNotes.value)
}

// Play the selection notes one by one, descending.
function playSelectionDescending() {
  playSequence([...selectionNotes.value].reverse())
}

// True if the note belongs to the selected scale (false when no scale).
function inScale(semitone) {
  if (!selectedScale.value) return false
  return isInScale(semitone, numberStart.value, selectedScale.value.intervals)
}

// True if the note should be visually highlighted. In 'single' mode the
// highlight is limited to the octave starting on the "note du 1".
function isHighlighted(semitone) {
  if (!inScale(semitone)) return false
  if (scaleHighlightMode.value === 'all') return true
  const relative = semitone - numberStart.value
  return relative >= 0 && relative < 12
}

// True if the note should be heard when played, given the current scale settings.
function isAudible(semitone) {
  if (!selectedScale.value || scaleAudioMode.value === 'all') return true
  return inScale(semitone)
}

// 12 squares per octave.
const carres = computed(() => Array.from({ length: octaves.value * 12 }, (_, i) => i))

// Gap between squares in pixels (Tailwind gap-1.5 = 0.375rem = 6px). Anything
// that has to line up with the squares — the glissando band, the chord
// geometry strip — measures them from this.
const SQUARE_GAP = 6

// Width of one square as a CSS expression, given a row that fills the whole
// area: the squares share it evenly, minus the gaps between them.
const squareWidthCss = computed(() => {
  const count = carres.value.length
  return `((100% - ${(count - 1) * SQUARE_GAP}px) / ${count})`
})

// Name of the currently selected starting note (shown next to the slider).
const firstNoteName = computed(() => noteName(firstNote.value, useFlats.value))

// Name of the note that carries the "1" (shown next to its slider).
const numberStartName = computed(() => noteName(numberStart.value, useFlats.value))

// Name of the drone note (shown next to its slider).
const droneNoteName = computed(() => noteName(droneNote.value, useFlats.value))

// Label to display in a square, based on its distance from `numberStart`.
// Returns null when nothing should be displayed (no labels, or out of the
// single octave when scope is 'single').
function squareLabel(semitone) {
  if (labelMode.value === 'none') {
    return null
  }
  // With a scale selected, optionally only highlighted (in-scale) squares keep
  // their label.
  if (selectedScale.value && hideLabelsOutOfScale.value && !isHighlighted(semitone)) {
    return null
  }
  const relative = semitone - numberStart.value
  if (labelScope.value === 'single' && !(relative >= 0 && relative < 12)) {
    return null
  }
  if (labelMode.value === 'names') {
    return pitchClassName(semitone, useFlats.value)
  }
  if (labelMode.value === 'degrees') {
    return romanDegree(semitone)
  }
  const degree = (((relative % 12) + 12) % 12)
  return labelMode.value === 'intervals' ? intervalName(degree) : String(degree + 1)
}

// Sound of the squares: '' = the built-in synth, otherwise an instrument key
// from the registry. A sampled instrument downloads its samples on selection,
// during which the synth keeps playing.
const instrumentKey = ref('')
const instrumentLoading = ref(false)

// Identifies the latest selection, so that a slow load which is no longer the
// current choice does not clear the indicator of the one that replaced it.
let instrumentRequest = 0
watch(instrumentKey, async (key) => {
  const request = ++instrumentRequest
  instrumentLoading.value = key !== ''
  await setInstrument(key)
  if (request === instrumentRequest) instrumentLoading.value = false
})

// Number of notes in the chords played by the chord-listening mode.
const chordSize = ref(3)

// True when hovering a square should play a chord rather than a single note.
// Guarded by the scale type, so a selection left on 'chords' while switching
// to a pentatonic or a chord falls back to playing single notes.
const chordMode = computed(() => scaleAudioMode.value === 'chords' && sevenNoteScale.value)

// Name of the chord currently under the pointer, shown below the squares.
const hoveredChord = ref('')

// Notes of that same chord, kept highlighted for as long as the pointer stays
// in the square, and reported on the geometry strip. Separate from
// `playingNotes`, whose highlight follows the sound and so fades after a
// moment in the short play mode. The first note is the chord's root.
const hoveredChordNotes = ref([])

// The chord geometry strip: a fixed row of squares, always starting on the
// chord's root, where the chord under the pointer is reported so that its
// shape — and only its shape — changes from one chord to the next. Twelve
// squares, because a four-note chord reaches at most a major seventh over its
// root, eleven semitones away. Five-note chords go further and are left out.
const CHORD_STRIP_LENGTH = 12
const chordStripCells = Array.from({ length: CHORD_STRIP_LENGTH }, (_, i) => i)
const showChordStrip = computed(() => chordMode.value && chordSize.value <= 4)

// The strip is exactly as wide as twelve squares of the main row, so its
// squares are the same size and their labels stay readable. The block is then
// centered, which keeps its left edge fixed since its width only depends on
// the square size.
const chordStripStyle = computed(() => ({
  width: `calc(${CHORD_STRIP_LENGTH} * ${squareWidthCss.value} + ${
    (CHORD_STRIP_LENGTH - 1) * SQUARE_GAP
  }px)`,
}))

// Whether the hovered chord occupies the square `offset` semitones above its
// root.
function chordStripFilled(offset) {
  const notes = hoveredChordNotes.value
  return notes.length > 0 && notes.includes(notes[0] + offset)
}

// Label of an occupied square, always the interval from the chord's root
// (which is the first square) whatever the label mode chosen for the main
// row: the strip describes how the chord is built, not which notes it lands
// on. Empty squares stay blank.
function chordStripLabel(offset) {
  return chordStripFilled(offset) ? intervalName(offset) : null
}

// Notes of a chord being held in sustain mode, so that exactly those can be
// released on leaving — recomputing them could differ if a setting changed in
// the meantime, which would leave a note ringing.
let sustainedChord = []

// The chord rooted on `semitone`, or null when that note is not in the scale
// (chords are only built on scale notes).
function chordOn(semitone) {
  const scale = selectedScale.value
  const rank = scaleRank(semitone, numberStart.value, scale.intervals)
  if (rank < 0) return null
  const intervals = diatonicChordIntervals(scale.intervals, rank, chordSize.value)
  return { notes: intervals.map((d) => semitone + d), name: chordName(intervals) }
}

// Play mode: 'short' = a brief note on hover (default), 'sustain' = the note
// rings as long as the pointer stays inside the square.
const playMode = ref('short')

// Releasing any stuck sustained note (and its highlight) when leaving the
// sustain mode.
watch(playMode, (mode) => {
  if (mode !== 'sustain') {
    releaseAllNotes()
    playingNotes.value.clear()
    sustainedChord = []
  }
})

// Changing the chord size or the listening mode while a chord is held would
// leave it with no matching release, so silence whatever is ringing.
watch([chordSize, scaleAudioMode, chordMode], () => {
  releaseAllNotes()
  playingNotes.value.clear()
  sustainedChord = []
  hoveredChord.value = ''
  hoveredChordNotes.value = []
})

// Pointer enters a square: play it (if audible) according to the play mode,
// and highlight it (briefly in short mode, until leaving in sustain mode).
// In chord mode the whole chord is played and highlighted instead.
function enterNote(semitone) {
  if (chordMode.value) {
    const chord = chordOn(semitone)
    if (!chord) {
      // Not a scale note: nothing to play, no name to show and nothing to
      // highlight.
      hoveredChord.value = ''
      hoveredChordNotes.value = []
      return
    }
    hoveredChord.value = chord.name || ''
    hoveredChordNotes.value = chord.notes
    if (playMode.value === 'sustain') {
      chord.notes.forEach((n) => {
        startNote(n)
        playingNotes.value.add(n)
      })
      sustainedChord = chord.notes
    } else {
      chord.notes.forEach((n) => playAndFlash(n, 400))
    }
    return
  }
  if (!isAudible(semitone)) return
  if (playMode.value === 'sustain') {
    startNote(semitone)
    playingNotes.value.add(semitone)
  } else {
    playAndFlash(semitone, 250)
  }
}

// Pointer leaves a square: stop and unhighlight its sustained note, or the
// whole chord it was holding.
function leaveNote(semitone) {
  if (chordMode.value) {
    hoveredChord.value = ''
    hoveredChordNotes.value = []
    sustainedChord.forEach((n) => {
      stopNote(n)
      playingNotes.value.delete(n)
    })
    sustainedChord = []
    return
  }
  if (playMode.value === 'sustain') {
    stopNote(semitone)
    playingNotes.value.delete(semitone)
  }
}

// Mouse pressed on a square: re-strike and re-flash it in short mode — the
// whole chord when in chord mode.
function pressNote(semitone) {
  if (playMode.value !== 'short') return
  if (chordMode.value) {
    const chord = chordOn(semitone)
    if (chord) chord.notes.forEach((n) => playAndFlash(n, 400))
    return
  }
  if (isAudible(semitone)) {
    playAndFlash(semitone, 250)
  }
}

// Continuous glissando band shown above the squares (optional).
const showGlide = ref(true)

// Template ref to the glissando band, used to map pointer X to a pitch.
const glideTrack = ref(null)

// Whether a glissando drag is in progress, plus the live indicator position
// (as a 0..1 fraction of the band width) and current frequency.
const gliding = ref(false)
const glideFraction = ref(0)
const glideHz = ref(0)
// Note name shown only when the glissando lands (almost) exactly on a note.
const glideNoteName = ref('')

// Continuous semitone at a given clientX over the band: the center of square i
// maps exactly to firstNote + i; in between, the value interpolates linearly.
function semitoneAtClientX(clientX) {
  const rect = glideTrack.value.getBoundingClientRect()
  const count = carres.value.length
  const squareWidth = (rect.width - (count - 1) * SQUARE_GAP) / count
  const step = squareWidth + SQUARE_GAP
  let i = (clientX - rect.left - squareWidth / 2) / step
  i = Math.max(0, Math.min(count - 1, i))
  return { semitone: firstNote.value + i, fraction: (clientX - rect.left) / rect.width }
}

// Plays the continuous pitch under the pointer and updates the indicator.
function updateGlide(clientX, attack) {
  const { semitone, fraction } = semitoneAtClientX(clientX)
  const frequency = semitoneToFrequency(semitone)
  glideFraction.value = Math.max(0, Math.min(1, fraction))
  // Show the note name when the integer part of the current frequency matches
  // the integer part of the nearest note's frequency. When on a note, display
  // that note's exact frequency, so the readout equals the value shown under
  // the square (which uses the same note frequency).
  const nearest = Math.round(semitone)
  const noteFrequency = semitoneToFrequency(nearest)
  const onNote = Math.trunc(frequency) === Math.trunc(noteFrequency)
  glideNoteName.value = onNote ? noteName(nearest, useFlats.value) : ''
  glideHz.value = onNote ? noteFrequency : frequency
  if (attack) {
    startGlide(frequency)
  } else {
    setGlideFrequency(frequency)
  }
}

// Hovering the band is enough to play: start on enter, follow on move, stop
// on leave (no click required, like the squares).
function onGlideEnter(e) {
  gliding.value = true
  updateGlide(e.clientX, true)
}

function onGlideMove(e) {
  if (gliding.value) updateGlide(e.clientX, false)
}

function onGlideLeave() {
  if (!gliding.value) return
  gliding.value = false
  stopGlide()
}

// Welcome overlay shown on first load; clicking it anywhere starts the audio
// (the click is the required user gesture) and dismisses the overlay.
const showOverlay = ref(true)
function dismissOverlay() {
  startAudio()
  showOverlay.value = false
}
</script>

<template>
  <div class="flex h-full flex-col bg-white text-neutral-800">
    <!-- Welcome overlay (first load): click anywhere to start the audio -->
    <div
      v-if="showOverlay"
      class="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-8 bg-white/40 backdrop-blur-xs"
      @click="dismissOverlay"
    >
      <h1 class="text-4xl font-light tracking-wide text-neutral-800">Bienvenue</h1>
      <button
        type="button"
        class="cursor-pointer rounded-full bg-neutral-900 px-8 py-3 text-base font-medium text-white transition-colors duration-150 hover:bg-neutral-700"
      >
        Jouer :)
      </button>
    </div>

    <!-- Squares display area -->
    <main class="flex flex-1 items-center justify-center px-6">
      <div class="flex w-full flex-col gap-3">
        <!-- Continuous glissando band, aligned with the squares row -->
        <div
          v-if="showGlide"
          ref="glideTrack"
          class="relative h-40 w-full cursor-ew-resize touch-none select-none overflow-hidden rounded-md border border-neutral-200 bg-gradient-to-r from-neutral-50 to-neutral-200"
          @pointerenter="onGlideEnter"
          @pointermove="onGlideMove"
          @pointerleave="onGlideLeave"
        >
          <!-- Live position indicator -->
          <div
            v-if="gliding"
            class="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-neutral-800"
            :style="{ left: `${glideFraction * 100}%` }"
          ></div>
          <span
            v-if="gliding"
            class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs tabular-nums text-neutral-500"
          >
            <template v-if="glideNoteName">{{ glideNoteName }} - </template>{{ Math.round(glideHz) }} Hz
          </span>
        </div>

        <!-- Notes row -->
        <div class="flex w-full items-start gap-1.5">
          <Carre
            v-for="i in carres"
            :key="i"
            :index="i"
            :label="squareLabel(firstNote + i)"
            :mark-tonic="isOneNote(firstNote + i) && squareLabel(firstNote + i) !== null"
            :note="noteName(firstNote + i, useFlats)"
            :show-note="showNotes"
            :frequency="`${Math.round(semitoneToFrequency(firstNote + i))} Hz`"
            :show-frequency="showFrequencies"
            :degree="squareDegree(firstNote + i)"
            :piano-mode="pianoMode"
            :black="isBlackKey(firstNote + i)"
            :highlighted="isHighlighted(firstNote + i)"
            :highlight-one="highlightOnes && isOneNote(firstNote + i)"
            :in-tessitura="inTessitura(firstNote + i)"
            :playing="playingNotes.has(firstNote + i)"
            :in-chord="hoveredChordNotes.includes(firstNote + i)"
            @press="pressNote(firstNote + i)"
            @enter="enterNote(firstNote + i)"
            @leave="leaveNote(firstNote + i)"
          />
        </div>

        <!-- What the chord under the pointer is, and how it is built: the two
             sit close together so they read as one block, away from the row
             of squares above. -->
        <div v-if="chordMode" class="flex w-full flex-col gap-1">
          <!-- The name row keeps its height whether or not a chord sounds, so
               the squares above never shift while sweeping across them. -->
          <div class="flex h-7 items-center justify-center">
            <span class="select-none text-base tracking-wide text-neutral-600">
              {{ hoveredChord }}
            </span>
          </div>

          <!-- Geometry of the chord: the strip is always there while the
               chord mode is on, and always starts at the same place, so only
               the drawing of the chord moves. -->
          <div
            v-if="showChordStrip"
            class="mx-auto flex max-w-full gap-1.5"
            :style="chordStripStyle"
          >
            <Carre
              v-for="offset in chordStripCells"
              :key="offset"
              :index="offset"
              :label="chordStripLabel(offset)"
              :in-chord="chordStripFilled(offset)"
              :show-note="false"
              inert
            />
          </div>
        </div>
      </div>
    </main>

    <!-- Controls -->
    <footer class="border-t border-neutral-100 px-6 py-8">
      <div class="mx-auto grid max-w-6xl grid-cols-1 items-start gap-x-10 gap-y-6 md:grid-cols-2 lg:grid-cols-4">
        <!-- Column 1: notes, octaves, numbering -->
        <div class="flex flex-col gap-6">
        <!-- First note -->
        <div class="flex flex-col gap-3">
          <div class="flex items-baseline justify-between">
            <label for="first-note" class="text-sm font-medium tracking-wide text-neutral-600">
              Première note
            </label>
            <span class="text-sm tabular-nums text-neutral-400">{{ firstNoteName }}</span>
          </div>
          <input
            id="first-note"
            v-model.number="firstNote"
            type="range"
            :min="MIN_NOTE"
            :max="MAX_NOTE"
            step="1"
            class="w-full accent-neutral-800"
          />
        </div>

        <!-- Number of octaves -->
        <div class="flex flex-col gap-3">
          <div class="flex items-baseline justify-between">
            <label for="octaves" class="text-sm font-medium tracking-wide text-neutral-600">
              Nombre d'octaves
            </label>
            <span class="text-sm tabular-nums text-neutral-400">{{ octaves }}</span>
          </div>
          <input
            id="octaves"
            v-model.number="octaves"
            type="range"
            min="1"
            max="10"
            step="1"
            class="w-full accent-neutral-800"
          />
        </div>

        <!-- Note carrying the number 1 -->
        <div class="flex flex-col gap-3">
          <div class="flex items-baseline justify-between">
            <label for="number-start" class="text-sm font-medium tracking-wide text-neutral-600">
              Note du « 1 »
            </label>
            <span class="text-sm tabular-nums text-neutral-400">{{ numberStartName }}</span>
          </div>
          <input
            id="number-start"
            v-model.number="numberStart"
            type="range"
            :min="MIN_NUMBER_START"
            :max="MAX_NUMBER_START"
            step="1"
            class="w-full accent-neutral-800"
          />
        </div>

        <!-- Highlight the "1" notes -->
        <label for="highlight-ones" class="flex cursor-pointer items-center gap-3">
          <input
            id="highlight-ones"
            v-model="highlightOnes"
            type="checkbox"
            class="size-4 accent-neutral-800"
          />
          <span class="text-sm font-medium tracking-wide text-neutral-600">
            Mettre en évidence les 1
          </span>
        </label>

        <!-- Labels -->
        <div class="flex flex-col gap-3">
          <span class="text-sm font-medium tracking-wide text-neutral-600">Libellés</span>
          <div class="flex flex-wrap gap-x-6 gap-y-2">
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="labelMode"
                type="radio"
                value="none"
                class="size-4 accent-neutral-800"
              />
              <span class="text-sm text-neutral-600">Aucun</span>
            </label>
            <label class="flex cursor-pointer items-center gap-2">
              <input
              v-model="labelMode"
              type="radio"
              value="numbers"
              class="size-4 accent-neutral-800"
              />
              <span class="text-sm text-neutral-600">Numérotation</span>
            </label>
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="labelMode"
                type="radio"
                value="intervals"
                class="size-4 accent-neutral-800"
              />
              <span class="text-sm text-neutral-600">Intervalles</span>
            </label>
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="labelMode"
                type="radio"
                value="names"
                class="size-4 accent-neutral-800"
              />
              <span class="text-sm text-neutral-600">Nom des notes</span>
            </label>
            <!-- Degrees only apply to a scale, not to an interval or a chord -->
            <label v-if="sevenNoteScale" class="flex cursor-pointer items-center gap-2">
              <input
                v-model="labelMode"
                type="radio"
                value="degrees"
                class="size-4 accent-neutral-800"
              />
              <span class="text-sm text-neutral-600">Degrés</span>
            </label>
          </div>

          <!-- Label scope (applies to intervals and numbers alike) -->
          <div v-if="labelMode !== 'none'" class="flex flex-wrap gap-x-6 gap-y-2 pt-1">
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="labelScope"
                type="radio"
                value="single"
                class="size-4 accent-neutral-800"
              />
              <span class="text-sm text-neutral-600">Une octave</span>
            </label>
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="labelScope"
                type="radio"
                value="all"
                class="size-4 accent-neutral-800"
              />
              <span class="text-sm text-neutral-600">Toutes les octaves</span>
            </label>
          </div>

          <!-- Accidentals: affects every note name shown in the app -->
          <div class="flex flex-col gap-2 pt-1">
            <span class="text-sm font-medium tracking-wide text-neutral-600">
              Affichage des altérations
            </span>
            <div class="flex flex-wrap gap-x-6 gap-y-2">
              <label class="flex cursor-pointer items-center gap-2">
                <input
                  v-model="accidentals"
                  type="radio"
                  value="sharps"
                  class="size-4 accent-neutral-800"
                />
                <span class="text-sm text-neutral-600">Dièses</span>
              </label>
              <label class="flex cursor-pointer items-center gap-2">
                <input
                  v-model="accidentals"
                  type="radio"
                  value="flats"
                  class="size-4 accent-neutral-800"
                />
                <span class="text-sm text-neutral-600">Bémols</span>
              </label>
            </div>
          </div>

          <!-- Spelling of the three ambiguous intervals, one pair per row -->
          <div class="flex flex-col gap-2 pt-1">
            <span class="text-sm font-medium tracking-wide text-neutral-600">
              Affichage des intervalles
            </span>
            <div
              v-for="choice in INTERVAL_CHOICES"
              :key="choice.degree"
              class="flex flex-wrap gap-x-6 gap-y-2"
            >
              <label
                v-for="name in choice.names"
                :key="name"
                class="flex cursor-pointer items-center gap-2"
              >
                <input
                  v-model="intervalNames[choice.degree]"
                  type="radio"
                  :value="name"
                  class="size-4 accent-neutral-800"
                />
                <span class="text-sm text-neutral-600">{{ name }}</span>
              </label>
            </div>
          </div>
        </div>

        </div>

        <!-- Column 2: display options, piano, drone -->
        <div class="flex flex-col gap-6">
        <!-- Glissando band -->
        <label for="show-glide" class="flex cursor-pointer items-center gap-3">
          <input
            id="show-glide"
            v-model="showGlide"
            type="checkbox"
            class="size-4 accent-neutral-800"
          />
          <span class="text-sm font-medium tracking-wide text-neutral-600">
            Bandeau glissando
          </span>
        </label>

        <!-- Show note names -->
        <label for="show-notes" class="flex cursor-pointer items-center gap-3">
          <input
            id="show-notes"
            v-model="showNotes"
            type="checkbox"
            class="size-4 accent-neutral-800"
          />
          <span class="text-sm font-medium tracking-wide text-neutral-600">
            Afficher les notes
          </span>
        </label>

        <!-- Show frequencies -->
        <label for="show-frequencies" class="flex cursor-pointer items-center gap-3">
          <input
            id="show-frequencies"
            v-model="showFrequencies"
            type="checkbox"
            class="size-4 accent-neutral-800"
          />
          <span class="text-sm font-medium tracking-wide text-neutral-600">
            Afficher les fréquences
          </span>
        </label>

        <!-- Piano mode -->
        <label for="piano-mode" class="flex cursor-pointer items-center gap-3">
          <input
            id="piano-mode"
            v-model="pianoMode"
            type="checkbox"
            class="size-4 accent-neutral-800"
          />
          <span class="text-sm font-medium tracking-wide text-neutral-600">Mode piano</span>
        </label>

        <!-- Drone -->
        <div class="flex flex-col gap-3">
          <label for="drone" class="flex cursor-pointer items-center gap-3">
            <input
              id="drone"
              v-model="droneOn"
              type="checkbox"
              class="size-4 accent-neutral-800"
            />
            <span class="text-sm font-medium tracking-wide text-neutral-600">Drone</span>
          </label>

          <!-- Drone note and volume (only relevant when the drone is on) -->
          <div v-if="droneOn" class="flex flex-col gap-3 pl-7">
            <div class="flex items-baseline justify-between">
              <label for="drone-note" class="text-sm tracking-wide text-neutral-500">
                Note du drone
              </label>
              <span class="text-sm tabular-nums text-neutral-400">{{ droneNoteName }}</span>
            </div>
            <input
              id="drone-note"
              v-model.number="droneNote"
              type="range"
              :min="MIN_NUMBER_START"
              :max="MAX_NUMBER_START"
              step="1"
              class="w-full accent-neutral-800"
            />

            <div class="flex items-baseline justify-between">
              <label for="drone-volume" class="text-sm tracking-wide text-neutral-500">
                Volume du drone
              </label>
              <span class="text-sm tabular-nums text-neutral-400">{{ droneVolume }}%</span>
            </div>
            <input
              id="drone-volume"
              v-model.number="droneVolume"
              type="range"
              min="0"
              max="100"
              step="1"
              class="w-full accent-neutral-800"
            />
          </div>
        </div>
        </div>

        <!-- Column 3: scales/intervals/chords, play mode -->
        <div class="flex flex-col gap-6">
        <!-- Scale -->
        <div class="flex flex-col gap-3">
          <label for="scale" class="text-sm font-medium tracking-wide text-neutral-600">
            Gammes / Intervalles / Accords
          </label>
          <select
            id="scale"
            v-model="scaleKey"
            class="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 accent-neutral-800 focus:border-neutral-400 focus:outline-none"
          >
            <option value="">Aucun</option>
            <optgroup v-for="g in SCALE_TYPES" :key="g.type" :label="g.label">
              <option v-for="s in scalesOfType(g.type)" :key="s.key" :value="s.key">
                {{ s.label }}
              </option>
            </optgroup>
          </select>

          <!-- Listening mode (only relevant when a scale is selected) -->
          <div v-if="selectedScale" class="flex flex-col gap-2 pt-1">
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="scaleAudioMode"
                type="radio"
                value="scale-only"
                class="size-4 accent-neutral-800"
              />
              <span class="text-sm text-neutral-600">N'entendre que les notes de la sélection</span>
            </label>
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="scaleAudioMode"
                type="radio"
                value="all"
                class="size-4 accent-neutral-800"
              />
              <span class="text-sm text-neutral-600">Entendre toutes les notes</span>
            </label>

            <!-- Chords are built by stacking scale notes, which only makes
                 sense for a seven-note scale -->
            <label v-if="sevenNoteScale" class="flex cursor-pointer items-center gap-2">
              <input
                v-model="scaleAudioMode"
                type="radio"
                value="chords"
                class="size-4 accent-neutral-800"
              />
              <span class="text-sm text-neutral-600">Entendre les accords</span>
            </label>

            <!-- How many notes each chord has -->
            <div v-if="chordMode" class="flex flex-wrap gap-x-6 gap-y-2 pl-6">
              <label
                v-for="size in CHORD_SIZES"
                :key="size"
                class="flex cursor-pointer items-center gap-2"
              >
                <input
                  v-model.number="chordSize"
                  type="radio"
                  :value="size"
                  class="size-4 accent-neutral-800"
                />
                <span class="text-sm text-neutral-600">Accords {{ size }} sons</span>
              </label>
            </div>
          </div>

          <!-- Play the selection (hover to listen) -->
          <div v-if="selectedScale" class="flex flex-col gap-2 pt-2">
            <span class="text-sm font-medium tracking-wide text-neutral-600">
              Écouter la sélection
            </span>
            <div class="flex gap-2">
              <div
                class="flex flex-1 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 px-1 py-2 text-center text-sm text-neutral-600 transition-colors duration-150 select-none cursor-pointer hover:bg-neutral-200"
                @mouseenter="playSelectionAscending"
              >
                En montant
              </div>
              <div
                class="flex flex-1 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 px-1 py-2 text-center text-sm text-neutral-600 transition-colors duration-150 select-none cursor-pointer hover:bg-neutral-200"
                @mouseenter="playSelectionDescending"
              >
                En descendant
              </div>
              <div
                class="flex flex-1 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 px-1 py-2 text-center text-sm text-neutral-600 transition-colors duration-150 select-none cursor-pointer hover:bg-neutral-200"
                @mouseenter="playSelectionTogether"
              >
                Ensemble
              </div>
            </div>
          </div>

          <!-- Highlight scope (only relevant when a scale is selected) -->
          <div v-if="selectedScale" class="flex flex-col gap-2 pt-2">
            <span class="text-sm font-medium tracking-wide text-neutral-600">
              Mise en évidence
            </span>
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="scaleHighlightMode"
                type="radio"
                value="single"
                class="size-4 accent-neutral-800"
              />
              <span class="text-sm text-neutral-600">Une octave</span>
            </label>
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="scaleHighlightMode"
                type="radio"
                value="all"
                class="size-4 accent-neutral-800"
              />
              <span class="text-sm text-neutral-600">Toutes les octaves</span>
            </label>

            <label class="flex cursor-pointer items-center gap-2 pt-1">
              <input
                v-model="hideLabelsOutOfScale"
                type="checkbox"
                class="size-4 accent-neutral-800"
              />
              <span class="text-sm text-neutral-600">Masquer les libellés hors sélection</span>
            </label>

            <!-- Degrees only apply to a scale, not to an interval or a chord -->
            <label v-if="sevenNoteScale" class="flex cursor-pointer items-center gap-2">
              <input
                v-model="showDegrees"
                type="checkbox"
                class="size-4 accent-neutral-800"
              />
              <span class="text-sm text-neutral-600">Afficher les degrés</span>
            </label>
          </div>
        </div>

        <!-- Play mode -->
        <div class="flex flex-col gap-3">
          <span class="text-sm font-medium tracking-wide text-neutral-600">Mode de jeu</span>
          <div class="flex flex-wrap gap-x-6 gap-y-2">
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="playMode"
                type="radio"
                value="short"
                class="size-4 accent-neutral-800"
              />
              <span class="text-sm text-neutral-600">Note courte</span>
            </label>
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="playMode"
                type="radio"
                value="sustain"
                class="size-4 accent-neutral-800"
              />
              <span class="text-sm text-neutral-600">Note tenue</span>
            </label>
          </div>
        </div>
        </div>

        <!-- Column 4: sound, keys, tessituras -->
        <div class="flex flex-col gap-6">
        <!-- Sound: the built-in synth or a sampled instrument -->
        <div class="flex flex-col gap-3">
          <div class="flex items-baseline justify-between">
            <label for="instrument" class="text-sm font-medium tracking-wide text-neutral-600">
              Sonorité
            </label>
            <span v-if="instrumentLoading" class="text-sm text-neutral-400">chargement…</span>
          </div>
          <select
            id="instrument"
            v-model="instrumentKey"
            class="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 accent-neutral-800 focus:border-neutral-400 focus:outline-none"
          >
            <option value="">Synthétiseur</option>
            <option v-for="i in INSTRUMENTS" :key="i.key" :value="i.key">{{ i.label }}</option>
          </select>
        </div>

        <!-- Key (tonalité) -->
        <div class="flex flex-col gap-3">
          <label for="key" class="text-sm font-medium tracking-wide text-neutral-600">
            Tonalités
          </label>
          <select
            id="key"
            v-model="keyChoice"
            class="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 accent-neutral-800 focus:border-neutral-400 focus:outline-none"
          >
            <option value="">—</option>
            <option v-for="t in KEYS" :key="t.key" :value="t.key">
              {{ t.signature ? `${t.label} (${t.signature})` : t.label }}
            </option>
          </select>
        </div>

        <!-- Tessitura (instrument / voice range) -->
        <div class="flex flex-col gap-3">
          <label for="tessitura" class="text-sm font-medium tracking-wide text-neutral-600">
            Tessitures
          </label>
          <select
            id="tessitura"
            v-model="tessituraChoice"
            class="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 accent-neutral-800 focus:border-neutral-400 focus:outline-none"
          >
            <option value="">—</option>
            <optgroup v-for="g in TESSITURA_TYPES" :key="g.type" :label="g.label">
              <option v-for="t in tessiturasOfType(g.type)" :key="t.key" :value="t.key">
                {{ t.label }}
              </option>
            </optgroup>
          </select>
        </div>
        </div>
      </div>
    </footer>
  </div>
</template>
