<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { EssayView } from '@metanull/viewer-layout/views'
import { exhibitionTree } from '../composables/exhibitions.js'
import { exhibitionThemeSpec, themeRoute } from '../composables/exhibitionSpecs.js'

// A theme's page: an `EssayView` over the page node — the theme itself
// carries no quote, prose or items of its own (`useInventoryData.js`'s old
// walk always read `activePage`, never the theme). `?tab` in the query picks
// which of the theme's pages is active, same key legacy used; absent, this
// lands on the theme's first page. `spec.breadcrumb: true` renders the way
// back (exhibition, then theme) itself; no header override is needed here.
// The date/location/museum lines and the detail-variant justification are
// `spec.panel.fields`/`spec.panel.variants` now (they swap together with
// the selected variant), so this view supplies only the Previous/Next-page
// navigation legacy used instead of `EssayView`'s tree-crossing default.
const route = useRoute()

const exhibitionId = computed(() => decodeURIComponent(route.params.exhibitionId))
const themeId = computed(() => decodeURIComponent(route.params.themeId))
// A new exhibition id is a new tree (`EssayView` reads `spec.tree` once, at
// setup); `:key` below forces the remount that keeps it in step. Moving
// between themes/pages of the *same* exhibition never remounts — the tree
// itself is reactive to that, only the exhibition it is rooted on is not.
const tree = exhibitionTree(exhibitionId.value)
const spec = exhibitionThemeSpec(tree)
const route_ = themeRoute(tree)

const pages = computed(() => tree.children(themeId.value))
const activeId = computed(() => {
  const list = pages.value
  const idx = Number.parseInt(route.query.tab ?? '0', 10)
  const page = Number.isFinite(idx) && idx >= 0 && idx < list.length ? list[idx] : list[0]
  return page?.id ?? themeId.value
})

const hasIntroduction = computed(() => {
  const e = tree.root.value
  return Boolean(e) && (e.items?.length ?? 0) > 0
})

// `navigation: 'tree'` (decision D2) crosses from a theme's last page into
// the *next theme's own node*, which — like the theme itself — carries no
// content to show; skip past it to the next genuine page. What is left
// after skipping past the very first page's own predecessor is the true
// head of the exhibition, where the `navigation` slot below links back to
// the introduction instead, same as legacy has no "previous" there either.
// A page is a node whose parent's parent is the tree's own root — not a
// node with a two-long `tree.parents()` chain: `parents()` walks the true
// `parent_id` ancestry past this tree's root by design (the exhibitions
// marker, the project collection above it), so a page's chain is always
// longer than two and that test skipped every candidate.
const isPage = (node) => tree.byId.value.get(node.parent_id)?.parent_id === tree.root.value?.id
function previousPage(id) {
  let node = tree.previous(id)
  while (node && !isPage(node)) node = tree.previous(node.id)
  return node
}
function nextPage(id) {
  let node = tree.next(id)
  while (node && !isPage(node)) node = tree.next(node.id)
  return node
}
</script>

<template>
  <EssayView :key="exhibitionId" :spec="spec" :id="activeId" class="mwnf-panel">
    <template #navigation="{ node }">
      <div class="mwnf-essay__nav">
        <router-link v-if="previousPage(node.id)" :to="route_(previousPage(node.id))" class="mwnf-essay__nav-link mwnf-essay__nav-link--previous">
          ← {{ $t('exhibition.theme.previous') }}
        </router-link>
        <router-link
          v-else-if="hasIntroduction"
          :to="{ name: 'exhibition-introduction', params: { exhibitionId } }"
          class="mwnf-essay__nav-link mwnf-essay__nav-link--previous"
        >
          ← {{ $t('exhibition.nav.introduction') }}
        </router-link>
        <span v-else class="mwnf-essay__nav-spacer"></span>

        <router-link v-if="nextPage(node.id)" :to="route_(nextPage(node.id))" class="mwnf-essay__nav-link mwnf-essay__nav-link--next">
          {{ $t('exhibition.theme.next') }} →
        </router-link>
      </div>
    </template>
  </EssayView>
</template>
