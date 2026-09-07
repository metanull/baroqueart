import { dateRange, effectiveYearTo, eventDateLabel } from '@metanull/viewer-core'
import { useInventoryData } from './useInventoryData.js'
import { DATE_MODE, PAGE_SIZE, permanentCollection } from './catalogue.js'

// The timeline spec: what viewer-layout's `TimelineResultsView` renders on
// `/timeline` (`entrance: true`, the form alone) and `/timeline/results`
// (the same country merge, paginated), and what its `CatalogueResultsView`
// sibling renders on `/timeline/gallery` — the legacy `hcr_gallery.php` this
// site had dropped (decision D1). The engine — the country merge, the
// overlap rule, the query state — is the platform's; what is declared here
// is only this website's: the per-event "View items from this period" link
// into the Permanent Collection results (unchanged since before this spec
// existed), and the gallery's own country-and-period scope.

const { countryLabel, items, md, mdInline, tr } = useInventoryData()

/** The three controls every one of this site's Timeline pages offers. */
const CONTROLS = [{ key: 'country' }, { key: 'begin' }, { key: 'end' }]

function itemsLink(event) {
  const yt = effectiveYearTo(event)
  return {
    name: 'permanent-collection-results',
    query: {
      country: event.country_id,
      begin: String(event.year_from),
      end: String(yt !== null ? yt : event.year_from),
    },
  }
}

function timelineEvent(event, ctx) {
  const { t } = ctx
  const text = tr('timeline_events', event.id)
  return {
    id: event.id,
    date: eventDateLabel(event, text, t),
    caption: mdInline(countryLabel(event.country_id)),
    description: text?.description ? md(text.description) : '',
    // `TimelineEventList` renders an action's `label` verbatim (it is not a
    // `RecordList`/`RelatedRecords` row, which resolve their own); the entry
    // is named here, but it is `t`, not the view, that resolves it.
    actions: [{ label: t('timeline.action.viewItemsFromPeriod'), to: itemsLink(event) }],
  }
}

/** The scope the gallery and the "See gallery" cross-link both test. */
function scopedToFilters(item, filters) {
  return !filters.country || item.country_id === filters.country
}

function galleryCount(ctx) {
  return dateRange(items.value.filter((item) => scopedToFilters(item, ctx.filters)), {
    begin: ctx.filters.begin,
    end: ctx.filters.end,
    mode: DATE_MODE,
  }).length
}

const shared = {
  scope: 'country',
  countryLabel,
  tr: (id) => tr('timeline_events', id),
  controls: CONTROLS,
  event: timelineEvent,
}

/** `/timeline`: the form alone, navigating to the results on submit. */
export const timelineEntrance = {
  ...shared,
  entrance: true,
  route: 'timeline-results',
  submitLabel: 'core.action.go',
}

/** `/timeline/results`: the same controls, paginated, with the gallery cross-link. */
export const timelineResults = {
  ...shared,
  pageSize: 15,
  filterTitle: 'catalogue.filter.heading',
  gallery: { route: 'timeline-gallery', items: galleryCount },
}

/**
 * `/timeline/gallery`: the Permanent Collection objects of the country and
 * period the results page was showing. The row and the objects/monuments
 * summary are the Permanent Collection's own, unchanged — this is the same
 * catalogue, scoped rather than re-described.
 */
export const timelineGallery = {
  entity: 'items',
  keys: ['country', 'begin', 'end'],
  scope: scopedToFilters,
  dates: { mode: DATE_MODE },
  sort: 'chronological',
  pageSize: PAGE_SIZE,
  variant: 'list',
  recordRoute: 'item',
  empty: 'catalogue.results.noResultsFilter',
  pagination: { window: 7 },
  record: permanentCollection.record,
  summary: permanentCollection.summary,
}
