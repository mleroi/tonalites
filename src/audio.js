import * as Tone from 'tone'
import { INSTRUMENTS } from './instruments.js'

// Polyphonic synth so several notes can ring at once (overlapping clicks).
const synth = new Tone.PolySynth(Tone.Synth).toDestination()
synth.set({
  oscillator: { type: 'triangle' },
  envelope: { attack: 0.005, decay: 0.12, sustain: 0.25, release: 1.1 },
})

// Tone's AudioContext can only start after a user gesture.
let started = false

// Starts the AudioContext. Must be called from within a user gesture
// (e.g. the click on the welcome overlay), as browsers forbid starting
// audio before any interaction.
export async function startAudio() {
  if (started) return
  await Tone.start()
  started = true
}

// Converts an absolute semitone index (0 = Do1 = C1, MIDI 24) to a frequency.
// Accepts fractional values for continuous (glissando) pitches.
export function semitoneToFrequency(semitone) {
  return 440 * Math.pow(2, (24 + semitone - 69) / 12)
}

// Length of a short note on the synth, and the fallback for any instrument
// that does not state its own.
const SHORT_NOTE = '8n'

// Samplers for the sampled instruments, built on first selection and then
// reused. Each entry is { sampler, ready }, `ready` resolving once every
// sample has been downloaded and decoded.
const samplers = new Map()

// The selected sampled instrument, or null when the built-in synth is used.
let selectedInstrument = null

// Builds an instrument's Sampler the first time it is selected — which is when
// its samples start downloading — and returns its cache entry.
function ensureSampler(instrument) {
  let entry = samplers.get(instrument.key)
  if (!entry) {
    let sampler
    const ready = new Promise((resolve, reject) => {
      sampler = new Tone.Sampler({
        urls: instrument.samples,
        baseUrl: instrument.baseUrl,
        release: instrument.release,
        onload: resolve,
        onerror: reject,
      }).toDestination()
    })
    sampler.volume.value = instrument.volume
    entry = { sampler, ready }
    samplers.set(instrument.key, entry)
  }
  return entry
}

// Chooses the sound of the squares: an instrument key from the registry, or ''
// for the built-in synth. Resolves once the samples are ready; the promise
// also settles when they fail, since the fallback below covers both cases.
export async function setInstrument(key) {
  const instrument = INSTRUMENTS.find((i) => i.key === key) || null
  // A note attacked on the previous source could no longer be released once
  // the source changes, so silence everything before switching.
  releaseAllNotes()
  selectedInstrument = instrument
  if (!instrument) return
  try {
    await ensureSampler(instrument).ready
  } catch {
    // Samples unavailable: noteSource() keeps returning the synth.
  }
}

// The source that plays the squares, with the note length that suits it.
// While an instrument's samples are still loading — or if they failed to load
// altogether — this falls back to the synth, so the app is never silent.
function noteSource() {
  if (selectedInstrument) {
    const entry = samplers.get(selectedInstrument.key)
    if (entry && entry.sampler.loaded) {
      return {
        source: entry.sampler,
        noteLength: selectedInstrument.noteLength || SHORT_NOTE,
      }
    }
  }
  return { source: synth, noteLength: SHORT_NOTE }
}

// Plays a short note matching an absolute semitone index.
export async function playNote(semitone) {
  if (!started) {
    await Tone.start()
    started = true
  }
  const { source, noteLength } = noteSource()
  source.triggerAttackRelease(semitoneToFrequency(semitone), noteLength)
}

// Starts a sustained note (kept ringing until stopNote is called).
export function startNote(semitone) {
  noteSource().source.triggerAttack(semitoneToFrequency(semitone))
}

// Stops a sustained note previously started with startNote.
export function stopNote(semitone) {
  noteSource().source.triggerRelease(semitoneToFrequency(semitone))
}

// Releases every currently sustained note (safety against stuck notes), on
// whichever source may be holding one.
export function releaseAllNotes() {
  synth.releaseAll()
  samplers.forEach(({ sampler }) => sampler.releaseAll())
}

// The melody being played (see playMelody), or null.
let melodyPart = null

// Melody tempo, as a rate of the written one (1 = as written, 2 = twice as
// fast). Note times are in seconds at the written tempo; they are placed on
// the Transport in ticks at BASE_BPM, so that changing the Transport's tempo
// speeds up or slows down whatever is left to play, even mid-melody.
const BASE_BPM = 120
let melodyRate = 1

// Converts a time in seconds at the written tempo into Transport ticks.
function melodyTicks(seconds) {
  return `${Math.round((seconds * BASE_BPM * Tone.getTransport().PPQ) / 60)}i`
}

