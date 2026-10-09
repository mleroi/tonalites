<script setup>
import {
  SCALES,
  SCALE_TYPES,
  KEYS,
  TESSITURAS,
  TESSITURA_TYPES,
  CHORD_SIZES,
  MIN_NOTE,
  MAX_NOTE,
  MIN_NUMBER_START,
  MAX_NUMBER_START,
  noteName,
} from '../notes.js'
import { INSTRUMENTS } from '../instruments.js'
import { PRESETS, DEFAULT_PRESET, VIEW_SETTINGS } from '../presets.js'

// Developer documentation, served at /doc/developer: every setting a preset
// can set, with the label it has in the interface, to write presets by hand.
// The value lists that live in code (scales, keys, instruments…) and the
// presets themselves are read from their modules, so they stay up to date;
// the rest is written below and must follow App.vue.

// A value written as it goes in presets.js.
function literal(value) {
  if (typeof value === 'string') return `'${value}'`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).map(([k, v]) => `${k}: ${literal(v)}`)
    return `{ ${entries.join(', ')} }`
  }
  return String(value)
}

// A semitone index with its note name, for the ranges.
function noteRange(min, max) {
  return `${min} (${noteName(min)}) à ${max} (${noteName(max)})`
}

// Where a setting sits in the interface.
const MAIN = 'Barre principale'
const DETAILED = 'Tous les réglages'

const BOOLEAN = [
  { value: true, label: 'coché' },
  { value: false, label: 'décoché' },
]

