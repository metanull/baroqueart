<script setup>
import { computed } from 'vue'
import { dateRange, sortChronological, useFacets, useI18n, useListQuery, usePagination } from '@metanull/viewer-core'
import { FacetSelect, FilterPanel, Pagination, RecordList, ResultsSummary } from '@metanull/viewer-layout/content'
import { useInventoryData } from '../composables/useInventoryData.js'
import { DATE_MODE, FACETS, PAGE_SIZE } from '../composables/catalogue.js'

// The Permanent Collection list: the filters in the URL, read by viewer-core;
// the options from the catalogue spec, over every record, as legacy offered
// them; the date rule the spec names; chronological order, undated last;
// the rows, the pages and the counts drawn by viewer-layout.

const { t } = useI18n()
const { countryLabel, itemLabel, items, mdInline, partnerLabel, partners, tr } = useInventoryData()

const { filters, page, apply, reset, goToPage } = useListQuery({
  keys: ['country', 'partner', 'begin', 'end'],
})
const options = useFacets(items, FACETS)

const results = computed(() => {
  let list = items.value ?? []
  if (filters.country) list = list.filter((item) => item.country_id === filters.country)
  if (filters.partner) list = list.filter((item) => item.partner_id === filters.partner)
  list = dateRange(list, { begin: filters.begin, end: filters.end, mode: DATE_MODE })
  return sortChronological(list)
})

const pageInfo = usePagination(results, { page, size: PAGE_SIZE })

// "[N objects, M monuments]", legacy's phrasing of the count.
const summary = computed(() => {
  let objects = 0
  let monuments = 0
  for (const item of results.value) {
    if (item.type === 'monument') monuments++
    else objects++
  }
  return [
    { label: t('catalogue.results.objectsFound'), count: objects },
    { label: t('catalogue.results.monumentsFound'), count: monuments },
  ]
})

const rows = computed(() =>
  pageInfo.value.rows.map((item) => {
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
  }),
)

// The heading's suffix: null when nothing is filtered, so it depends on the
// absence of a filter rather than on a comparison against a text.
const activeFilterLabel = computed(() => {
  if (filters.country) return countryLabel(filters.country)
  if (filters.partner) return partnerLabel(filters.partner)
  if (filters.begin) return `${t('catalogue.filter.from')} ${filters.begin}`
  if (filters.end) return `${t('catalogue.filter.upTo')} ${filters.end}`
  return null
})
</script>

<template>
  <div>
    <h1 class="section-heading">
      {{ $t('baroqueart.nav.permanentCollection') }}
      <span v-if="activeFilterLabel" class="heading-filter"> — {{ activeFilterLabel }}</span>
    </h1>

    <FilterPanel class="filters" :title="$t('catalogue.filter.heading')" @apply="apply()" @reset="reset()">
      <FacetSelect v-model="filters.country" :label="$t('catalogue.facet.country')" :options="options.country" :any-label="$t('catalogue.facet.any')" />
      <FacetSelect v-model="filters.partner" :label="$t('catalogue.facet.holdingInstitution')" :options="options.partner" :any-label="$t('catalogue.facet.any')" />
      <label class="mwnf-facet">
        <span class="mwnf-facet__label">{{ $t('catalogue.facet.fromYear') }}</span>
        <input v-model="filters.begin" type="number" class="year" :placeholder="$t('baroqueart.filter.fromYearHint')" />
      </label>
      <label class="mwnf-facet">
        <span class="mwnf-facet__label">{{ $t('catalogue.facet.toYear') }}</span>
        <input v-model="filters.end" type="number" class="year" :placeholder="$t('baroqueart.filter.toYearHint')" />
      </label>
    </FilterPanel>

    <div class="content-box">
      <ResultsSummary :parts="summary" />

      <RecordList :records="rows">
        <template #empty>{{ $t('catalogue.results.noResultsFilter') }}</template>
      </RecordList>

      <Pagination :page-info="pageInfo" :window="7" @navigate="goToPage" />
    </div>
  </div>
</template>

<style scoped>
.heading-filter { font-weight: normal; font-size: 14px; color: var(--muted); }
.filters { margin-bottom: 16px; }
.year { width: 100px; }
</style>
