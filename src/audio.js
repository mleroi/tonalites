import * as Tone from 'tone'

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

// Plays a short note matching an absolute semitone index.
export async function playNote(semitone) {
  if (!started) {
    await Tone.start()
    started = true
  }
  synth.triggerAttackRelease(semitoneToFrequency(semitone), '8n')
}

// Starts a sustained note (kept ringing until stopNote is called).
export function startNote(semitone) {
  synth.triggerAttack(semitoneToFrequency(semitone))
}

// Stops a sustained note previously started with startNote.
export function stopNote(semitone) {
  synth.triggerRelease(semitoneToFrequency(semitone))
}

// Releases every currently sustained note (safety against stuck notes).
export function releaseAllNotes() {
  synth.releaseAll()
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
