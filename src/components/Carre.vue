<script setup>
import { computed } from 'vue'

// Component representing a single square (one chromatic note).
// It is designed to accept further properties (color, active state…) later on.
const props = defineProps({
  index: {
    type: Number,
    required: true,
  },
  // Label displayed inside the square (a number "1".."12" or an interval
  // symbol like "b3"), or null to display nothing.
  label: {
    type: String,
    default: null,
  },
  // When true, draw the subtle octave-start border (the displayed tonic).
  markTonic: {
    type: Boolean,
    default: false,
  },
  // Note name displayed below the square (e.g. "Do#4"). Omitted by squares
  // that show no name at all, such as the chord geometry strip.
  note: {
    type: String,
    default: '',
  },
  // Whether to display the note name below the square.
  showNote: {
    type: Boolean,
    default: true,
  },
  // Frequency label displayed below the note name (e.g. "440 Hz").
  frequency: {
    type: String,
    default: '',
  },
  // Whether to display the frequency below the note name.
  showFrequency: {
    type: Boolean,
    default: false,
  },
  // Scale degree in Roman numerals, displayed below the note name and the
  // frequency, or null to display nothing. Unlike the two above, this has no
  // matching "show" flag: a degree is absent for any note outside the scale,
  // so the caller passes null in both cases.
  degree: {
    type: String,
    default: null,
  },
  // When true, color the square like a piano key.
  pianoMode: {
    type: Boolean,
    default: false,
  },
  // Whether this note is a black key on a piano (only used in piano mode).
  black: {
    type: Boolean,
    default: false,
  },
  // Whether this note should be highlighted as part of the selected scale.
  highlighted: {
    type: Boolean,
    default: false,
  },
  // Whether this note is a "1" to highlight (takes precedence over the scale).
  highlightOne: {
    type: Boolean,
    default: false,
  },
  // Whether this note is within the selected tessitura (pastel-yellow bg).
  inTessitura: {
    type: Boolean,
    default: false,
  },
  // Whether this note is currently being played (transient highlight).
  playing: {
    type: Boolean,
    default: false,
  },
  // Whether this note belongs to the chord under the pointer, in the
  // chord-listening mode (background highlight held while hovering).
  inChord: {
    type: Boolean,
    default: false,
  },
  // An inert square is there to be read, not played (the chord geometry
  // strip): it drops the hover, active and cursor affordances.
  inert: {
    type: Boolean,
    default: false,
  },
})

// 'press' fires on mouse down; 'enter' fires when the pointer moves onto the
// square; 'leave' fires when it moves out (used to stop a sustained note).
const emit = defineEmits(['press', 'enter', 'leave'])

// Background shades as [resting, hover, active]: piano-key colors when piano
// mode is on, neutral otherwise. The chord highlight wins over every other
// background, including the piano keys, so the notes of the chord read as one
// block. Its hover shade is the same color, otherwise the square under the
// pointer would stand out from the rest of its own chord.
const backgroundShades = computed(() => {
  if (props.inChord) {
    return ['bg-sky-200', 'hover:bg-sky-200', 'active:bg-sky-300']
  }
  if (props.pianoMode) {
    return props.black
      ? ['bg-neutral-900', 'hover:bg-neutral-800', 'active:bg-neutral-700']
      : ['bg-white', 'hover:bg-neutral-100', 'active:bg-neutral-200']
  }
  if (props.inTessitura) {
    return ['bg-yellow-100', 'hover:bg-yellow-200', 'active:bg-yellow-300']
  }
  return ['bg-neutral-100', 'hover:bg-neutral-200', 'active:bg-neutral-300']
})

// An inert square keeps its resting shade: reacting to the pointer would
// promise a note it does not play.
const backgroundClasses = computed(() =>
  props.inert ? backgroundShades.value[0] : backgroundShades.value.join(' '),
)

// Border classes (width + color). Scale highlight takes precedence; otherwise
// the piano-key border, then the darker border on the octave start.
const borderClasses = computed(() => {
  if (props.highlightOne) {
    return 'border-2 border-fuchsia-500'
  }
  if (props.highlighted) {
    return 'border-2 border-indigo-500'
  }
  if (props.pianoMode) {
    return props.black ? 'border border-neutral-900' : 'border border-neutral-300'
  }
  return props.markTonic ? 'border border-neutral-400' : 'border border-neutral-200'
})

// The label must stay readable on a dark (black-key) background — unless the
// chord highlight has replaced it with a light one.
const labelClasses = computed(() =>
  props.pianoMode && props.black && !props.inChord ? 'text-neutral-300' : 'text-neutral-500',
)

// Transient highlight while the note is being played (a subtle zoom).
const playingClasses = computed(() => (props.playing ? 'z-10 scale-110' : ''))
</script>

<template>
  <!-- The column (square + label) is the container query context, so both the
       inner number and the note label react to the rendered square size. -->
  <div class="@container flex min-w-0 flex-1 flex-col items-center gap-1">
    <div
      class="flex aspect-square w-full items-center justify-center rounded-md transition duration-150"
      :class="[backgroundClasses, borderClasses, playingClasses, inert ? '' : 'cursor-pointer']"
      @mousedown.prevent="emit('press')"
      @mouseenter="emit('enter')"
      @mouseleave="emit('leave')"
    >
      <!-- Font size scales with the square width (cqw); hidden once too small. -->
      <span
        v-if="label !== null"
        class="hidden select-none whitespace-nowrap text-[42cqw] leading-none tabular-nums @min-[24px]:block"
        :class="labelClasses"
      >
        {{ label }}
      </span>
    </div>

    <!-- Note name, frequency and degree below the square, in that order; each
         is hidden only once the square gets too small for that particular
         text. -->
    <div
      v-if="showNote || showFrequency || degree !== null"
      class="flex flex-col items-center gap-0.5"
    >
      <span
        v-if="showNote"
        class="hidden select-none whitespace-nowrap text-[clamp(9px,16cqw,13px)] leading-none text-neutral-500 @min-[28px]:block"
      >
        {{ note }}
      </span>
      <span
        v-if="showFrequency"
        class="hidden select-none whitespace-nowrap text-[clamp(8px,13cqw,11px)] leading-none text-neutral-400 @min-[40px]:block"
      >
        {{ frequency }}
      </span>
      <!-- Same type as the note name, so the two read as one stack. -->
      <span
        v-if="degree !== null"
        class="hidden select-none whitespace-nowrap text-[clamp(9px,16cqw,13px)] leading-none text-neutral-500 @min-[28px]:block"
      >
        {{ degree }}
      </span>
    </div>
  </div>
</template>
