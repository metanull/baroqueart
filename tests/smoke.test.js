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
    expect(host.querySelector('.mwnf-page')).not.toBeNull()

    // The website's own Home view (registered under the route name 'home')
    // must replace viewer-core's generic home view.
    expect(host.querySelector('.vc-home')).toBeNull()

    app.unmount()
  })

  it('declares every legacy route', () => {
    const paths = config.extraViews.map((r) => r.path)
    for (const path of [
      '/',
      '/permanent-collection',
      '/permanent-collection/results',
      '/database',
      '/database/results',
      '/timeline',
      '/timeline/results',
      '/partners',
      '/partners/results',
      '/partner/:id',
      '/exhibitions',
      '/exhibitions/:exhibitionId',
      '/exhibitions/:exhibitionId/introduction',
      '/exhibitions/:exhibitionId/theme/:themeId',
      '/item/:id',
    ]) {
      expect(paths).toContain(path)
    }
  })

  it('publishes no generic entity pages', () => {
    // Every page is a hand-built view. Leaving `entities` at the package
    // default would additionally publish one list and one detail page per
    // exported entity — routes the legacy site never had, exposing the data
    // package's shape (collections, timelines) rather than the site's.
    expect(config.features.entities).toEqual([])
  })
})
