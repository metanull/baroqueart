<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { EssayView } from '@metanull/viewer-layout/views'
import { SourceCredit } from '@metanull/viewer-layout/content'
import { exhibitionTree } from '../composables/exhibitions.js'
import { exhibitionIntroductionSpec } from '../composables/exhibitionSpecs.js'
import { useInventoryData } from '../composables/useInventoryData.js'

// The exhibition's introduction: not a theme, so it renders as an `about`
// essay over the exhibition node itself — its own `extra.intro_header` /
// `extra.intro_text`, reached through `spec.heading`/`spec.body`'s dotted
// path — plus the items attached to the exhibition collection directly,
// through the default grid (`spec.items.meta` for its caption lines).
const route = useRoute()
const router = useRouter()
const { tr } = useInventoryData()

const exhibitionId = computed(() => decodeURIComponent(route.params.exhibitionId))
// A new exhibition id is a new tree (`EssayView` reads `spec.tree` once, at
// setup); `:key` below forces the remount that keeps it in step.
const tree = exhibitionTree(exhibitionId.value)
const spec = exhibitionIntroductionSpec(tree)
const exhibitionTitle = computed(() => {
  const e = tree.root.value
  return e ? (tr('collections', e.id).title ?? e.internal_name) : ''
})

function back() {
  if (window.history.length > 2) router.back()
  else router.push(`/exhibitions/${exhibitionId.value}`)
}
</script>

<template>
  <EssayView :key="exhibitionId" :spec="spec" :id="exhibitionId" class="mwnf-panel">
    <template #after>
      <!-- Overriding EssayView's #after slot for the back-bar drops its
           default SourceCredit, so it is rendered here explicitly. -->
      <SourceCredit />
      <div class="mwnf-back-bar"><a href="#" @click.prevent="back">← {{ $t('baroqueart.exhibition.backTo') }} {{ exhibitionTitle }}</a></div>
    </template>
  </EssayView>
</template>
