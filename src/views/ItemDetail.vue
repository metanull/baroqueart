<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { timelineLinkFor } from '@metanull/viewer-core'
import { MediaGallery, RecordLanguages, SheetSection } from '@metanull/viewer-layout/content'
import { RecordView } from '@metanull/viewer-layout/views'
import { useInventoryData } from '../composables/useInventoryData.js'
import { itemSheet } from '../composables/sheet.js'

// The item sheet is the platform's composed record page, rendering the spec
// in composables/sheet.js. What is this website's fills the page's slots:
// the header — the way back, the timeline link, the type badge — and, after
// the sheet, the blocks only Baroque Art has: a monument's special features,
// the related media, the exhibitions the item is on display in, the THG
// galleries.

defineProps({ id: { type: String, required: true } })

const router = useRouter()
const { exhibitionLinksForItem, items, md, mdInline, tr } = useInventoryData()

function back() {
  if (window.history.length > 2) router.back()
  else router.push('/')
}

const timelineLink = (record) => timelineLinkFor(record, { name: 'timeline-results' })

// A monument's sub-details are child items of type `detail`.
const detailsByParent = computed(() => {
  const map = new Map()
  for (const item of items.value ?? []) {
    if (item.type !== 'detail' || !item.parent_id) continue
    if (!map.has(item.parent_id)) map.set(item.parent_id, [])
    map.get(item.parent_id).push(item)
  }
  for (const list of map.values()) list.sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999))
  return map
})
const monumentDetails = (record) => detailsByParent.value.get(record.id) ?? []
const detailText = (detail, language) => tr('items', detail.id, language)

// Related media: the active language first, any language otherwise.
function relatedMedia(record, language) {
  const all = record.media ?? []
  const inLang = all.filter((m) => m.language === language)
  return inLang.length ? inLang : all
}

const onDisplayInLinks = (record) =>
  exhibitionLinksForItem(record.id).map((l) => ({
    label: l.label,
    to: l.themeId
      ? { name: 'exhibition-theme', params: { exhibitionId: l.exhibitionId, themeId: l.themeId } }
      : { name: 'exhibition-introduction', params: { exhibitionId: l.exhibitionId } },
  }))

// THG is due for a rewrite; these stay same-page anchors, not addresses.
const thgGalleryLinks = (record) =>
  (record.thg_galleries ?? []).map((g) => ({ name: g.name, href: `#ThematicGallery-${g.name}` }))
</script>

<template>
  <RecordView :spec="itemSheet" :id="id" class="detail content-box">
    <template #header="{ record, text, language, languages, select, dir, glossary }">
      <div class="detail-top">
        <a class="back-link" href="#" @click.prevent="back">← {{ $t('record.action.backToResults') }}</a>
        <router-link v-if="timelineLink(record)" :to="timelineLink(record)" class="timeline-link">{{ $t('record.action.viewOnTimeline') }} →</router-link>
      </div>
      <div class="detail-type-badge">{{ record.type }}</div>
      <RecordLanguages :languages="languages" :language="language" @select="select" />
      <h1 class="detail-title" :dir="dir" v-html="mdInline(text.name ?? record.internal_name ?? record.id, glossary)"></h1>
    </template>

    <template #after-sheet="{ record, language, dir, glossary }">
      <!-- Special features: a monument's sub-details -->
      <SheetSection v-if="monumentDetails(record).length" :heading="$t('sheet.field.specialFeatures')" :dir="dir">
        <div v-for="d in monumentDetails(record)" :key="d.id" class="special-feature">
          <h3 class="special-feature-name" v-html="mdInline(detailText(d, language).name ?? d.internal_name ?? d.id)"></h3>
          <p v-if="detailText(d, language).location" class="special-feature-meta">{{ detailText(d, language).location }}</p>
          <p v-if="detailText(d, language).dates" class="special-feature-meta">{{ detailText(d, language).dates }}</p>
          <p v-if="d.artist_names?.length" class="special-feature-meta">{{ d.artist_names.join(', ') }}</p>
          <div v-if="detailText(d, language).description" class="mwnf-sheet__block" v-html="md(detailText(d, language).description, glossary)"></div>
          <MediaGallery v-if="d.images?.length" :images="d.images.map((img) => ({ url: img.url, alt: img.captions?.[language] ?? '' }))" variant="row" />
        </div>
      </SheetSection>

      <SheetSection v-if="relatedMedia(record, language).length" :heading="$t('record.related.video')">
        <div v-for="(m, i) in relatedMedia(record, language)" :key="i" class="media-entry">
          <a :href="m.url" target="_blank" rel="noopener" class="media-title">{{ m.title }}</a>
          <p v-if="m.description" class="media-description">{{ m.description }}</p>
        </div>
      </SheetSection>

      <SheetSection v-if="onDisplayInLinks(record).length" :heading="$t('record.related.onDisplayIn')">
        <ul class="link-list">
          <li v-for="(l, i) in onDisplayInLinks(record)" :key="i">
            <router-link :to="l.to"><span v-html="mdInline(l.label)"></span></router-link>
          </li>
        </ul>
      </SheetSection>

      <SheetSection v-if="thgGalleryLinks(record).length" :heading="$t('record.related.galleries')">
        <ul class="link-list">
          <li v-for="g in thgGalleryLinks(record)" :key="g.name"><a :href="g.href">{{ g.name }}</a></li>
        </ul>
      </SheetSection>
    </template>
  </RecordView>
</template>

<style scoped>
.detail-top { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 10px; }

.detail-type-badge {
  display: inline-block;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--heading);
  border: 1px solid var(--accent);
  padding: 2px 8px;
  margin-bottom: 10px;
}

.detail-title {
  font-size: 24px;
  font-weight: 400;
  color: var(--heading);
  margin: 10px 0 16px;
  line-height: 1.3;
}

.detail :deep(.mwnf-media) { margin-bottom: 20px; }
.detail :deep(.mwnf-sheet) { margin-bottom: 20px; }

/* Special features */
.special-feature { margin-bottom: 16px; }
.special-feature-name { font-size: 15px; font-weight: 500; color: var(--heading); margin-bottom: 4px; }
.special-feature-meta { font-size: 12px; color: var(--muted); margin: 0 0 4px; }

/* Related media */
.media-entry { margin-bottom: 10px; }
.media-title { font-size: 13px; font-weight: 500; color: var(--nav-active); }
.media-description { font-size: 12px; color: var(--muted); margin: 2px 0 0; }

/* Link lists */
.link-list { list-style: none; font-size: 13px; padding: 0; margin: 0; }
.link-list a { color: var(--nav-active); }
</style>
