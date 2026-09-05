import { computed } from 'vue'
import {
  byId, entityRef, renderBlock, renderInline, renderPlain, useDataPackage,
} from '@metanull/viewer-core'

// The website's records, read the one way every website reads them: through
// viewer-core, lazily. Each entity is a shared ref that stays `null` until a
// route declaring it in `meta.entities` brings its chunk in, so importing
// this module loads nothing, and a page pays only for what it reads.
// Translations are viewer-core's cache, not a second one kept here.

const dataPackage = useDataPackage()
export const manifest = dataPackage.manifest

// ── Records ────────────────────────────────────────────────────────────────

const items = entityRef('items')
const countries = entityRef('countries')
const partners = entityRef('partners')
const timelines = entityRef('timelines')
const timelineEvents = entityRef('timeline_events')
const collections = entityRef('collections')
const glossary = entityRef('glossary')

// English is the base language of every catalogue in the platform: every list,
// label and fallback reads it. A record the visitor reads in another language
// is resolved on the sheet itself, by viewer-core's `useRecordLanguage`.
const defaultLang = 'en'

// ── Translations ───────────────────────────────────────────────────────────
//
// One file per entity per language, resolved by name through viewer-core:
// never `import(`…${lang}…`)`, which a bundler cannot resolve statically and
// so bundles every language of an entity eagerly. English drives every list
// and label and is loaded once; another language is loaded on demand by the
// page that reads it.

const { availableLanguages, loadTranslations, translations } = dataPackage

/** One record's translated fields, falling back to English then to nothing. */
function tr(entity, id, lang = defaultLang) {
  return dataPackage.tr(entity, id, lang, defaultLang)
}

const EN_ENTITIES = ['items', 'countries', 'partners', 'timeline_events', 'collections']

let englishReady = null
function loadEnglishTranslations() {
  if (!englishReady) {
    englishReady = Promise.all(EN_ENTITIES.map(e => loadTranslations(e, defaultLang)))
  }
  return englishReady
}
loadEnglishTranslations()

// ── Label helpers (always English) ─────────────────────────────────────────

function itemLabel(item) {
  if (!item) return ''
  return mdStrip(tr('items', item.id).name ?? item.internal_name ?? item.id)
}

function countryLabel(countryId) {
  if (!countryId) return ''
  const fallback = (countries.value ?? []).find(c => c.id === countryId)
  return mdStrip(tr('countries', countryId).name ?? fallback?.internal_name ?? countryId)
}

function partnerLabel(partnerId) {
  if (!partnerId) return ''
  const fallback = (partners.value ?? []).find(p => p.id === partnerId)
  return mdStrip(tr('partners', partnerId).name ?? fallback?.id ?? partnerId)
}

// ── Lookup maps ────────────────────────────────────────────────────────────

const itemById = byId('items')

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

// ── Markdown ───────────────────────────────────────────────────────────────
//
// The three renderers of viewer-core, and nothing else: a data package holds
// Markdown, every website renders it through the same pipeline, and a field
// that renders wrongly is fixed in the importer, where the data is made.
// `md` renders a record's text with its line breaks, and takes the glossary
// the sheet passes to highlight the terms it carries.

function md(text, glossary) {
  if (!text) return ''
  return renderBlock(text, { breaks: true, glossary })
}

function mdInline(text, glossary) {
  if (!text) return ''
  return renderInline(text, { glossary })
}

function mdStrip(text) {
  if (!text) return ''
  return renderPlain(text)
}

export function useInventoryData() {
  return {
    items,
    countries,
    partners,
    timelines,
    timelineEvents,
    collections,
    glossary,
    defaultLang,
    availableLanguages,
    loadTranslations,
    translations,
    tr,
    loadEnglishTranslations,
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
