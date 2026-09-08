import vue from "@vitejs/plugin-vue"
import { defineViewerConfig } from "@metanull/viewer-core/vite"
import { defineConfig } from "vite"

const viewerConfig = defineViewerConfig({ dataPackage: "@metanull/baroqueart-data", plugins: [vue()] })

export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  // GitHub Pages serves the site under /<repo>/; the deploy workflow sets
  // BASE_PATH accordingly. Local dev and root deployments use /.
  ...viewerConfig,
})
