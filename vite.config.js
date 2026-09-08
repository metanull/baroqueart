import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineViewerConfig } from '@metanull/viewer-core/vite'
import { defineConfig } from 'vite'

const viewerConfig = defineViewerConfig({ dataPackage: '@metanull/baroqueart-data', plugins: [vue()] })

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  // GitHub Pages serves the site under /<repo>/; the deploy workflow sets
  // BASE_PATH accordingly. Local dev and root deployments use /.
  ...viewerConfig,
  resolve: {
    ...viewerConfig.resolve,
    alias: {
      ...viewerConfig.resolve.alias,
      // `defineViewerConfig`'s own `@inventory-data` alias resolves
      // `./node_modules/<package>` against its own file's location inside
      // `node_modules/@metanull/viewer-core`, not this site's — every
      // entity and translation glob then matches nothing and the app mounts
      // with an empty manifest (reproduced: `npm test` fails "Unknown
      // entity" and "offers no language" against the released
      // @metanull/viewer-core@1.13.1). Recomputed here, against this file's
      // own `import.meta.url`, until the package fixes it upstream.
      '@inventory-data': fileURLToPath(
        new URL('./node_modules/@metanull/baroqueart-data', import.meta.url),
      ),
    },
  },
})
