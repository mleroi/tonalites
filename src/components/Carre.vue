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
  // Note name displayed below the square (e.g. "Do#4").
  note: {
    type: String,
    required: true,
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
  // Whether this note is currently being played (transient highlight).
  playing: {
    type: Boolean,
    default: false,
  },
})

// 'press' fires on mouse down; 'enter' fires when the pointer moves onto the
// square; 'leave' fires when it moves out (used to stop a sustained note).
const emit = defineEmits(['press', 'enter', 'leave'])

// Background classes: piano-key colors when piano mode is on, neutral otherwise.
const backgroundClasses = computed(() => {
  if (props.pianoMode) {
    return props.black
      ? 'bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700'
      : 'bg-white hover:bg-neutral-100 active:bg-neutral-200'
  }
  return 'bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300'
})

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

// The label must stay readable on a dark (black-key) background.
const labelClasses = computed(() =>
  props.pianoMode && props.black ? 'text-neutral-300' : 'text-neutral-500',
)

// Transient highlight while the note is being played (a subtle zoom).
const playingClasses = computed(() => (props.playing ? 'z-10 scale-110' : ''))
</script>

<template>
  <!-- The column (square + label) is the container query context, so both the
       inner number and the note label react to the rendered square size. -->
  <div class="@container flex min-w-0 flex-1 flex-col items-center gap-1">
    <div
      class="flex aspect-square w-full cursor-pointer items-center justify-center rounded-md transition duration-150"
      :class="[backgroundClasses, borderClasses, playingClasses]"
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

    <!-- Note name and frequency below the square; each is hidden only once the
         square gets too small for that particular text. -->
    <div v-if="showNote || showFrequency" class="flex flex-col items-center gap-0.5">
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
    </div>
  </div>
</template>