// The settings, in the order of the interface. `values` lists the accepted
// values with their label, `range` describes a numeric one instead, and `ref`
// points to a reference list further down the page. In `notes`, text between
// backticks is shown as code.
const SETTINGS = [
  {
    name: 'instrumentKey',
    label: 'Sonorité',
    where: MAIN,
    values: [
      { value: '', label: 'Synthétiseur' },
      ...INSTRUMENTS.map((i) => ({ value: i.key, label: i.label })),
    ],
    notes:
      'Choisie à la main, elle règle aussi le mode de jeu (tenu pour un instrument échantillonné, court pour le synthé) ; pas quand un preset l’applique.',
  },
  {
    name: 'droneOn',
    label: 'Drone',
    where: `${MAIN} et ${DETAILED}`,
    values: BOOLEAN,
  },
  {
    name: 'firstNote',
    label: 'Première note',
    where: DETAILED,
    range: `${noteRange(MIN_NOTE, MAX_NOTE)}, en demi-tons (0 = Do1, 12 = Do2…)`,
    notes: 'Réglage de vue : aussi déplacé par le zoom et le glisser, sans quitter le preset.',
  },
  {
    name: 'octaves',
    label: 'Nombre d’octaves',
    where: DETAILED,
    range: '1 à 10',
    notes: 'Réglage de vue, comme la première note.',
  },
  {
    name: 'numberStart',
    label: 'Note du « 1 »',
    where: DETAILED,
    range: noteRange(MIN_NUMBER_START, MAX_NUMBER_START),
    notes:
      'Tonique des gammes, base de la numérotation et des intervalles. Souvent tirée au hasard (`random`).',
  },
  {
    name: 'highlightOnes',
    label: 'Mettre en évidence les 1',
    where: DETAILED,
    values: BOOLEAN,
  },
  {
    name: 'labelMode',
    label: 'Libellés',
    where: DETAILED,
    values: [
      { value: 'none', label: 'Aucun' },
      { value: 'numbers', label: 'Numérotation' },
      { value: 'intervals', label: 'Intervalles' },
      { value: 'names', label: 'Nom des notes' },
      { value: 'degrees', label: 'Degrés' },
    ],
    notes: '`degrees` demande une gamme à sept notes dans `scaleKey`.',
  },
  {
    name: 'labelScope',
    label: 'Libellés (portée, sous les modes)',
    where: DETAILED,
    values: [
      { value: 'single', label: 'Une octave' },
      { value: 'all', label: 'Toutes les octaves' },
      { value: 'marked', label: 'Notes sélectionnées seulement' },
    ],
    notes: 'Affiché seulement quand `labelMode` n’est pas `none`.',
  },
  {
    name: 'accidentals',
    label: 'Affichage des altérations',
    where: DETAILED,
    values: [
      { value: 'sharps', label: 'Dièses' },
      { value: 'flats', label: 'Bémols' },
    ],
  },
  {
    name: 'intervalNames',
    label: 'Affichage des intervalles',
    where: DETAILED,
    range: "{ 6: '#4' ou 'b5', 8: 'b6' ou '#5', 9: 'M6' ou '7°' }",
    notes: 'Un objet, par demi-ton : donner l’objet complet.',
  },
  {
    name: 'showGlide',
    label: 'Bandeau glissando',
    where: DETAILED,
    values: BOOLEAN,
  },
  {
    name: 'showNotes',
    label: 'Afficher les notes',
    where: DETAILED,
    values: BOOLEAN,
    notes: 'Noms avec l’octave (Do4). Pas en même temps que `showSimpleNotes`.',
  },
  {
    name: 'showSimpleNotes',
    label: 'Afficher les notes simples',
    where: DETAILED,
    values: BOOLEAN,
    notes: 'Noms sans l’octave (Do). Pas en même temps que `showNotes`.',
  },
  {
    name: 'showFrequencies',
    label: 'Afficher les fréquences',
    where: DETAILED,
    values: BOOLEAN,
  },
  {
    name: 'pianoMode',
    label: 'Mode piano',
    where: DETAILED,
    values: BOOLEAN,
  },
  {
    name: 'droneNote',
    label: 'Note du drone',
    where: DETAILED,
    range: noteRange(MIN_NUMBER_START, MAX_NUMBER_START),
    notes:
      'Suit la note du « 1 » : lui donner la même valeur, ou la laisser libre (`free`) quand `numberStart` est tiré au hasard.',
  },
  {
    name: 'droneVolume',
    label: 'Volume du drone',
    where: DETAILED,
    range: '0 à 100',
  },
  {
    name: 'scaleKey',
    label: 'Gammes / Intervalles / Accords',
    where: DETAILED,
    ref: { id: 'scales', label: 'liste des gammes, intervalles et accords' },
    notes: "`''` = Aucun. Sa tonique est la note du « 1 ».",
  },
  {
    name: 'scaleAudioMode',
    label: 'Gammes / Intervalles / Accords (écoute, sous la liste)',
    where: DETAILED,
    values: [
      { value: 'scale-only', label: 'N’entendre que les notes de la sélection' },
      { value: 'all', label: 'Entendre toutes les notes' },
      { value: 'entity', label: 'Jouer la sélection au survol' },
      { value: 'chords', label: 'Entendre les accords' },
    ],
    notes:
      'Affiché seulement avec une sélection. `chords` ne vaut qu’avec une gamme à sept notes.',
  },
  {
    name: 'chordSize',
    label: 'Accords N sons',
    where: DETAILED,
    values: CHORD_SIZES.map((size) => ({ value: size, label: `Accords ${size} sons` })),
    notes: 'Affiché seulement avec `scaleAudioMode: \'chords\'`.',
  },
  {
    name: 'scaleHighlightMode',
    label: 'Mise en évidence',
    where: DETAILED,
    values: [
      { value: 'single', label: 'Une octave' },
      { value: 'all', label: 'Toutes les octaves' },
      { value: 'none', label: 'Aucune' },
    ],
    notes:
      'Décide aussi des notes et libellés masqués comme hors sélection (`none` : toute la sélection, sur toutes les octaves).',
  },
  {
    name: 'hideLabelsOutOfScale',
    label: 'Masquer les libellés hors sélection',
    where: DETAILED,
    values: BOOLEAN,
  },
  {
    name: 'hideNotesOutOfScale',
    label: 'Masquer les notes hors sélection',
    where: DETAILED,
    values: BOOLEAN,
  },
  {
    name: 'showDegrees',
    label: 'Afficher les degrés',
    where: DETAILED,
    values: BOOLEAN,
    notes: 'Seulement avec une gamme à sept notes.',
  },
  {
    name: 'playMode',
    label: 'Mode de jeu',
    where: DETAILED,
    values: [
      { value: 'short', label: 'Note courte' },
      { value: 'sustain', label: 'Note tenue' },
    ],
  },
  {
    name: 'keyChoice',
    label: 'Tonalités',
    where: DETAILED,
    ref: { id: 'keys', label: 'liste des tonalités' },
    notes:
      "`''` = —. Choisie à la main, elle règle la note du « 1 », les altérations, la gamme majeure et les libellés ; pas dans un preset, qui doit donc les donner aussi.",
  },
  {
    name: 'tessituraChoice',
    label: 'Tessitures',
    where: DETAILED,
    ref: { id: 'tessituras', label: 'liste des tessitures' },
    notes: "`''` = —.",
  },
]

