import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  // Served under /tonalites/ on GitHub Pages; root path locally in dev.
  base: command === 'build' ? '/tonalites/' : '/',
  plugins: [vue(), tailwindcss()],
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
