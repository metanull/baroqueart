<script setup>
import { useI18n } from '@metanull/viewer-core'
import { TimelineResultsView } from '@metanull/viewer-layout/views'
import { timelineResults } from '../composables/timeline.js'
import { useInventoryData } from '../composables/useInventoryData.js'

const { t } = useI18n()
const { countryLabel } = useInventoryData()

// The active-filter suffix on the heading, unchanged from before this view
// moved onto the spec: null when nothing is filtered, so the heading never
// carries a stray dash.
function filterLabel(filters) {
  const parts = []
  if (filters.country) parts.push(countryLabel(filters.country))
  if (filters.begin) parts.push(`${t('catalogue.filter.from')} ${filters.begin}`)
  if (filters.end) parts.push(`${t('catalogue.filter.to')} ${filters.end}`)
  return parts.length ? parts.join(' — ') : null
}
</script>

<template>
  <TimelineResultsView :spec="timelineResults">
    <template #before="{ filters }">
      <RouterLink to="/timeline" class="back-link">‹ {{ $t('timeline.nav.backLink') }}</RouterLink>
      <h1 class="section-heading">
        {{ $t('baroqueart.nav.timeline') }}
        <span v-if="filterLabel(filters)" class="heading-filter"> — {{ filterLabel(filters) }}</span>
      </h1>
    </template>
  </TimelineResultsView>
</template>

<style scoped>
.heading-filter { font-weight: normal; font-size: 14px; color: var(--muted); }
</style>
