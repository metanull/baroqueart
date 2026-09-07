<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { CatalogueResultsView } from '@metanull/viewer-layout/views'
import { timelineGallery } from '../composables/timeline.js'

const route = useRoute()

// Back to the same filtered results, not a blank Timeline — the query keys
// are the same three this page itself reads.
const backTo = computed(() => ({
  path: '/timeline/results',
  query: {
    country: route.query.country,
    begin: route.query.begin,
    end: route.query.end,
  },
}))
</script>

<template>
  <CatalogueResultsView :spec="timelineGallery">
    <template #before>
      <RouterLink :to="backTo" class="back-link">‹ {{ $t('timeline.nav.backToEvents') }}</RouterLink>
      <h1 class="section-heading">{{ $t('timeline.results.galleryHeading') }}</h1>
    </template>
  </CatalogueResultsView>
</template>
