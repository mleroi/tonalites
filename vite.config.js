import { readdirSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// Folder holding the melodies, served as-is from the app's base path.
const MIDI_DIR = resolve(import.meta.dirname, 'public/midi')

// Exposes the MIDI files found in public/midi as the `virtual:midi-files`
// module, whose default export is the sorted list of their paths relative to
// it, subfolders included ("Comptines/frere-jacques_do4.mid"). Files
// in public/ cannot be imported nor globbed from the app's code, hence this
// plugin. In dev, adding or removing a file reloads the page with the new list.
function midiFiles() {
  const id = 'virtual:midi-files'
  const resolvedId = `\0${id}`
  const isMidi = (file) => /\.midi?$/i.test(file)
  return {
    name: 'midi-files',
    resolveId(source) {
      if (source === id) return resolvedId
    },
    load(loadedId) {
      if (loadedId !== resolvedId) return
      let files = []
      try {
        files = readdirSync(MIDI_DIR, { recursive: true })
          .map((file) => file.split(sep).join('/'))
          .filter(isMidi)
          .sort()
      } catch {
        // No public/midi folder: no melodies.
      }
      return `export default ${JSON.stringify(files)}`
    },
    configureServer(server) {
      const refresh = (file) => {
        if (!file.startsWith(MIDI_DIR) || !isMidi(file)) return
        const module = server.moduleGraph.getModuleById(resolvedId)
        if (module) server.moduleGraph.invalidateModule(module)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', refresh)
      server.watcher.on('unlink', refresh)
    },
  }
}

export default defineConfig(({ command }) => ({
  // Served under /tonalites/ on GitHub Pages; root path locally in dev.
  base: command === 'build' ? '/tonalites/' : '/',
  plugins: [vue(), tailwindcss(), midiFiles()],
  server: {
    // Use polling instead of native inotify watchers: the machine's
    // fs.inotify.max_user_watches limit is already saturated, which
    // crashes the default watcher (ENOSPC).
    watch: {
      usePolling: true,
      interval: 150,
    },
  },
}))