// Settings the default preset sets but this page does not describe, or the
// other way round: a sign that the page lags behind the code.
const documented = new Set(SETTINGS.map((s) => s.name))
const defaults = DEFAULT_PRESET.settings
const undocumented = Object.keys(defaults).filter((name) => !documented.has(name))
const unknown = SETTINGS.map((s) => s.name).filter((name) => !(name in defaults))

// The reference lists, grouped as in their dropdowns.
const scaleGroups = SCALE_TYPES.map((g) => ({
  label: g.label,
  items: SCALES.filter((s) => s.type === g.type).map((s) => ({ key: s.key, label: s.label })),
}))
const keyItems = KEYS.map((k) => ({
  key: k.key,
  label: k.signature ? `${k.label} (${k.signature})` : k.label,
}))
const tessituraGroups = TESSITURA_TYPES.map((g) => ({
  label: g.label,
  items: TESSITURAS.filter((t) => t.type === g.type).map((t) => ({ key: t.key, label: t.label })),
}))

// A preset as it reads in presets.js, without its key and label.
function presetBody(preset) {
  const lines = []
  for (const [name, value] of Object.entries(preset.settings ?? {})) {
    lines.push(`  ${name}: ${literal(value)},`)
  }
  const parts = [`settings: {\n${lines.join('\n')}\n},`]
  if (preset.random) {
    const ranges = Object.entries(preset.random).map(([n, [min, max]]) => `${n}: [${min}, ${max}]`)
    parts.push(`random: { ${ranges.join(', ')} },`)
  }
  if (preset.free) {
    const free = Array.isArray(preset.free) ? `[${preset.free.map(literal).join(', ')}]` : literal(preset.free)
    parts.push(`free: ${free},`)
  }
  return parts.join('\n')
}

const PRESET_TEMPLATE = `{
  key: 'mon-preset',
  label: 'Mon preset',
  settings: {
    scaleKey: 'dorian',
    labelMode: 'intervals',
    labelScope: 'all',
  },
  // Optional: drawn at random each time the preset is chosen.
  random: { numberStart: [36, 47] },
  // Optional: can then be changed without leaving the preset ('all' = every setting).
  free: ['droneOn', 'droneNote'],
},`
</script>

