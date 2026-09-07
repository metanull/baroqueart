import { computed, ref } from 'vue'
import { centuryPresets, combineExpansions, countryExpansion, dateRange, glossaryExpansion, useFacets, useI18n, useKeywordIndex } from '@metanull/viewer-core'
import { useInventoryData } from './useInventoryData.js'
import { DATE_MODE, FACETS, PAGE_SIZE, SEARCH_FIELDS, SEARCH_FIELD_OPTIONS } from './catalogue.js'

// The search pages: what viewer-layout's `SearchFormView` renders on
// `/database` (the three-row keyword form) and `/permanent-collection`
// (the one-filter-at-a-time radio form), and what its `CatalogueResultsView`
// sibling renders on `/database/results` over the same field grammar. The
// row/AND-OR fold, the facet derivation and the query-string engine are the
// platform's; what is declared here is only this website's: which fields the
// rows search (`catalogue.js`'s `SEARCH_FIELDS`), the two legacy expansions
// (decision D3), and the refine row's own extra keyword.

const { items, countryLabel, itemLabel, mdInline, tr } = useInventoryData()

// ── `/database`: the three-row keyword entrance ────────────────────────────

export const searchEntrance = {
  mode: 'rows',
  fields: SEARCH_FIELD_OPTIONS,
  dates: { presets: centuryPresets() },
  language: 'items',
  target: 'database-results',
}

// ── `/permanent-collection`: one filter at a time ──────────────────────────
//
// The country/holding-institution options are the same derivation the
// Permanent Collection results page's own facets use (`catalogue.js`'s
// `FACETS`) — a value the reference entity does not carry is not offered.

const pcFacetOptions = useFacets(items, FACETS)

export const pcEntrance = computed(() => ({
  mode: 'radio',
  facets: [
    { key: 'country', label: 'catalogue.facet.country', options: pcFacetOptions.value.country },
    { key: 'partner', label: 'catalogue.facet.holdingInstitution', options: pcFacetOptions.value.partner },
    { key: 'begin', label: 'catalogue.facet.startDate', type: 'year' },
    { key: 'end', label: 'catalogue.facet.endDate', type: 'year' },
  ],
  target: 'permanent-collection-results',
}))

// ── `/database/results`: the keyword search ────────────────────────────────
//
// `SearchFormView`'s own query keys (`q`/`field`, `q2`/`field2`/`op2`,
// `q3`/`field3`/`op3`, `from`, `to`, `lang`), read the same way here as the
// form writes them. `q4`/`field4`/`op4` are the refine row's own — the
// site's, not the platform's, since the entrance is always three rows.

const KEYS = ['q', 'field', 'q2', 'field2', 'op2', 'q3', 'field3', 'op3', 'q4', 'field4', 'op4', 'from', 'to', 'lang']

function keywordRows(filters) {
  return [
    { keyword: filters.q, field: filters.field || 'keyword', cond: 'AND' },
    { keyword: filters.q2, field: filters.field2 || 'keyword', cond: filters.op2 || 'AND' },
    { keyword: filters.q3, field: filters.field3 || 'keyword', cond: filters.op3 || 'AND' },
    { keyword: filters.q4, field: filters.field4 || 'keyword', cond: filters.op4 || 'AND' },
  ]
}

// Every name spelled out once, here, so the resolved text can be looked up
// by key afterwards without a second, dynamic call to `t` — which the check
// that every name resolves cannot see through.
function fieldLabels(t) {
  return {
    keyword: t('catalogue.field.keywords'),
    name: t('sheet.field.name'),
    location: t('sheet.field.location'),
    provenance: t('sheet.field.provenance'),
    patron: t('catalogue.field.patron'),
    artist: t('catalogue.field.artist'),
    material: t('catalogue.field.material'),
    other: t('catalogue.field.other'),
  }
}

/** The field options, resolved, for a site template's own refine row. */
export function useSearchFieldLabels() {
  const { t } = useI18n()
  return computed(() => {
    const labels = fieldLabels(t)
    return SEARCH_FIELD_OPTIONS.map((f) => ({ key: f.key, label: labels[f.key] ?? f.key }))
  })
}

// The index is one long-lived instance — every other composable in this
// module is, following `useInventoryData`'s own lead — with the search
// language read off a plain ref `narrow` keeps in step with the filters on
// every call, rather than a second `useListQuery` instance of its own.
const searchLanguage = ref('')
const index = useKeywordIndex('items', {
  grammar: 'fields',
  fields: SEARCH_FIELDS,
  language: searchLanguage,
  rank: 'hits',
  expand: combineExpansions(glossaryExpansion(), countryExpansion()),
})

export const searchResults = {
  entity: 'items',
  keys: KEYS,
  narrow: (list, filters) => {
    searchLanguage.value = filters.lang || ''
    const matched = index.search(keywordRows(filters))
    return dateRange(matched, { begin: filters.from, end: filters.to, mode: DATE_MODE })
  },
  // Already ranked by `narrow` (`rank: 'hits'`) — a second, chronological
  // sort here would undo it.
  sort: false,
  pageSize: PAGE_SIZE,
  variant: 'list',
  recordRoute: 'item',
  filterMode: 'apply',
  empty: 'catalogue.results.noResultsSearch',
  pagination: { window: 7 },

  record: (item) => {
    const text = tr('items', item.id)
    return {
      id: item.id,
      image: item.images?.[0]?.url ?? '',
      imageAlt: itemLabel(item),
      name: mdInline(text.name ?? item.internal_name ?? item.id),
      meta: [countryLabel(item.country_id), text.dates, text.location].filter(Boolean),
      badge: item.type,
      to: { name: 'item', params: { id: item.id } },
    }
  },

  summary: ({ filters, pageInfo, t }) => {
    const labels = fieldLabels(t)
    const parts = keywordRows(filters)
      .filter((row) => row.keyword)
      .map((row, i) => `${i > 0 ? `${row.cond} ` : ''}${labels[row.field] ?? row.field}: "${row.keyword}"`)
    if (filters.from) parts.push(`${t('catalogue.filter.from')} ${filters.from}`)
    if (filters.to) parts.push(`${t('catalogue.filter.to')} ${filters.to}`)
    if (filters.lang) parts.push(`${t('catalogue.search.language')}: ${filters.lang.toUpperCase()}`)
    return [
      { label: t('catalogue.search.summary'), value: parts.length ? parts.join(' · ') : t('catalogue.results.allItems') },
      { label: t('catalogue.results.itemsFound'), count: pageInfo.total },
    ]
  },
}
