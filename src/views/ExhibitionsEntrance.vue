<script setup>
import { computed } from 'vue'
import { useI18n } from '@metanull/viewer-core'
import { SectionCards } from '@metanull/viewer-layout/content'
import { exhibitionsTree } from '../composables/exhibitions.js'
import { useInventoryData } from '../composables/useInventoryData.js'

// The exhibitions list: one card per exhibition, `SectionCards`' `rows`
// variant. A card's title is catalogue data, not a fixed entry, so it is
// stripped of Markdown rather than rendered — `SectionCards` interpolates
// it as plain text, not HTML.
const { mdStrip, tr } = useInventoryData()
const { t } = useI18n()

const exhibitionCards = computed(() => {
  const root = exhibitionsTree.root.value
  if (!root) return []
  return exhibitionsTree.children(root.id).map((exhibition) => ({
    title: mdStrip(tr('collections', exhibition.id).title ?? exhibition.internal_name),
    to: { name: 'exhibition', params: { exhibitionId: exhibition.id } },
  }))
})
</script>

<template>
  <div v-if="!exhibitionCards.length" class="mwnf-panel">
    <p>{{ t('baroqueart.notFound.exhibitions') }}</p>
  </div>

  <div v-else>
    <h1 class="mwnf-heading">{{ t('baroqueart.nav.exhibitions') }}</h1>
    <div class="mwnf-panel">
      <p>{{ t('baroqueart.exhibition.selectPrompt') }}</p>
      <SectionCards :cards="exhibitionCards" variant="rows" />
    </div>
  </div>
</template>
