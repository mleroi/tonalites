<script setup>
import { ref, computed, watch } from 'vue'
import Carre from './components/Carre.vue'
import {
  noteName,
  pitchClassName,
  isBlackKey,
  isInScale,
  INTERVALS,
  SCALES,
  SCALE_TYPES,
  MIN_NOTE,
  MAX_NOTE,
  MIN_NUMBER_START,
  MAX_NUMBER_START,
} from './notes.js'
import {
  playNote,
  startNote,
  stopNote,
  releaseAllNotes,
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

// Note sets of a given type, for the grouped dropdown.
function scalesOfType(type) {
  return SCALES.filter((s) => s.type === type)
}

// The selection's notes, one octave from the tonic ("note du 1").
const selectionNotes = computed(() =>
  selectedScale.value ? selectedScale.value.intervals.map((d) => numberStart.value + d) : [],
)

// Pending timers for the "play separately" sequence, cleared on each replay.
let separateTimers = []

// Play all selection notes at once.
function playSelectionTogether() {
  selectionNotes.value.forEach((n) => playNote(n))
}

// Play the selection notes one by one, 300 ms apart.
function playSelectionSeparately() {
  separateTimers.forEach(clearTimeout)
  separateTimers = selectionNotes.value.map((n, i) => setTimeout(() => playNote(n), i * 300))
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
  const degree = (((relative % 12) + 12) % 12)
  return labelMode.value === 'intervals' ? INTERVALS[degree] : String(degree + 1)
}

// Play mode: 'short' = a brief note on hover (default), 'sustain' = the note
// rings as long as the pointer stays inside the square.
const playMode = ref('short')

// Releasing any stuck sustained note when leaving the sustain mode.
watch(playMode, (mode) => {
  if (mode !== 'sustain') releaseAllNotes()
})

// Pointer enters a square: play it (if audible) according to the play mode.
function enterNote(semitone) {
  if (!isAudible(semitone)) return
  if (playMode.value === 'sustain') {
    startNote(semitone)
  } else {
    playNote(semitone)
  }
}

// Pointer leaves a square: stop its sustained note (no-op in short mode).
function leaveNote(semitone) {
  if (playMode.value === 'sustain') {
    stopNote(semitone)
  }
}

// Mouse pressed on a square: re-strike it in short mode.
function pressNote(semitone) {
  if (playMode.value === 'short' && isAudible(semitone)) {
    playNote(semitone)
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

// Gap between squares in pixels (Tailwind gap-1.5 = 0.375rem = 6px), so the
// band's note centers line up exactly with the square centers.
const SQUARE_GAP = 6

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
          class="relative h-10 w-full cursor-ew-resize touch-none select-none overflow-hidden rounded-md border border-neutral-200 bg-gradient-to-r from-neutral-50 to-neutral-200"
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
            :piano-mode="pianoMode"
            :black="isBlackKey(firstNote + i)"
            :highlighted="isHighlighted(firstNote + i)"
            :highlight-one="highlightOnes && isOneNote(firstNote + i)"
            @press="pressNote(firstNote + i)"
            @enter="enterNote(firstNote + i)"
            @leave="leaveNote(firstNote + i)"
          />
        </div>
      </div>
    </main>

    <!-- Controls -->
    <footer class="border-t border-neutral-100 px-6 py-8">
      <div class="mx-auto grid max-w-3xl grid-cols-1 items-start gap-x-10 gap-y-6 md:grid-cols-2">
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
                value="intervals"
                class="size-4 accent-neutral-800"
              />
              <span class="text-sm text-neutral-600">Intervalles</span>
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
                value="names"
                class="size-4 accent-neutral-800"
              />
              <span class="text-sm text-neutral-600">Nom des notes</span>
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
        </div>

        </div>

        <!-- Column 2: scale, play mode, drone, display -->
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
          </div>

          <!-- Play the selection (hover to listen) -->
          <div v-if="selectedScale" class="flex flex-col gap-2 pt-2">
            <span class="text-sm font-medium tracking-wide text-neutral-600">
              Écouter la sélection
            </span>
            <div class="flex gap-2">
              <div
                class="flex-1 cursor-pointer select-none rounded-md border border-neutral-200 bg-neutral-50 py-2 text-center text-sm text-neutral-600 transition-colors duration-150 hover:bg-neutral-200"
                @mouseenter="playSelectionSeparately"
              >
                Séparément
              </div>
              <div
                class="flex-1 cursor-pointer select-none rounded-md border border-neutral-200 bg-neutral-50 py-2 text-center text-sm text-neutral-600 transition-colors duration-150 hover:bg-neutral-200"
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
      </div>
    </footer>
  </div>
</template>
