import { ref, computed } from 'vue'
import { marked } from 'marked'
import itemsData from '@inventory-data/items.json'
import countriesData from '@inventory-data/countries.json'
import partnersData from '@inventory-data/partners.json'
import timelinesData from '@inventory-data/timelines.json'
import timelineEventsData from '@inventory-data/timeline_events.json'
import collectionsData from '@inventory-data/collections.json'
import glossaryData from '@inventory-data/glossary.json'

// Module-level singletons — loaded once, shared across all views
const items = ref(itemsData)
const countries = ref(countriesData)
const partners = ref(partnersData)
const timelines = ref(timelinesData)
const timelineEvents = ref(timelineEventsData)
const collections = ref(collectionsData)
const glossary = ref(glossaryData)

// TODO(#7): derive the offered languages from the translation files that
// actually exist in the data package. The manifest over-declares 18
// languages, most without any content — it must not be the source. Until
// the language story lands this list is empty and English is the only
// language in play.
const availableLangs = ref([])
const defaultLang = 'en'

const enItemTranslations = ref({})
const enCountryTranslations = ref({})
const enPartnerTranslations = ref({})
const enTimelineEventTranslations = ref({})
const enCollectionTranslations = ref({})
const translationsCache = ref({}) // lang -> item translations (for detail view)

let enLoaded = false

// Glob instead of literal imports: which translation files exist varies by
// dataset/export (e.g. timeline events currently ship without translations
// in any language), and a literal import of an absent file fails the build.
// The glob only binds files that actually exist in the installed package;
// absent ones resolve to empty maps.
const enTranslationLoaders = import.meta.glob('@inventory-data/translations/*.en.json')

function loadEnFile(entity) {
  const suffix = `/translations/${entity}.en.json`
  const key = Object.keys(enTranslationLoaders).find(k => k.endsWith(suffix))
  return key ? enTranslationLoaders[key]() : Promise.resolve({ default: {} })
}

async function loadEnglishTranslations() {
  if (enLoaded) return
  enLoaded = true
  await Promise.allSettled([
    loadEnFile('items').then(m => { enItemTranslations.value = m.default }),
    loadEnFile('countries').then(m => { enCountryTranslations.value = m.default }),
    loadEnFile('partners').then(m => { enPartnerTranslations.value = m.default }),
    loadEnFile('timeline_events').then(m => { enTimelineEventTranslations.value = m.default }),
    loadEnFile('collections').then(m => { enCollectionTranslations.value = m.default }),
  ])
  // Seed English into the detail-view cache too
  if (!translationsCache.value['en']) {
    translationsCache.value = { ...translationsCache.value, en: enItemTranslations.value }
  }
}

// Template-literal dynamic import (not a glob) so Vite code-splits one chunk
// per language, fetched only when that language is first activated.
async function loadLangTranslations(lang) {
  if (translationsCache.value[lang]) return
  try {
    const m = await import(`@inventory-data/translations/items.${lang}.json`)
    translationsCache.value = { ...translationsCache.value, [lang]: m.default }
  } catch {
    // No items translation file for this language: cache an empty map so the
    // missing file is not re-fetched on every render.
    translationsCache.value = { ...translationsCache.value, [lang]: {} }
  }
}

// Call immediately so lists are populated as soon as the app boots
loadEnglishTranslations()

// ── Label helpers (always English) ─────────────────────────────────────────

function itemLabel(item) {
  if (!item) return ''
  return mdStrip(enItemTranslations.value[item.id]?.name ?? item.internal_name ?? item.id)
}

function countryLabel(countryId) {
  if (!countryId) return ''
  const fallback = countries.value.find(c => c.id === countryId)
  return mdStrip(enCountryTranslations.value[countryId]?.name ?? fallback?.internal_name ?? countryId)
}

function partnerLabel(partnerId) {
  if (!partnerId) return ''
  const fallback = partners.value.find(p => p.id === partnerId)
  return mdStrip(enPartnerTranslations.value[partnerId]?.name ?? fallback?.id ?? partnerId)
}

// ── Lookup maps ────────────────────────────────────────────────────────────

const itemById = computed(() => {
  const m = {}
  for (const item of items.value) m[item.id] = item
  return m
})

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
function findByPurpose(purpose) {
  return collections.value.find(c => c.purpose === purpose) ?? null
}

const exhibitions = computed(() => {
  const marker = findByPurpose('exhibitions-root')
  if (!marker) return []
  return collections.value
    .filter(c => c.parent_id === marker.id)
    .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999))
})

function exhibitionById(id) {
  return exhibitions.value.find(e => e.id === id) ?? null
}

function exhibitionThemes(exhibitionId) {
  return collections.value
    .filter(c => c.parent_id === exhibitionId)
    .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999))
    .map(theme => ({
      ...theme,
      pages: collections.value
        .filter(c => c.parent_id === theme.id)
        .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999)),
    }))
}

function exhibitionThemeById(exhibitionId, themeId) {
  return exhibitionThemes(exhibitionId).find(t => t.id === themeId) ?? null
}

// ── Item cross-links: exhibitions that feature a given item ────────────────
//
// No separate export is needed for this: collections.json already lists
// each collection's items[] (used to render exhibition theme/page grids),
// so "which collections reference this item" is just a client-side reverse
// lookup over the same data.

function collectionsContainingItem(itemId) {
  return collections.value.filter(c => c.items?.some(it => it.id === itemId))
}

function exhibitionLinksForItem(itemId) {
  const marker = findByPurpose('exhibitions-root')
  if (!marker) return []
  const links = []
  const seen = new Set()
  for (const c of collectionsContainingItem(itemId)) {
    // Either attached directly to the exhibition itself (an "introduction"
    // item — see the Exhibitions section comment above), or to a page
    // nested under a theme nested under the exhibition.
    let exhibition = null
    let themeId = null
    if (c.parent_id === marker.id) {
      exhibition = c
    } else {
      const theme = collections.value.find(t => t.id === c.parent_id)
      const ex = theme && collections.value.find(e => e.id === theme.parent_id)
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
      label: enCollectionTranslations.value[exhibition.id]?.title ?? exhibition.internal_name,
    })
  }
  return links
}

// ── Markdown helpers ───────────────────────────────────────────────────────

// Full block markdown → HTML (for prose sections)
function md(text) {
  if (!text) return ''
  return marked.parse(text, { breaks: true })
}

// Inline markdown → HTML without block-level <p> wrapping (for titles, names)
function mdInline(text) {
  if (!text) return ''
  return marked.parseInline(text)
}

// Strip all markdown to plain text (for alt attributes, search matching, etc.)
// Walks marked's inline token tree directly — no HTML intermediate, no regex.
function mdStrip(text) {
  if (!text) return ''
  function tokensToText(tokens) {
    return tokens.map(t => {
      if (t.tokens?.length) return tokensToText(t.tokens)
      if (t.type === 'image') return t.text ?? ''   // alt text
      if (t.type === 'html') return ''              // discard raw HTML nodes
      if (t.type === 'br' || t.type === 'softbreak') return ' '
      return t.text ?? ''
    }).join('')
  }
  return tokensToText(marked.Lexer.lexInline(text))
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
    availableLangs,
    defaultLang,
    enItemTranslations,
    enCountryTranslations,
    enPartnerTranslations,
    enTimelineEventTranslations,
    enCollectionTranslations,
    translationsCache,
    loadEnglishTranslations,
    loadLangTranslations,
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
