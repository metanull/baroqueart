<script setup>
import { computed, ref, watch } from 'vue'
import { dateRange, useI18n, useKeywordIndex, useListQuery, usePagination } from '@metanull/viewer-core'
import { FilterPanel, Pagination, RecordList, ResultsSummary } from '@metanull/viewer-layout/content'
import { useInventoryData } from '../composables/useInventoryData.js'
import { DATE_MODE, PAGE_SIZE, SEARCH_FIELDS, useSearchFields } from '../composables/catalogue.js'

// The database results: the query in the URL, read by viewer-core; the eight
// fields and the AND/OR fold of database.php, run by viewer-core's field
// grammar over this website's field map; the rows, the pages and the summary
// drawn by viewer-layout. What is this page's is the order of things and
// the refine row legacy offered under the summary.

const { t } = useI18n()
const { countryLabel, itemLabel, loadTranslations, mdInline, tr } = useInventoryData()
const fieldOptions = useSearchFields()

// keyword1..3 and their fields come from the search form; keyword4 is the
// refine row; date_from/date_to and lang apply once to the whole query.
const { filters, page, apply, goToPage } = useListQuery({
  keys: [
    'keyword1', 'field1', 'keyword2', 'field2', 'cond2', 'keyword3', 'field3', 'cond3',
    'keyword4', 'field4', 'cond4', 'date_from', 'date_to', 'lang',
  ],
})

// The search language's translations, loaded when it is chosen; English is
// always there and is what the index falls back to.
watch(() => filters.lang, (lang) => { if (lang) loadTranslations('items', lang) }, { immediate: true })

const index = useKeywordIndex('items', { grammar: 'fields', fields: SEARCH_FIELDS, language: () => filters.lang })

const keywordRows = computed(() =>
  [1, 2, 3, 4].map((n) => ({
    keyword: filters[`keyword${n}`],
    field: filters[`field${n}`] || 'keyword',
    cond: n === 1 ? 'AND' : filters[`cond${n}`] || 'AND',
  })),
)

const results = computed(() =>
  dateRange(index.search(keywordRows.value), { begin: filters.date_from, end: filters.date_to, mode: DATE_MODE }),
)

const pageInfo = usePagination(results, { page, size: PAGE_SIZE })

const rows = computed(() =>
  pageInfo.value.rows.map((item) => {
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
  }),
)

// ── The summary of what was searched ───────────────────────────────────────

function fieldLabel(value) {
  return fieldOptions.value.find((f) => f.value === value)?.label ?? value
}

const searchedFor = computed(() => {
  const parts = keywordRows.value
    .filter((row) => row.keyword)
    .map((row, i) => `${i > 0 ? `${row.cond} ` : ''}${fieldLabel(row.field)}: "${row.keyword}"`)
  if (filters.date_from) parts.push(`${t('catalogue.filter.from')} ${filters.date_from}`)
  if (filters.date_to) parts.push(`${t('catalogue.filter.to')} ${filters.date_to}`)
  if (filters.lang) parts.push(`${t('catalogue.search.language')}: ${filters.lang.toUpperCase()}`)
  return parts
})

const summary = computed(() => [
  { label: t('catalogue.search.summary'), value: searchedFor.value.length ? searchedFor.value.join(' · ') : t('catalogue.results.allItems') },
  { label: t('catalogue.results.itemsFound'), count: pageInfo.value.total },
])

// ── The refine row ─────────────────────────────────────────────────────────

const showRefine = ref(false)
const refine = ref({ keyword: '', field: 'keyword', cond: 'AND' })

function applyRefine() {
  if (!refine.value.keyword.trim()) return
  apply({ keyword4: refine.value.keyword, field4: refine.value.field, cond4: refine.value.cond })
  showRefine.value = false
}
</script>

<template>
  <div>
    <h1 class="section-heading">{{ $t('baroqueart.nav.database') }} — {{ $t('catalogue.results.heading') }}</h1>

    <div class="content-box">
      <ResultsSummary :parts="summary">
        <template #actions>
          <RouterLink :to="{ name: 'database' }" class="btn btn-secondary small">{{ $t('catalogue.search.newSearch') }}</RouterLink>
          <button type="button" class="btn small" @click="showRefine = !showRefine">{{ $t('catalogue.search.refine') }}</button>
        </template>
      </ResultsSummary>

      <FilterPanel
        v-if="showRefine"
        class="refine"
        :title="$t('catalogue.search.refineHint')"
        :apply-label="$t('core.action.add')"
        :reset-label="$t('core.action.close')"
        @apply="applyRefine"
        @reset="showRefine = false"
      >
        <select v-model="refine.cond" class="cond">
          <option value="AND">{{ $t('catalogue.search.and') }}</option>
          <option value="OR">{{ $t('catalogue.search.or') }}</option>
        </select>
        <select v-model="refine.field" class="field">
          <option v-for="f in fieldOptions" :key="f.value" :value="f.value">{{ f.label }}</option>
        </select>
        <input v-model="refine.keyword" type="text" class="keyword" :placeholder="$t('catalogue.search.keywordPlaceholder')" />
      </FilterPanel>

      <RecordList :records="rows">
        <template #empty>
          {{ $t('catalogue.results.noResultsSearch') }}
          <RouterLink :to="{ name: 'database' }">{{ $t('catalogue.search.tryNewSearch') }}</RouterLink>
        </template>
      </RecordList>

      <Pagination :page-info="pageInfo" :window="7" @navigate="goToPage" />
    </div>
  </div>
</template>

<style scoped>
.btn.small { font-size: 12px; padding: 4px 12px; text-decoration: none; }
.btn.small + .btn.small { margin-left: 8px; }
.refine { margin: 12px 0; }
.cond { width: 60px; }
.field { width: 200px; }
.keyword { width: 200px; }
</style>
