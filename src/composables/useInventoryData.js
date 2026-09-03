import { ref, computed } from 'vue'
import { marked } from 'marked'
import { renderBlock, renderInline, useDataPackage } from '@metanull/viewer-core'
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

// Offered content languages — the items-driven rule (#7): exactly the
// languages the item records are translated into, derived from the
// items.<lang>.json files present in the installed package. Never from
// manifest.languages, which over-declares 18 languages, most without any
// content. The rule and its rationale are documented in dataset.config.js,
// which derives the same list for the switcher (with its own lazy glob, so
// the config module does not pull this file's eager JSON into the entry
// chunk). English first, the rest sorted.
const itemTranslationLoaders = import.meta.glob('@inventory-data/translations/items.*.json')
const itemLangCodes = Object.keys(itemTranslationLoaders)
  .map(path => path.match(/items\.([a-z]{2})\.json$/)?.[1])
  .filter(Boolean)
const availableLangs = ref([
  ...(itemLangCodes.includes('en') ? ['en'] : []),
  ...itemLangCodes.filter(l => l !== 'en').sort(),
])
const defaultLang = 'en'

const { loadTranslations } = useDataPackage()

const enItemTranslations = ref({})
const enCountryTranslations = ref({})
const enPartnerTranslations = ref({})
const enTimelineEventTranslations = ref({})
const enCollectionTranslations = ref({})
const translationsCache = ref({}) // lang -> item translations (for detail view)

let enLoaded = false

// Every translation file is loaded by name through useDataPackage — which
// only binds files that actually exist in the installed package, resolving
// absent ones to empty maps — never by a dynamic import with an interpolated
// specifier (`import(`...${lang}...`)`), which a bundler can't resolve
// statically and so bundles every language eagerly instead of lazily loading
// the one asked for. That is what made this build unable to finish in CI.
async function loadEnglishTranslations() {
  if (enLoaded) return
  enLoaded = true
  const [itemsT, countriesT, partnersT, timelineEventsT, collectionsT] = await Promise.all([
    loadTranslations('items', 'en'),
    loadTranslations('countries', 'en'),
    loadTranslations('partners', 'en'),
    loadTranslations('timeline_events', 'en'),
    loadTranslations('collections', 'en'),
  ])
  enItemTranslations.value = itemsT
  enCountryTranslations.value = countriesT
  enPartnerTranslations.value = partnersT
  enTimelineEventTranslations.value = timelineEventsT
  enCollectionTranslations.value = collectionsT
  // Seed English into the detail-view cache too
  if (!translationsCache.value['en']) {
    translationsCache.value = { ...translationsCache.value, en: enItemTranslations.value }
  }
}

async function loadLangTranslations(lang) {
  if (translationsCache.value[lang]) return
  const data = await loadTranslations('items', lang)
  translationsCache.value = { ...translationsCache.value, [lang]: data }
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
// Rendered by viewer-core, which escapes raw HTML instead of rendering it.
// A data package holds Markdown — the importer converts the legacy HTML on
// the way in — so a tag arriving in a field means that conversion missed it,
// and it shows on the page as the characters it is. The fix belongs in the
// importer; rendering it here would hide the one thing worth seeing, and it
// would make a museum record the single input this site trusts with markup.
//
// mdStrip stays on marked: it lexes, it renders nothing, and it already
// discards raw HTML nodes rather than passing them on.
function md(text) {
  if (!text) return ''
  return renderBlock(text, { breaks: true })
}

// Inline markdown → HTML without block-level <p> wrapping (for titles, names)
function mdInline(text) {
  if (!text) return ''
  return renderInline(text)
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
