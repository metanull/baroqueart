<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@metanull/viewer-core'
import { PartnerListView } from '@metanull/viewer-layout/views'
import { partnerList } from '../composables/partner.js'

const route = useRoute()
const { t } = useI18n()

const filterType = computed(() => (route.query.type === 'institution' ? 'institution' : 'museum'))
const otherType = computed(() => (filterType.value === 'museum' ? 'institution' : 'museum'))
const otherTypeLabel = computed(() =>
  otherType.value === 'museum' ? t('baroqueart.partner.viewMuseums') : t('baroqueart.partner.viewInstitutions')
)

// One spec per type: the museum/institution axis is this site's own, read
// off its own route rather than a spec option — `PartnerListView` groups
// and nests the result, unchanged whichever type is showing.
const spec = computed(() => ({
  ...partnerList(filterType.value),
  title: filterType.value === 'museum' ? 'partner.list.museums' : 'partner.list.institutions',
}))
</script>

<template>
  <PartnerListView :spec="spec" class="mwnf-panel">
    <template #before>
      <div class="mwnf-back-bar"><RouterLink to="/partners">‹ {{ $t('partner.nav.back') }}</RouterLink></div>
      <p class="type-switch">
        <RouterLink :to="{ path: '/partners/results', query: { type: otherType } }">{{ otherTypeLabel }}</RouterLink>
      </p>
    </template>
  </PartnerListView>
</template>

<style scoped>
.type-switch {
  font-family: 'Roboto', sans-serif;
  font-size: 12px;
  margin: 8px 0 12px;
}
</style>
