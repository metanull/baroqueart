import { computed } from 'vue'
import { useCatalogueData, useDataPackage } from '@metanull/viewer-core'

// The website's records, read the one way every website reads them: through
// viewer-core, lazily. Each entity is a shared ref that stays `null` until a
// route declaring it in `meta.entities` brings its chunk in, so importing
// this module loads nothing, and a page pays only for what it reads.
// Translations are viewer-core's cache, not a second one kept here.

const dataPackage = useDataPackage()
export const manifest = dataPackage.manifest

// English is the base language of every catalogue in the platform: every list,
// label and fallback reads it. A record the visitor reads in another language
// is resolved on the sheet itself, by viewer-core's `useRecordLanguage`.
const defaultLang = 'en'

// The wrapper half of this composable — `tr`, `md`/`mdInline`/`mdStrip`,
// `labelOf`, `loadEnglish`, `entity`/`index` and the package re-exports — is
// viewer-core's; `eager` is this site's own translation preload list
// (`timelines` carries no English translations of its own, so it stays out).
// `glossary` is left at its default: `md`/`mdInline` bind this site's own
// glossary (every term in English) unless a caller passes its own.
const catalogue = useCatalogueData({
  eager: ['items', 'countries', 'partners', 'timeline_events', 'collections', 'glossary'],
  defaultLanguage: defaultLang,
})
catalogue.loadEnglish()

const {
  availableLanguages, loadTranslations, translations, tr, md, mdInline, mdStrip, labelOf,
} = catalogue

// ── Records ────────────────────────────────────────────────────────────────

const items = catalogue.entity('items')
const countries = catalogue.entity('countries')
const partners = catalogue.entity('partners')
const timelines = catalogue.entity('timelines')
const timelineEvents = catalogue.entity('timeline_events')
const collections = catalogue.entity('collections')

// ── Lookup maps ────────────────────────────────────────────────────────────

const itemById = catalogue.index('items')

// ── Label helpers (always English) ─────────────────────────────────────────
//
// Partner records carry no `internal_name` in this dataset, so `labelOf`'s
// fallback lands straight on the id — the same two-step fallback this site
// wrote by hand before `labelOf` existed.

function itemLabel(item) {
  return item ? labelOf('items', item.id) : ''
}

function countryLabel(countryId) {
  return countryId ? labelOf('countries', countryId) : ''
}

function partnerLabel(partnerId) {
  return partnerId ? labelOf('partners', partnerId) : ''
}

// ── Exhibitions ────────────────────────────────────────────────────────────
//
// Imported as generic Collections, nested under a dedicated "Virtual
// Exhibitions" marker collection — the collection whose `purpose` is
// "exhibitions-root", the single anchor this dataset carries. It is needed
// because type='exhibition' alone is not project-scoped in the legacy
// schema (shared with Islamic Art, Sharing History, etc). From that anchor:
// exhibitions are its children, themes are an exhibition's children, pages
// are a theme's children (tabs). "Introduction" is not a theme — it's the
// exhibition's own translation (extra.intro_header / extra.intro_text) plus
// items attached directly to the exhibition collection itself (not to any
// theme/page).
//
// Section anchors are resolved by `purpose` (#1505) —
// `backward_compatibility` is informational only and never parsed.
//
// This block, and the reverse item→collection lookups below it, are this
// site's own until wave H, when `useCollectionTree` takes them over.
function findByPurpose(purpose) {
  return (collections.value ?? []).find(c => c.purpose === purpose) ?? null
}

const exhibitions = computed(() => {
  const marker = findByPurpose('exhibitions-root')
  if (!marker) return []
  return (collections.value ?? [])
    .filter(c => c.parent_id === marker.id)
    .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999))
})

function exhibitionById(id) {
  return exhibitions.value.find(e => e.id === id) ?? null
}

function exhibitionThemes(exhibitionId) {
  const all = collections.value ?? []
  return all
    .filter(c => c.parent_id === exhibitionId)
    .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999))
    .map(theme => ({
      ...theme,
      pages: all
        .filter(c => c.parent_id === theme.id)
        .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999)),
    }))
}

function exhibitionThemeById(exhibitionId, themeId) {
  return exhibitionThemes(exhibitionId).find(t => t.id === themeId) ?? null
}

// collections.json already lists each collection's items[], so "which
// collections reference this item" is a client-side reverse lookup over the
// same data rather than a separate export.

function collectionsContainingItem(itemId) {
  return (collections.value ?? []).filter(c => c.items?.some(it => it.id === itemId))
}

function exhibitionLinksForItem(itemId) {
  const marker = findByPurpose('exhibitions-root')
  if (!marker) return []
  const all = collections.value ?? []
  const links = []
  const seen = new Set()
  for (const c of collectionsContainingItem(itemId)) {
    // Either attached directly to the exhibition itself (an "introduction"
    // item), or to a page nested under a theme nested under the exhibition.
    let exhibition = null
    let themeId = null
    if (c.parent_id === marker.id) {
      exhibition = c
    } else {
      const theme = all.find(t => t.id === c.parent_id)
      const ex = theme && all.find(e => e.id === theme.parent_id)
      if (ex && ex.parent_id === marker.id) {
        exhibition = ex
        themeId = theme.id
      }
    }
    if (!exhibition) continue
    const key = `${exhibition.id}:${themeId ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    links.push({
      exhibitionId: exhibition.id,
      themeId,
      label: tr('collections', exhibition.id).title ?? exhibition.internal_name,
    })
  }
  return links
}

export function useInventoryData() {
  return {
    items,
    countries,
    partners,
    timelines,
    timelineEvents,
    collections,
    defaultLang,
    availableLanguages,
    loadTranslations,
    translations,
    tr,
    itemLabel,
    countryLabel,
    partnerLabel,
    itemById,
    exhibitions,
    exhibitionById,
    exhibitionThemes,
    exhibitionThemeById,
    collectionsContainingItem,
    exhibitionLinksForItem,
    md,
    mdInline,
    mdStrip,
  }
}
