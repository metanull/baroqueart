<script setup>
import { computed } from 'vue'
import { I18nText, useFeaturedRecord, useI18n } from '@metanull/viewer-core'
import { FeaturedRecord, SectionCards } from '@metanull/viewer-layout/content'
import { useInventoryData } from '../composables/useInventoryData.js'

// The landing page: the welcome, the five sections as cards, and one item
// on display. The pick and the grid are the platform's; which sections, in
// what words, is this website's — every text written out so the check that
// every name resolves can read it.

const { t } = useI18n()
const { itemLabel, mdInline, tr } = useInventoryData()

const cards = computed(() => [
  { title: t('baroqueart.nav.permanentCollection'), description: t('baroqueart.home.permanentCollectionText'), action: t('core.action.browse'), to: { name: 'permanent-collection' } },
  { title: t('baroqueart.nav.database'), description: t('baroqueart.home.databaseText'), action: t('core.action.search'), to: { name: 'database' } },
  { title: t('baroqueart.nav.timeline'), description: t('baroqueart.home.timelineText'), action: t('core.action.explore'), to: { name: 'timeline' } },
  { title: t('baroqueart.nav.partners'), description: t('baroqueart.home.partnersText'), action: t('core.action.browse'), to: { name: 'partners' } },
  { title: t('baroqueart.nav.exhibitions'), description: t('baroqueart.home.exhibitionsText'), action: t('core.action.explore'), to: { name: 'exhibitions' } },
])

// One item with an image, picked once per visit.
const featured = useFeaturedRecord('items')
const featuredText = computed(() => (featured.value ? tr('items', featured.value.id) : {}))
</script>

<template>
  <div class="home">
    <div class="home-banner content-box">
      <h1 class="home-title">{{ $t('baroqueart.home.title') }}</h1>
      <I18nText tag="p" class="home-intro" keypath="baroqueart.home.intro" />
    </div>

    <SectionCards :cards="cards" />

    <FeaturedRecord
      v-if="featured"
      class="content-box"
      :heading="$t('baroqueart.home.itemOnDisplay')"
      :image="featured.images?.[0]?.url ?? ''"
      :image-alt="itemLabel(featured)"
      :eyebrow="featured.type"
      :name="mdInline(featuredText.name ?? featured.internal_name ?? featured.id)"
      :meta="[featuredText.location, featuredText.dates].filter(Boolean)"
      :action="$t('core.action.viewDetails')"
      :to="{ name: 'item', params: { id: featured.id } }"
    />
  </div>
</template>

<style scoped>
.home { display: flex; flex-direction: column; gap: 16px; }
.home-banner { border-top: 3px solid var(--accent); }
.home-title {
  font-size: 20px;
  font-weight: 400;
  color: var(--heading);
  margin-bottom: 10px;
}
.home-intro {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text);
  max-width: 680px;
}
</style>
