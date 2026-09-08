import { describe, expect, it, vi } from 'vitest'
import { loadEntities, mergeMessages } from '@metanull/viewer-core'
import { checkOfferedLanguages, checkRoutes, checkSectionMeta, checkTextsRendered, mountSite } from '@metanull/viewer-core/testing'
import { catalogues as sharedTexts } from '@metanull/viewer-i18n/standalone'
import ownTexts from '../locales/en.json'
import collectionsTranslations from '../node_modules/@metanull/baroqueart-data/translations/collections.en.json'
import manifest from '../node_modules/@metanull/baroqueart-data/manifest.json'
import config from '../src/dataset.config.js'
import { useInventoryData } from '../src/composables/useInventoryData.js'

// The same two layers main.js assembles, in the same order: the shared bundle
// first, this website's own file last. Mounting without them would prove
// nothing about the chrome — every text would render as its own name.
const messages = mergeMessages(sharedTexts, { en: ownTexts })

// Mounted on the address under test, as a visitor arrives from a link — the
// kit's own `mountSite`, curried over this website's config and messages.
function mount(hash = '#/') {
  return mountSite(config, messages, hash)
}

describe('website smoke test', () => {
  it('mounts against the configured data package', async () => {
    const { app, host } = await mount()

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
    const { app, host } = await mount('#/permanent-collection/results')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-list__row')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-catalogue')).not.toBeNull()
    expect(host.querySelector('.mwnf-filter')).not.toBeNull()
    expect(host.querySelector('.mwnf-heading').textContent).toContain('Permanent Collection')
    // Legacy's count, in its two halves.
    expect(host.querySelectorAll('.mwnf-summary__count').length).toBe(2)
    app.unmount()
  }, 60000)

  it('renders the item sheet on the composed record view', async () => {
    const [items] = await loadEntities(['items'])
    const object = items.find((i) => i.type === 'object') ?? items[0]
    const { app, host } = await mount(`#/item/${encodeURIComponent(object.id)}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-sheet__label')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-record')).not.toBeNull()
    expect(host.querySelector('.detail-type-badge').textContent.trim()).toBe(object.type)
    expect(host.querySelector('.detail-title').textContent.trim()).not.toBe('')

    // The citation's permalink (viewer-core's sourceUrl), now that this site
    // declares site.origin — the sheet's own record, not a guessed address.
    const sourceCredit = host.querySelector('.mwnf-source-credit')
    expect(sourceCredit).not.toBeNull()
    const sourceLink = sourceCredit.querySelector('a')
    expect(sourceLink.textContent.startsWith(config.site.origin)).toBe(true)
    expect(sourceLink.textContent).toContain(`#/item/${object.id}`)
    app.unmount()
  }, 60000)

  // The Timeline entrance, results and gallery pages moved onto
  // viewer-layout's `TimelineResultsView`/`CatalogueResultsView` (metanull/baroqueart#64):
  // the country merge, the overlap filter and the pagination are the
  // platform's; the per-event link into the Permanent Collection results and
  // the gallery cross-link (decision D1, the legacy `hcr_gallery.php` this
  // site had dropped) are this website's own, declared in `composables/timeline.js`.
  it('renders the Timeline entrance on the composed results view', async () => {
    const { app, host } = await mount('#/timeline')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-timeline')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-heading').textContent).toContain('Timeline')
    expect(host.textContent).toContain('Explore historical events from the Baroque period')
    app.unmount()
  }, 30000)

  it('renders the Timeline results with events and offers the gallery cross-link', async () => {
    const { app, host } = await mount('#/timeline/results?country=hun')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-timeline__row')).not.toBeNull(), { timeout: 20000 })

    // Every one of Hungary's sixty events, paginated fifteen a page (legacy's size).
    expect(host.querySelectorAll('.mwnf-timeline__row').length).toBe(15)

    // The per-event action, unchanged since before this page moved onto the spec.
    const action = host.querySelector('.mwnf-timeline__action')
    expect(action).not.toBeNull()
    expect(action.textContent).toContain('View items from this period')

    // Hungary carries objects, so the gallery cross-link must appear, with a count.
    const gallery = host.querySelector('.mwnf-timeline__gallery')
    expect(gallery).not.toBeNull()
    expect(gallery.textContent).toContain('See Gallery')
    expect(gallery.textContent).toContain('86')

    // Timeline events now carry their descriptions (inventory-app#1705):
    // verify a row's rendered description and date against the fixture.
    const descriptions = [...host.querySelectorAll('.mwnf-timeline__description')].map((el) => el.textContent.trim())
    const dates = [...host.querySelectorAll('.mwnf-timeline__date')].map((el) => el.textContent.trim())
    expect(descriptions.some((desc) => desc.startsWith('According to the double conquest theory'))).toBe(true)
    expect(dates).toContain('670/680')

    app.unmount()
  }, 30000)

  it('reaches the Permanent Collection objects of that country from the Timeline gallery', async () => {
    const { app, host } = await mount('#/timeline/gallery?country=hun')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-list__row')).not.toBeNull(), { timeout: 20000 })

    expect(host.querySelector('.mwnf-heading').textContent).toContain('Timeline Gallery')
    // Twenty rows a page, the Permanent Collection's own page size.
    expect(host.querySelectorAll('.mwnf-list__row').length).toBe(20)
    // The Permanent Collection's own two-part count (objects, monuments) totalling 86.
    const counts = [...host.querySelectorAll('.mwnf-summary__count')].map((el) => Number(el.textContent))
    expect(counts.length).toBe(2)
    expect(counts.reduce((a, b) => a + b, 0)).toBe(86)

    app.unmount()
  }, 30000)

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

    const { app, host } = await mount('#/exhibitions')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-cards')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-heading').textContent).toContain('Exhibitions')
    app.unmount()
  }, 30000)

  it('renders an exhibition theme on the composed essay view, with panel and navigation', async () => {
    const { exhibition, theme } = findExhibitionThemeWithPages()
    const { app, host } = await mount(`#/exhibitions/${exhibition.id}/theme/${theme.id}`)
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
    const { app, host } = await mount(`#/exhibitions/${exhibition.id}/theme/${theme.id}?tab=1`)
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

    const { app, host } = await mount(`#/exhibitions/${withIntro.id}/introduction`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-essay')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-essay--about')).not.toBeNull()

    // This view's own #after slot carries the "back to exhibition" bar,
    // overriding EssayView's default #after (the source credit) — it must
    // render both, not replace one with the other.
    const sourceCredit = host.querySelector('.mwnf-source-credit')
    expect(sourceCredit).not.toBeNull()
    expect(sourceCredit.querySelector('a').textContent.startsWith(config.site.origin)).toBe(true)
    expect(host.querySelector('.mwnf-back-bar')).not.toBeNull()

    app.unmount()
  }, 30000)

  // The Partners entrance stays this site's own (the museum/institution
  // choice); the results list and the profile sheet moved onto
  // viewer-layout's `PartnerListView`/`RecordView` (metanull/baroqueart#65):
  // the country grouping, the main/associated tiers and the nested
  // hierarchy are the platform's, over the republished partner shape
  // (`level`, `parent_id`, `item_count`) — this website's own composable
  // (`composables/partner.js`) supplies only the museum/institution axis,
  // the contact/logo blocks and the reverse item lookup.
  it('renders the Partners results on the composed list view, tiers nested by country', async () => {
    const [partners] = await loadEntities(['partners'])

    const { app, host } = await mount('#/partners/results?type=museum')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-partner-list__row')).not.toBeNull(), { timeout: 20000 })

    expect(host.querySelector('.mwnf-partner-list')).not.toBeNull()
    expect(host.querySelector('.mwnf-heading, .mwnf-partner-list__title').textContent).toContain('Museums')

    // The "Partners found" count is the platform's own row count: a nested
    // associated partner is folded under its parent's row, not counted
    // again, so this is main museums plus the associated ones that stay
    // flat (no museum parent in the list) — not every museum record.
    const museums = partners.filter((p) => p.type === 'museum')
    const museumIds = new Set(museums.map((p) => p.id))
    const nestedCount = museums.filter((p) => p.parent_id && museumIds.has(p.parent_id)).length
    expect(host.querySelector('.mwnf-partner-list__count').textContent).toContain(`${museums.length - nestedCount}`)

    // Moravian Gallery (main, Czech Republic) and its associated City
    // Museum: the child nests under its own parent's row rather than a
    // flat "Associated" column, reading `parent_id` through `partnerHierarchy`.
    expect(host.textContent).toContain('Moravian Gallery')
    expect(host.textContent).toContain('City Museum')
    const parentRow = [...host.querySelectorAll('.mwnf-partner-list__row-block')].find((el) => el.textContent.includes('Moravian Gallery'))
    expect(parentRow?.querySelector('.mwnf-partner-list__children')?.textContent).toContain('City Museum')

    app.unmount()
  }, 30000)

  it('renders a partner profile on the composed record view, with contact and held items', async () => {
    // The Borghese Gallery: a museum with images, contact details and 50
    // held objects — enough of the sheet's sections to exercise the
    // contact/logo Markdown blocks and the reverse `partner_id` lookup the
    // platform's `related` cannot express (partner.js's `heldItems`).
    const partnerId = 'fae81dae-0250-52ec-acc1-171da28b9eef'
    const { app, host } = await mount(`#/partner/${partnerId}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-record')).not.toBeNull(), { timeout: 20000 })

    expect(host.querySelector('.detail-title').textContent).toContain('Borghese Gallery')
    expect(host.querySelector('.detail-type-badge').textContent.trim()).toBe('Museum')
    expect(host.textContent).toContain('Rome')
    expect(host.textContent).toContain('Italy')

    // The contact block, folded into Markdown so the sheet's own section
    // renderer carries it.
    expect(host.textContent).toContain('+39 06 8413979')

    // "View Objects (50)" — item_count is the package's own count, not a
    // scan of every item.
    const viewItems = host.querySelector('.view-items-row')
    expect(viewItems).not.toBeNull()
    expect(viewItems.textContent).toContain('View Objects')
    expect(viewItems.textContent).toContain('50')

    app.unmount()
  }, 30000)


  // The Database entrance and its keyword results moved onto
  // viewer-layout's `SearchFormView`/`CatalogueResultsView` (metanull/baroqueart#66):
  // the rows, the AND/OR fold and the century presets are the platform's;
  // this website's own field map (`composables/catalogue.js`'s
  // `SEARCH_FIELDS`) and the two legacy expansions (decision D3) still run
  // the actual search.
  it('renders the Database entrance on the composed search form', async () => {
    const { app, host } = await mount('#/database')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-search-form')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-heading').textContent).toContain('Database')
    // Legacy's three keyword rows, in their own order.
    expect(host.querySelectorAll('.mwnf-search-form__row').length).toBe(3)
    expect(host.textContent).toContain('Keyword 1')
    // The asymmetric century presets (database.php:88-124): "from" runs to
    // 2001, "to" only to 2000.
    const fromOptions = [...host.querySelectorAll('.mwnf-search-form__dates select')[0].options].map((o) => o.value)
    expect(fromOptions).toContain('2001')
    app.unmount()
  }, 20000)

  it('finds a record by field, and by its country name through the keyword expansion', async () => {
    // "Adoring Angel" (Hungarian National Gallery) carries no literal
    // "Hungary" in its own text — only "Hungarian" — so the second row can
    // only match through `countryExpansion` resolving "Hungary" to `hun`
    // and finding it in the `keyword` field's own haystack
    // (`composables/catalogue.js`'s `SEARCH_FIELDS`, decision D3).
    const { app, host } = await mount('#/database/results?q=Hungary&field=keyword&q2=Adoring+Angel&field2=name&op2=AND')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-list__row')).not.toBeNull(), { timeout: 20000 })
    const rows = host.querySelectorAll('.mwnf-list__row')
    expect(rows.length).toBe(1)
    expect(rows[0].textContent).toContain('Adoring Angel')
    app.unmount()
  }, 20000)

  it('renders the Permanent Collection entrance on the composed search form, one filter at a time', async () => {
    const { app, host } = await mount('#/permanent-collection')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-search-form--radio')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-heading').textContent).toContain('Permanent Collection')
    // The country radio's own options are the values the items actually
    // carry (`useFacets`), so a real country name must render, not an id.
    expect(host.textContent).toContain('Italy')
    app.unmount()
  }, 20000)

  it('declares every route by name, and leaves the catch-all to the router', () => {
    expect(checkRoutes(config, {
      names: [
        'home', 'permanent-collection', 'permanent-collection-results', 'database', 'database-results',
        'timeline', 'timeline-results', 'timeline-gallery', 'partners', 'partners-results', 'partner',
        'exhibitions', 'exhibition', 'exhibition-introduction', 'exhibition-theme', 'item',
      ],
    })).toEqual([])
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
    expect(checkSectionMeta(config)).toEqual([])
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
    const { app, host } = await mount()

    const text = host.textContent
    // From viewer-i18n: the layout's skip link and the menu's first entry.
    expect(text).toContain('Skip to content')
    expect(text).toContain('Home')
    // From locales/en.json: the header lockup, a menu entry, the footer.
    expect(text).toContain('Museum With No Frontiers')
    expect(text).toContain('Permanent Collection')
    expect(text).toContain('Welcome to Baroque Art')
    // Nothing rendered as a bare entry name, which is what a missing text
    // looks like — there is no exception to throw for one. Every namespace
    // a page actually reads, not just this site's own: a raw shared key
    // (record.*, sheet.*, timeline.*, partner.*, exhibition.*, the shared
    // core/layout/catalogue chrome) would otherwise pass unseen.
    expect(checkTextsRendered(host, {
      namespaces: ['baroqueart', 'core', 'layout', 'catalogue', 'record', 'sheet', 'timeline', 'partner', 'exhibition'],
    })).toEqual([])

    app.unmount()
  }, 20000)

  // The footer, rendered by SiteShell once the loaded package's
  // manifest.rights names a holder (viewer-layout 2.11.1): the attribution
  // sentence and the terms link are the package's own facts, read through
  // useSiteRights() — nothing this site writes out itself.
  it('renders the rights attribution and the terms link in the footer', async () => {
    const { app, host } = await mount()

    const attribution = host.querySelector('.mwnf-footer__attribution')
    expect(attribution).not.toBeNull()
    expect(attribution.textContent).toContain(manifest.rights.attribution)

    const termsLink = host.querySelector('.mwnf-footer__terms')
    expect(termsLink).not.toBeNull()
    expect(termsLink.textContent.trim()).toBe(sharedTexts.en['record.source.termsOfUse'])
    expect(termsLink.getAttribute('href')).toBe(manifest.rights.terms_url)

    app.unmount()
  }, 20000)
})
