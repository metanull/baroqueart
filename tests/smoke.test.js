import { describe, expect, it } from 'vitest'
import { createViewer } from '@metanull/viewer-core'
import config from '../src/dataset.config.js'

describe('website smoke test', () => {
  it('mounts against the configured data package', async () => {
    window.location.hash = '#/'
    const app = createViewer(config)
    const host = document.createElement('div')
    document.body.appendChild(host)
    app.mount(host)
    await app.config.globalProperties.$router.isReady()

    expect(host.textContent).toContain(config.siteName)
    if (config.shell) {
      expect(host.querySelector('.mwnf-page')).not.toBeNull()
    }
    app.unmount()
  })
})
