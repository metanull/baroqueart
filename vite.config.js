import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages serves the site under /<repo>/; the deploy workflow sets
  // BASE_PATH accordingly. Local dev and root deployments use /.
  base: process.env.BASE_PATH ?? '/',
  plugins: [vue()],
  resolve: {
    alias: {
      // viewer-core reads every JSON of the data package through this alias.
      '@inventory-data': fileURLToPath(
        new URL('./node_modules/@metanull/baroqueart-data', import.meta.url),
      ),
    },
  },
  optimizeDeps: {
    // viewer-core ships .vue source that esbuild pre-bundling cannot parse;
    // viewer-layout must not be pre-bundled either or its chunk gets a second
    // copy of the Vue runtime in dev (both packages share the app's vue).
    exclude: ['@metanull/viewer-core', '@metanull/viewer-layout'],
    // The runtime deps reach the browser through those excluded packages, so
    // the dev-server dependency scan cannot discover them from the app's own
    // imports alone. Without this list a late discovery pre-bundles a second
    // copy of Vue next to the raw one already loaded, and the app crashes on
    // boot ("Cannot read properties of null" in runtime-core). Listing them
    // pre-bundles each exactly once, and the excluded packages get the same
    // copy.
    include: ['vue', 'vue-i18n', 'vue-router', 'marked'],
  },
  test: {
    environment: 'jsdom',
    server: {
      deps: {
        // viewer-core ships .vue source; Node cannot load it unless Vitest
        // processes the package instead of externalizing it.
        inline: ['@metanull/viewer-core'],
      },
    },
  },
})
