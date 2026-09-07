import { describe, expect, it, vi } from 'vitest'
import { createViewer, loadEntities, mergeMessages } from '@metanull/viewer-core'
import { checkOfferedLanguages } from '@metanull/viewer-core/testing'
import { catalogues as sharedTexts } from '@metanull/viewer-i18n/standalone'
import ownTexts from '../locales/en.json'
import collectionsTranslations from '../node_modules/@metanull/baroqueart-data/translations/collections.en.json'
import config from '../src/dataset.config.js'
import { useInventoryData } from '../src/composables/useInventoryData.js'

// The same two layers main.js assembles, in the same order: the shared bundle
// first, this website's own file last. Mounting without them would prove
// nothing about the chrome — every text would render as its own name.
const messages = mergeMessages(sharedTexts, { en: ownTexts })

// Mounted on the address under test, as a visitor arrives from a link.
async function mountSite(hash = '#/') {
  window.location.hash = hash
  const app = createViewer({ ...config, messages })
  const host = document.createElement('div')
  document.body.appendChild(host)
  app.mount(host)
  await app.config.globalProperties.$router.isReady()
  return { app, host }
}

describe('website smoke test', () => {
  it('mounts against the configured data package', async () => {
    const { app, host } = await mountSite()

    expect(host.textContent).toContain(config.siteName)
    expect(host.querySelector('.mwnf-page')).not.toBeNull()

    // The website's own Home view (registered under the route name 'home')
    // must replace viewer-core's generic home view.
    expect(host.querySelector('.vc-home')).toBeNull()

    app.unmount()
  }, 20000)

  // The Permanent Collection list and the item sheet run on the platform's
  // composed views (metanull/viewer-core#50): the rows and the filter panel
  // come from the catalogue spec, the sheet's labels from the sheet spec,
  // and what only this website has fills the views' slots.
  it('renders the Permanent Collection on the composed results view', async () => {
    const { app, host } = await mountSite('#/permanent-collection/results')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-list__row')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-catalogue')).not.toBeNull()
    expect(host.querySelector('.mwnf-filter')).not.toBeNull()
    expect(host.querySelector('.section-heading').textContent).toContain('Permanent Collection')
    // Legacy's count, in its two halves.
    expect(host.querySelectorAll('.mwnf-summary__count').length).toBe(2)
    app.unmount()
  }, 60000)

  it('renders the item sheet on the composed record view', async () => {
    const [items] = await loadEntities(['items'])
    const object = items.find((i) => i.type === 'object') ?? items[0]
    const { app, host } = await mountSite(`#/item/${encodeURIComponent(object.id)}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-sheet__label')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-record')).not.toBeNull()
    expect(host.querySelector('.detail-type-badge').textContent.trim()).toBe(object.type)
    expect(host.querySelector('.detail-title').textContent.trim()).not.toBe('')
    app.unmount()
  }, 60000)

  // The Exhibitions entrance, splash, introduction and theme pages moved
  // onto viewer-layout's composed views (metanull/baroqueart#63) over
  // `useCollectionTree`: `SectionCards` for the entrance and the splash's
  // theme list, `EssayView` for the introduction (an `about` page) and a
  // theme's pages (the narrative, the tab strip, the picture panel, and
  // previous/next walking the whole exhibition — decision D2).
  function findExhibitionThemeWithPages() {
    // Not every theme has more than one page; the tab strip (asserted
    // below) only renders past one, so this hunts for one that does rather
    // than assuming the first exhibition's first theme is that one.
    for (const exhibition of collectionsFixture.filter((c) => c.parent_id === exhibitionsRoot.id)) {
      for (const theme of collectionsFixture.filter((c) => c.parent_id === exhibition.id)) {
        const pages = collectionsFixture.filter((c) => c.parent_id === theme.id)
        if (pages.length > 1) return { exhibition, theme }
      }
    }
    return null
  }

  let collectionsFixture
  let exhibitionsRoot

  it('renders the Exhibitions entrance on SectionCards', async () => {
    ;[collectionsFixture] = await loadEntities(['collections'])
    exhibitionsRoot = collectionsFixture.find((c) => c.purpose === 'exhibitions-root')
    expect(exhibitionsRoot).toBeTruthy()

    const { app, host } = await mountSite('#/exhibitions')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-cards')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.section-heading').textContent).toContain('Exhibitions')
    app.unmount()
  }, 30000)

  it('renders an exhibition theme on the composed essay view, with panel and navigation', async () => {
    const { exhibition, theme } = findExhibitionThemeWithPages()
    const { app, host } = await mountSite(`#/exhibitions/${exhibition.id}/theme/${theme.id}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-essay')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-essay__tabs')).toBeNull()
    expect(host.querySelector('.mwnf-essay__nav-link')).not.toBeNull()
    expect(host.querySelector('.mwnf-essay__panel')).not.toBeNull()
    expect(host.querySelector('.mwnf-essay-nav, .mwnf-essay__nav')).not.toBeNull()

    // EssayView reads collection texts through the tree's own entity
    // (viewer-core 1.12.1+), so assertions on the rendered title and prose
    // verify that the tree was built with entity: 'collections' and that
    // the view picks it up, rather than falling back to the spec's items
    // entity and rendering internal names. If these assertions fail after
    // installing viewer-core, the entity is not reaching the view.
    const titleElement = host.querySelector('.mwnf-essay__title')
    const themeTranslation = collectionsTranslations[theme.id] || {}
    expect(titleElement).not.toBeNull()
    expect(titleElement.textContent.trim().toLowerCase()).toBe((themeTranslation.title ?? '').toLowerCase())
    expect(titleElement.textContent).not.toBe(theme.internal_name)

    const proseElement = host.querySelector('.mwnf-essay__body, .mwnf-essay__prose')
    if (themeTranslation.description) {
      expect(proseElement).not.toBeNull()
      expect(proseElement.textContent.trim().length).toBeGreaterThan(0)
    }

    // `panel.variants` (metanull/viewer-layout#49): the panel opens on the
    // first item's own image with its name as the panel's title; where
    // that item carries curated "detail" close-ups (`entry.details`), a
    // second thumbnail is offered and swaps the whole caption — title,
    // justification and fields together, not just the picture — when
    // picked.
    const panelName = host.querySelector('.mwnf-essay__panel-name')
    expect(panelName).not.toBeNull()
    expect(panelName.textContent.trim()).not.toBe('')

    const activePage = collectionsFixture.find((c) => c.parent_id === theme.id)
    const firstItemEntry = activePage?.items?.[0]
    if ((firstItemEntry?.details ?? []).length > 0) {
      const variants = host.querySelectorAll('.mwnf-essay__variant')
      expect(variants.length).toBeGreaterThan(1)
      const initialName = panelName.textContent
      variants[1].click()
      await vi.waitFor(() => expect(host.querySelector('.mwnf-essay__panel-name').textContent).not.toBe(initialName))
    }

    // The panel's link opens the selected item's own sheet, not a list of
    // every item in the theme (metanull/baroqueart#75) — it must read the
    // dictionary's dedicated entry, not `EssayView`'s "See all …" default.
    const panelLink = host.querySelector('.mwnf-essay__panel-link')
    expect(panelLink).not.toBeNull()
    expect(panelLink.textContent).toContain(sharedTexts.en['exhibition.theme.seeItemEntry'])

    // Every page of a theme is reachable by next/previous (metanull/baroqueart#75):
    // `findExhibitionThemeWithPages` picked a theme with more than one page, so its
    // first page (`?tab` absent) must offer a "next" link into the second (`tab=1`).
    const nextLink = host.querySelector('.mwnf-essay__nav-link--next')
    expect(nextLink).not.toBeNull()
    expect(nextLink.getAttribute('href')).toContain('tab=1')

    app.unmount()
  }, 30000)

  // The regression this guards against (metanull/baroqueart#75): the old
  // `tree.parents(node.id).length !== 2` test never matched a real page (its
  // ancestry runs past this tree's own root, to the exhibitions marker and
  // the project collection above it), so `nextPage`/`previousPage` skipped
  // every candidate and a theme's first page showed no "Next" at all.
  it('reaches the second page of an exhibition theme by following "next"', async () => {
    const { exhibition, theme } = findExhibitionThemeWithPages()
    const { app, host } = await mountSite(`#/exhibitions/${exhibition.id}/theme/${theme.id}?tab=1`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-essay')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-essay__panel')).not.toBeNull()

    const pages = collectionsFixture.filter((c) => c.parent_id === theme.id)
    if (pages.length > 2) {
      const nextLink = host.querySelector('.mwnf-essay__nav-link--next')
      expect(nextLink).not.toBeNull()
      expect(nextLink.getAttribute('href')).toContain('tab=2')
    }

    app.unmount()
  }, 30000)

  it('renders an exhibition introduction as an about essay', async () => {
    const withIntro = collectionsFixture.find((c) => c.parent_id === exhibitionsRoot.id && (c.items?.length ?? 0) > 0)
    expect(withIntro).toBeTruthy()

    const { app, host } = await mountSite(`#/exhibitions/${withIntro.id}/introduction`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-essay')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-essay--about')).not.toBeNull()
    app.unmount()
  }, 30000)

  it('declares every route by name, and leaves the catch-all to the router', () => {
    const names = config.extraViews.map((r) => r.name)
    for (const name of [
      'home', 'permanent-collection', 'permanent-collection-results', 'database', 'database-results',
      'timeline', 'timeline-results', 'partners', 'partners-results', 'partner', 'exhibitions',
      'exhibition', 'exhibition-introduction', 'exhibition-theme', 'item',
    ]) {
      expect(names).toContain(name)
    }
    expect(config.extraViews.every((r) => r.name)).toBe(true)
    expect(config.extraViews.some((r) => r.path.includes('pathMatch'))).toBe(false)
    // This website has never been published under another URL shape.
    expect(config.legacyRoutes).toEqual([])
  })

  it('declares the entities every route reads', () => {
    // A view that renders records against `null` is the failure this prevents:
    // the router loads what a route names before the view is created.
    for (const route of config.extraViews) {
      expect(Array.isArray(route.meta?.entities), route.name).toBe(true)
    }
    expect(config.extraViews.find((r) => r.name === 'item').meta.entities).toContain('items')
  })

  it('declares the section every route belongs to', () => {
    // The shell marks the active menu entry off `meta.section`, read through
    // viewer-core's `useSection()` — a route with none would leave the menu
    // silently unmarked rather than fail.
    for (const route of config.extraViews) {
      expect(typeof route.meta?.section, route.name).toBe('string')
      expect(route.meta.section.length > 0, route.name).toBe(true)
    }
  })

  // The record lookups are viewer-core's shared indexes now, and a Map is not
  // an object: `byId(...)[id]` reads as undefined rather than failing, so a
  // page would simply render nothing. This is where that shows.
  it('resolves a record through the shared index', async () => {
    const { loadEntities } = await import('@metanull/viewer-core')
    const { itemById } = useInventoryData()
    const [items] = await loadEntities(['items'])
    expect(itemById.value).toBeInstanceOf(Map)
    expect(itemById.value.get(items[0].id)).toBe(items[0])
  }, 20000)

  it('offers the languages the package declares for the site, where the items carry them', () => {
    expect(checkOfferedLanguages(config)).toEqual([])
    expect(config.languages).toContain('en')
    const switcher = config.navigation.languages
    expect(switcher.map((l) => l.code)).toEqual(config.languages)
    expect(switcher.every((l) => Boolean(l.label))).toBe(true)
  })

  it('publishes no generic entity pages', () => {
    // Every page is a hand-built view. Leaving `entities` at the package
    // default would additionally publish one list and one detail page per
    // exported entity — routes the legacy site never had, exposing the data
    // package's shape (collections, timelines) rather than the site's.
    expect(config.features.entities).toEqual([])
  })

  // The chrome is now two layers, and either one failing is silent: a missing
  // entry renders as its own name rather than as an error. These assert the
  // rendered page, not the files, so a bundle that installs but never reaches
  // the components fails here too.
  it('renders the shared texts and its own over them', async () => {
    const { app, host } = await mountSite()

    const text = host.textContent
    // From viewer-i18n: the layout's skip link and the menu's first entry.
    expect(text).toContain('Skip to content')
    expect(text).toContain('Home')
    // From locales/en.json: the header lockup, a menu entry, the footer.
    expect(text).toContain('Museum With No Frontiers')
    expect(text).toContain('Permanent Collection')
    expect(text).toContain('Welcome to Baroque Art')
    // Nothing rendered as a bare entry name, which is what a missing text
    // looks like — there is no exception to throw for one.
    expect(text).not.toMatch(/\b(baroqueart|core|layout)\.[a-z]/i)

    app.unmount()
  }, 20000)
})