<template>
  <div class="min-h-full bg-white text-neutral-700">
    <div class="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-10">
      <header class="flex flex-col gap-2">
        <a href="../../" class="text-sm text-neutral-400 hover:text-neutral-600">← Tonalités</a>
        <h1 class="text-2xl font-semibold text-neutral-800">Documentation développeur</h1>
        <p class="text-sm text-neutral-600">
          Les paramètres qu’un preset peut régler, avec leur libellé dans l’interface, pour
          écrire des presets à la main dans <code>src/presets.js</code>.
        </p>
      </header>

      <!-- The page lags behind the code -->
      <div
        v-if="undocumented.length || unknown.length"
        class="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800"
      >
        Cette page n’est plus à jour (<code>src/doc/DeveloperDoc.vue</code>).
        <span v-if="undocumented.length">
          Paramètres non décrits : <code>{{ undocumented.join(', ') }}</code>.
        </span>
        <span v-if="unknown.length">
          Paramètres décrits mais inconnus : <code>{{ unknown.join(', ') }}</code>.
        </span>
      </div>

      <!-- How a preset is written -->
      <section class="flex flex-col gap-3">
        <h2 class="text-lg font-semibold text-neutral-800">Écrire un preset</h2>
        <ul class="flex list-disc flex-col gap-1.5 pl-5 text-sm text-neutral-600">
          <li>
            Ajouter une entrée au tableau <code>PRESETS</code>, avec une <code>key</code> unique et
            le <code>label</code> affiché dans la liste « Presets ».
          </li>
          <li>
            <code>settings</code> ne liste que les paramètres qui changent : les autres prennent la
            valeur du preset par défaut (« {{ DEFAULT_PRESET.label }} », le premier), qui les liste
            tous. Choisir un preset mène ainsi toujours au même écran.
          </li>
          <li>
            <code>random</code> (facultatif) : <code>{ nom: [min, max] }</code>, nombres entiers
            bornes comprises, tirés à chaque choix du preset.
          </li>
          <li>
            <code>free</code> (facultatif) : paramètres modifiables sans quitter le preset, ou
            <code>'all'</code> pour tous. Toujours libres :
            <code>{{ VIEW_SETTINGS.join(', ') }}</code>.
          </li>
          <li>
            Un nom de paramètre inconnu est signalé dans la console du navigateur.
          </li>
        </ul>
        <pre class="overflow-x-auto rounded-md bg-neutral-50 px-4 py-3 text-xs text-neutral-700">{{ PRESET_TEMPLATE }}</pre>
      </section>

      <!-- Every setting -->
      <section class="flex flex-col gap-3">
        <h2 class="text-lg font-semibold text-neutral-800">Paramètres</h2>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-left text-sm">
            <thead>
              <tr class="border-b border-neutral-200 text-neutral-500">
                <th class="py-2 pr-4 font-medium">Paramètre</th>
                <th class="py-2 pr-4 font-medium">Libellé dans l’interface</th>
                <th class="py-2 pr-4 font-medium">Valeurs</th>
                <th class="py-2 font-medium">Par défaut</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="s in SETTINGS"
                :key="s.name"
                class="border-b border-neutral-100 align-top"
              >
                <td class="py-2.5 pr-4">
                  <code class="font-medium text-neutral-800">{{ s.name }}</code>
                </td>
                <td class="py-2.5 pr-4">
                  <div class="text-neutral-800">{{ s.label }}</div>
                  <div class="text-xs text-neutral-400">{{ s.where }}</div>
                </td>
                <td class="py-2.5 pr-4">
                  <ul v-if="s.values" class="flex flex-col gap-0.5">
                    <li v-for="v in s.values" :key="String(v.value)">
                      <code>{{ literal(v.value) }}</code>
                      <span class="text-neutral-500"> — {{ v.label }}</span>
                    </li>
                  </ul>
                  <div v-else-if="s.range" class="text-neutral-600">{{ s.range }}</div>
                  <a
                    v-else-if="s.ref"
                    :href="`#${s.ref.id}`"
                    class="text-neutral-600 underline decoration-neutral-300 hover:text-neutral-800"
                  >
                    Voir la {{ s.ref.label }}
                  </a>
                  <p v-if="s.notes" class="mt-1 text-xs text-neutral-500">
                    <template v-for="(part, i) in s.notes.split('`')" :key="i">
                      <code v-if="i % 2">{{ part }}</code>
                      <template v-else>{{ part }}</template>
                    </template>
                  </p>
                </td>
                <td class="py-2.5">
                  <code class="whitespace-nowrap">{{ literal(defaults[s.name]) }}</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Reference lists -->
      <section id="scales" class="flex flex-col gap-3">
        <h2 class="text-lg font-semibold text-neutral-800">
          <code>scaleKey</code> — Gammes / Intervalles / Accords
        </h2>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div v-for="g in scaleGroups" :key="g.label" class="flex flex-col gap-1">
            <h3 class="text-sm font-medium text-neutral-600">{{ g.label }}</h3>
            <ul class="flex flex-col gap-0.5 text-sm">
              <li v-for="item in g.items" :key="item.key">
                <code>{{ literal(item.key) }}</code>
                <span class="text-neutral-500"> — {{ item.label }}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="keys" class="flex flex-col gap-3">
        <h2 class="text-lg font-semibold text-neutral-800">
          <code>keyChoice</code> — Tonalités
        </h2>
        <ul class="grid grid-cols-1 gap-0.5 text-sm md:grid-cols-3">
          <li v-for="item in keyItems" :key="item.key">
            <code>{{ literal(item.key) }}</code>
            <span class="text-neutral-500"> — {{ item.label }}</span>
          </li>
        </ul>
      </section>

      <section id="tessituras" class="flex flex-col gap-3">
        <h2 class="text-lg font-semibold text-neutral-800">
          <code>tessituraChoice</code> — Tessitures
        </h2>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div v-for="g in tessituraGroups" :key="g.label" class="flex flex-col gap-1">
            <h3 class="text-sm font-medium text-neutral-600">{{ g.label }}</h3>
            <ul class="flex flex-col gap-0.5 text-sm">
              <li v-for="item in g.items" :key="item.key">
                <code>{{ literal(item.key) }}</code>
                <span class="text-neutral-500"> — {{ item.label }}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- The existing presets, as examples -->
      <section class="flex flex-col gap-3">
        <h2 class="text-lg font-semibold text-neutral-800">Presets existants</h2>
        <div v-for="p in PRESETS" :key="p.key" class="flex flex-col gap-1.5">
          <h3 class="text-sm font-medium text-neutral-700">
            {{ p.label }} <code class="font-normal text-neutral-400">{{ literal(p.key) }}</code>
          </h3>
          <pre class="overflow-x-auto rounded-md bg-neutral-50 px-4 py-3 text-xs text-neutral-700">{{ presetBody(p) }}</pre>
        </div>
      </section>
    </div>
  </div>
</template>