// Sets the melody tempo (see melodyRate), live if a melody is playing.
export function setMelodyTempo(rate) {
  melodyRate = rate
  Tone.getTransport().bpm.value = BASE_BPM * rate
}

// Tears down the melody playback: stops the Transport, drops the notes still
// to come and the pending highlight callbacks. Notes already sounding are left
// to ring out.
function disposeMelody() {
  if (!melodyPart) return
  const transport = Tone.getTransport()
  transport.stop()
  transport.cancel(0)
  melodyPart.dispose()
  melodyPart = null
  Tone.getDraw().cancel(0)
}

// Plays a melody (notes as loaded by melodies.js) on the current instrument,
// replacing any melody already playing. The source is looked up for each note,
// so changing the instrument mid-melody carries on with the new one.
// `transpose` maps each written semitone to the one heard; it is also called
// for each note, so a change of transposition applies from the next note on.
// `onNoteStart` / `onNoteEnd` are called in sync with the sound, with the
// semitone heard, to highlight the notes; `onEnd` once the last note has ended.
export async function playMelody(notes, { transpose, onNoteStart, onNoteEnd, onEnd } = {}) {
  await startAudio()
  disposeMelody()
  const transport = Tone.getTransport()
  const draw = Tone.getDraw()
  transport.bpm.value = BASE_BPM * melodyRate
  const events = notes.map((n) => ({ ...n, time: melodyTicks(n.time) }))
  melodyPart = new Tone.Part((time, note) => {
    const semitone = transpose ? transpose(note.semitone) : note.semitone
    // The length follows the tempo the note starts at.
    const duration = note.duration / melodyRate
    noteSource().source.triggerAttackRelease(
      semitoneToFrequency(semitone),
      duration,
      time,
      note.velocity,
    )
    if (onNoteStart) draw.schedule(() => onNoteStart(semitone), time)
    if (onNoteEnd) draw.schedule(() => onNoteEnd(semitone), time + duration)
  }, events).start(0)
  const end = notes.reduce((last, n) => Math.max(last, n.time + n.duration), 0)
  transport.scheduleOnce((time) => {
    draw.schedule(() => {
      disposeMelody()
      if (onEnd) onEnd()
    }, time)
  }, melodyTicks(end))
  transport.position = 0
  // A short delay, so the first notes are not cut by the scheduling.
  transport.start('+0.05')
}

// Stops the melody playback, silencing the notes still sounding.
export function stopMelody() {
  if (!melodyPart) return
  disposeMelody()
  releaseAllNotes()
}

// A separate, sustained synth for the drone, kept quieter so hovered notes
// are heard on top of it.
let droneSynth = null
let droneActive = false

function ensureDroneSynth() {
  if (!droneSynth) {
    droneSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.4, decay: 0.1, sustain: 1, release: 0.8 },
    }).toDestination()
    // 0 dB by default, i.e. the same level as the played notes.
  }
}

// Sets the drone volume from a 0..100 percentage (100 = 0 dB, same as notes;
// 0 = silent).
export function setDroneVolume(percent) {
  ensureDroneSynth()
  droneSynth.volume.value = percent <= 0 ? -Infinity : Tone.gainToDb(percent / 100)
}

// Starts the continuous drone on the given semitone.
export async function startDrone(semitone) {
  await startAudio()
  ensureDroneSynth()
  droneSynth.triggerAttack(semitoneToFrequency(semitone))
  droneActive = true
}

// Stops the continuous drone.
export function stopDrone() {
  if (droneSynth && droneActive) {
    droneSynth.triggerRelease()
    droneActive = false
  }
}

// Changes the drone pitch live while it keeps sounding.
export function setDroneNote(semitone) {
  if (droneSynth && droneActive) {
    droneSynth.setNote(semitoneToFrequency(semitone))
  }
}

// A dedicated synth for the continuous glissando band.
let glideSynth = null

function ensureGlideSynth() {
  if (!glideSynth) {
    glideSynth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      // Same sustain level as the played notes, so the volume matches.
      envelope: { attack: 0.02, decay: 0.05, sustain: 0.25, release: 0.1 },
    }).toDestination()
  }
}

// Starts the continuous glissando tone at the given frequency.
export async function startGlide(frequency) {
  await startAudio()
  ensureGlideSynth()
  glideSynth.triggerAttack(frequency)
}

// Updates the glissando pitch live (short ramp for a smooth, continuous sweep).
export function setGlideFrequency(frequency) {
  if (glideSynth) {
    glideSynth.frequency.rampTo(frequency, 0.03)
  }
}

// Stops the continuous glissando tone.
export function stopGlide() {
  if (glideSynth) {
    glideSynth.triggerRelease()
  }
}
