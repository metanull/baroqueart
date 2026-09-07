<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n, NotFoundView } from '@metanull/viewer-core'
import { SectionCards } from '@metanull/viewer-layout/content'
import { exhibitionsTree } from '../composables/exhibitions.js'
import { useInventoryData } from '../composables/useInventoryData.js'

// The exhibition's own home: its title, subtitle, description and credits —
// per-exhibition data, not fixed text, so this stays a small wrapper of its
// own rather than `TextPageView` (whose `body` is an entry name, or a
// function returning static Markdown, never per-record catalogue text). The
// theme list — plus the introduction, when the exhibition has one — is
// `SectionCards`' `rows` variant, with the hover image the exhibition's own
// splash never carried before.

const route = useRoute()
const { itemById, md, mdInline, mdStrip, tr } = useInventoryData()
const { t } = useI18n()

const exhibitionId = computed(() => decodeURIComponent(route.params.exhibitionId))
const exhibition = computed(() => exhibitionsTree.byId.value.get(exhibitionId.value) ?? null)
const text = computed(() => (exhibition.value ? tr('collections', exhibition.value.id) : {}))

// "Introduction" is not a theme — it is the exhibition's own text (read on
// its own route, ExhibitionIntroduction.vue) plus the items attached to the
// exhibition collection directly, not to any theme or page.
const hasIntroduction = computed(() => {
  const e = exhibition.value
  if (!e) return false
  return (e.items?.length ?? 0) > 0 || Boolean(text.value.extra?.intro_text) || Boolean(text.value.extra?.intro_header)
})

function themeImage(themeId) {
  const itemId = exhibitionsTree.itemsUnder(themeId)[0]
  return itemId ? (itemById.value.get(itemId)?.images?.[0]?.url ?? '') : ''
}

const themeCards = computed(() => {
  const e = exhibition.value
  if (!e) return []
  const introCard = hasIntroduction.value
    ? [{ title: t('exhibition.nav.introduction'), to: { name: 'exhibition-introduction', params: { exhibitionId: e.id } } }]
    : []
  const themes = exhibitionsTree.children(e.id).map((theme) => ({
    title: mdStrip(tr('collections', theme.id).title ?? theme.internal_name),
    image: themeImage(theme.id),
    to: { name: 'exhibition-theme', params: { exhibitionId: e.id, themeId: theme.id } },
  }))
  return [...introCard, ...themes]
})
</script>

<template>
  <NotFoundView v-if="!exhibition" />

  <div v-else>
    <a class="back-link" href="#" @click.prevent="$router.push('/exhibitions')">← {{ t('exhibition.chapter.returnToExhibitions') }}</a>

    <h1 class="section-heading" v-html="mdInline(text.title ?? exhibition.internal_name)" />

    <div class="content-box">
      <h2 v-if="text.extra?.subtitle" v-html="mdInline(text.extra.subtitle)" />
      <div v-if="text.description" class="mwnf-sheet__block" v-html="md(text.description)" />
      <p v-if="text.extra?.credits" v-html="mdInline(text.extra.credits)" />
    </div>

    <div class="content-box">
      <SectionCards v-if="themeCards.length" :cards="themeCards" variant="rows" />
      <p v-else>{{ t('baroqueart.exhibition.empty') }}</p>
    </div>
  </div>
</template>
