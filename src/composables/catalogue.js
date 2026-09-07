import { useInventoryData } from './useInventoryData.js'

// The catalogue spec: what this website's lists filter and search on. The
// engine — query state, options, dates, pages, the keyword grammar — is
// viewer-core's; what is declared here is only what is this website's: the
// date rule, the eight fields of the legacy search form (no period /
// dynasty on this site), and the two facets of the Permanent Collection.
// Two entrances and two results pages read this one declaration.

const { countries, countryLabel, itemLabel, mdInline, partnerLabel, partners, tr } = useInventoryData()

/** Twenty rows a page, as the legacy pages showed. */
export const PAGE_SIZE = 20

/** Decision D5: the standalone sites test overlap, tolerating a single date. */
export const DATE_MODE = 'overlap'

// ── The eight fields of database.php ───────────────────────────────────────
//
// What each searches is the legacy form's, field for field. `text` is the
// record's translation in the search language, with English behind it.
// `keyword` and `location` also carry the record's own `country_id`:
// `countryExpansion` (decision D3) resolves a typed country name to its id,
// and a field is only found by that expansion if its own haystack carries
// the id to match against.

export const SEARCH_FIELDS = {
  keyword: (item, text) => [text.name ?? item.internal_name, text.alternate_name, text.description, ...(item.tags ?? []), item.country_id],
  name: (item, text) => text.name ?? item.internal_name,
  location: (item, text) => [text.location, item.country_id],
  provenance: (item, text) => text.provenance,
  patron: (item, text) => text.patrons ?? text.initial_owner,
  artist: (item, text) => [...(item.artist_names ?? []), text.architects],
  material: (item, text) => text.type,
  // The catch-all across the descriptive fields the other seven leave out.
  other: (item, text) => [
    text.description, text.method_for_datation, text.method_for_provenance, text.obtention,
    text.bibliography, text.workshop, text.scriber, text.binding_desc, text.history,
  ],
}

/**
 * The field options of the search form, in legacy's order: `key` is the
 * query parameter and never a text; `label` is an entry name, written out
 * in full, resolved by whichever view or template reads it
 * (`SearchFormView`'s own `t`, or a site template's `$t`) — never here, so
 * the check that every name resolves can see it.
 */
export const SEARCH_FIELD_OPTIONS = [
  { key: 'keyword', label: 'catalogue.field.keywords' },
  { key: 'name', label: 'sheet.field.name' },
  { key: 'location', label: 'sheet.field.location' },
  { key: 'provenance', label: 'sheet.field.provenance' },
  { key: 'patron', label: 'catalogue.field.patron' },
  { key: 'artist', label: 'catalogue.field.artist' },
  { key: 'material', label: 'catalogue.field.material' },
  { key: 'other', label: 'catalogue.field.other' },
]

// ── The facets of the Permanent Collection ─────────────────────────────────
//
// Countries and institutions by name. A value the reference entity does not
// carry is not offered: the label would be an id.

export const FACETS = {
  country: {
    field: 'country_id',
    label: countryLabel,
    include: (id) => (countries.value ?? []).some((c) => c.id === id),
  },
  partner: {
    field: 'partner_id',
    label: partnerLabel,
    include: (id) => (partners.value ?? []).some((p) => p.id === id),
  },
}

// ── The Permanent Collection, as a spec ─────────────────────────────────────
//
// What viewer-layout's `CatalogueResultsView` renders on
// `/permanent-collection/results`: the two facets over every record, as
// legacy offered them, the two years, the date rule above, chronological
// order, twenty rows a page, and legacy's count phrased as "[N objects, M
// monuments]". Every text is an entry name; the check that every name
// resolves reads them here.

export const permanentCollection = {
  entity: 'items',
  keys: ['country', 'partner', 'begin', 'end'],
  facets: FACETS,
  facetScope: 'all',
  controls: [
    { key: 'country', label: 'catalogue.facet.country', anyLabel: 'catalogue.facet.any' },
    { key: 'partner', label: 'catalogue.facet.holdingInstitution', anyLabel: 'catalogue.facet.any' },
    { key: 'begin', type: 'year', label: 'catalogue.facet.fromYear', placeholder: 'timeline.form.fromYearHint' },
    { key: 'end', type: 'year', label: 'catalogue.facet.toYear', placeholder: 'timeline.form.toYearHint' },
  ],
  filterMode: 'apply',
  filterTitle: 'catalogue.filter.heading',
  dates: { mode: DATE_MODE },
  sort: 'chronological',
  pageSize: PAGE_SIZE,
  variant: 'list',
  recordRoute: 'item',
  empty: 'catalogue.results.noResultsFilter',
  pagination: { window: 7 },

  // The row: the thumbnail, the name, the country, the date and the holder,
  // the holder only when the package carries the partner, so a label is
  // never an id.
  record: (item) => {
    const text = tr('items', item.id)
    return {
      id: item.id,
      image: item.images?.[0]?.url ?? '',
      imageAlt: itemLabel(item),
      name: mdInline(text.name ?? item.internal_name ?? item.id),
      meta: [
        countryLabel(item.country_id),
        text.dates,
        (partners.value ?? []).some((p) => p.id === item.partner_id) ? partnerLabel(item.partner_id) : '',
      ].filter(Boolean),
      badge: item.type,
      to: { name: 'item', params: { id: item.id } },
    }
  },

  summary: ({ matching, t }) => {
    let objects = 0
    let monuments = 0
    for (const item of matching) {
      if (item.type === 'monument') monuments++
      else objects++
    }
    return [
      { label: t('catalogue.results.objectsFound'), count: objects },
      { label: t('catalogue.results.monumentsFound'), count: monuments },
    ]
  },
}
