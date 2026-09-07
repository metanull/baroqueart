<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from '@metanull/viewer-core'
import { PartnerMap, RecordLanguages, RelatedRecords } from '@metanull/viewer-layout/content'
import { RecordView } from '@metanull/viewer-layout/views'
import { heldItemRow, heldItems, mapLabel, partnerSheet } from '../composables/partner.js'
import { useInventoryData } from '../composables/useInventoryData.js'

defineProps({ id: { type: String, required: true } })

const router = useRouter()
const { t } = useI18n()
const { mdInline } = useInventoryData()

function back() {
  if (window.history.length > 2) router.back()
  else router.push('/partners')
}

// The "View Objects"/"View Monuments" count is the package's own
// `item_count` (decision G.1) — not a scan of every item, which the profile
// used to run just to print a number the exporter already carries.
function viewItemsLabel(record) {
  return record.type === 'institution' ? t('baroqueart.action.viewMonuments') : t('baroqueart.action.viewObjects')
}
function viewItemsLink(record) {
  return { path: '/permanent-collection/results', query: { partner: record.id } }
}

function normalizeUrl(url) {
  return url.startsWith('http') ? url : `http://${url}`
}
</script>

<template>
  <RecordView :spec="partnerSheet" :id="id" class="detail content-box">
    <template #header="{ record, text, language, languages, select, dir, glossary }">
      <a class="back-link" href="#" @click.prevent="back">← {{ $t('partner.nav.back') }}</a>
      <div><span class="detail-type-badge">{{ record.type === 'institution' ? $t('partner.info.typeInstitution') : $t('partner.info.typeMuseum') }}</span></div>
      <RecordLanguages :languages="languages" :language="language" @select="select" />
      <h1 class="detail-title" :dir="dir" v-html="mdInline(text.name ?? record.id, glossary)"></h1>
    </template>

    <template #before-sheet="{ record, text }">
      <div v-if="record.item_count" class="view-items-row">
        <RouterLink :to="viewItemsLink(record)" class="btn">{{ viewItemsLabel(record) }} ({{ record.item_count }}) →</RouterLink>
        <a v-if="text.website" :href="normalizeUrl(text.website)" target="_blank" rel="noopener" class="homepage-link">
          {{ $t('baroqueart.action.visitWebsite') }} ↗
        </a>
      </div>
    </template>

    <template #after-sheet="{ record, text }">
      <PartnerMap
        v-if="record.type === 'museum'"
        :latitude="record.latitude"
        :longitude="record.longitude"
        :zoom="record.map_zoom ?? 15"
        map-title-entry="partner.map.map"
        map-of-entry="partner.map.mapOf"
        open-map-link-entry="gallery.action.openInOpenStreetMap"
        :label="mapLabel(record, text)"
      />
    </template>

    <template #related="{ record }">
      <RelatedRecords
        v-if="heldItems(record).length"
        :heading="$t('record.related.items')"
        :records="heldItems(record).map(heldItemRow)"
        variant="list"
      />
    </template>
  </RecordView>
</template>

<style scoped>
.detail-type-badge {
  display: inline-block;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--heading);
  border: 1px solid var(--accent);
  padding: 2px 8px;
  margin-bottom: 10px;
  font-family: 'Roboto', sans-serif;
}

.detail-title {
  font-size: 24px;
  font-weight: 400;
  color: var(--heading);
  margin: 10px 0 16px;
  line-height: 1.3;
  font-family: 'Roboto', sans-serif;
}

.view-items-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.homepage-link {
  font-size: 13px;
  font-weight: 500;
  color: var(--nav-active);
  font-family: 'Roboto', sans-serif;
}
</style>
