<script setup>
import { useI18n } from '@metanull/viewer-core'
import { CatalogueResultsView } from '@metanull/viewer-layout/views'
import { useInventoryData } from '../composables/useInventoryData.js'
import { permanentCollection } from '../composables/catalogue.js'

// The Permanent Collection list is the platform's composed results page,
// rendering the spec in composables/catalogue.js. What is this website's is
// the heading: the section's name with the active filter as a suffix, which
// legacy printed and no other website does.

const { t } = useI18n()
const { countryLabel, partnerLabel } = useInventoryData()

// Null when nothing is filtered, so the suffix depends on the absence of a
// filter rather than on a comparison against a text.
function activeFilterLabel(filters) {
  if (filters.country) return countryLabel(filters.country)
  if (filters.partner) return partnerLabel(filters.partner)
  if (filters.begin) return `${t('catalogue.filter.from')} ${filters.begin}`
  if (filters.end) return `${t('catalogue.filter.upTo')} ${filters.end}`
  return null
}
</script>

<template>
  <CatalogueResultsView :spec="permanentCollection" class="pc-list">
    <template #before="{ filters }">
      <h1 class="section-heading">
        {{ $t('baroqueart.nav.permanentCollection') }}
        <span v-if="activeFilterLabel(filters)" class="heading-filter"> — {{ activeFilterLabel(filters) }}</span>
      </h1>
    </template>
  </CatalogueResultsView>
</template>

<style scoped>
.heading-filter { font-weight: normal; font-size: 14px; color: var(--muted); }
.pc-list :deep(.mwnf-catalogue__filters) { margin-bottom: 16px; }
/* The results in the website's content box, as every section's page is. */
.pc-list :deep(.mwnf-catalogue__body) {
  background: var(--content-bg);
  border: 1px solid var(--border);
  padding: 20px;
  margin-bottom: 16px;
}
.pc-list :deep(.mwnf-facet__select[type='number']) { width: 100px; }
</style>
