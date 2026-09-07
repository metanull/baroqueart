import { useCatalogueData, useDataPackage } from '@metanull/viewer-core'

// The website's records, read the one way every website reads them: through
// viewer-core, lazily. Each entity is a shared ref that stays `null` until a
// route declaring it in `meta.entities` brings its chunk in, so importing
// this module loads nothing, and a page pays only for what it reads.
// Translations are viewer-core's cache, not a second one kept here. The
// Exhibitions tree moved to composables/exhibitions.js, over
// `useCollectionTree`.

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
    md,
    mdInline,
    mdStrip,
  }
}
