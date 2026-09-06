<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NotFoundView, citation, languageLabels, sheetRows, timelineLinkFor, useGlossaryPopup, useI18n,
  useProjectName, useRecordSheet, useRelatedRecords,
} from '@metanull/viewer-core'
import {
  GlossaryPopover, MediaGallery, RecordCredits, RecordLanguages, RecordSheet, RelatedRecords, SheetSection,
} from '@metanull/viewer-layout/content'
import { useInventoryData } from '../composables/useInventoryData.js'

// The item sheet. The mechanics — which language the record is read in, what
// is loaded for it, the glossary terms it reaches, how a field becomes a row,
// the credits, the related records, the timeline link — are viewer-core's.
// What this page owns is the field specification (which fields, in what
// order, under which labels, for an object and for a monument) and the
// blocks only Baroque Art has: a monument's special features, the exhibition
// links, the THG galleries.

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const projectName = useProjectName()
const { exhibitionLinksForItem, itemById, itemLabel, items, md, mdInline, tr } = useInventoryData()

const item = computed(() => itemById.value.get(decodeURIComponent(route.params.id)) ?? null)

// ── Language, loads, glossary ─────────────────────────────────────────────

const {
  language: activeLang, languages: itemLangs, dir: contentDir, select: selectLanguage,
  text, ready, terms, glossary,
} = useRecordSheet(item, { entity: 'items', translations: ['glossary'] })

const recordLanguages = computed(() => languageLabels(itemLangs.value))

// One listener on the sheet answers a click on any highlighted term.
const { active: activeTerm, onClick: onGlossaryClick, close: closeGlossary } = useGlossaryPopup(terms)
const activeTermHtml = computed(() => (activeTerm.value ? md(activeTerm.value.definition) : ''))

// ── The field specification ───────────────────────────────────────────────
//
// Legacy's two orders, `database_item.php`'s: a monument reads location,
// date, architects, patrons; an object reads holder, date, artist, scribe,
// inventory number, materials, dimensions, provenance, workshop, binding,
// owners, place of production. Every label is a shared entry, written out
// so the check that every name resolves can read it.

const isMonument = computed(() => item.value?.type === 'monument')

const monumentFacts = computed(() => [
  { key: 'alsoKnownAs', label: t('sheet.field.alsoKnownAs'), value: 'alternate_name' },
  { key: 'location', label: t('sheet.field.location'), value: 'location' },
  { key: 'date', label: t('sheet.field.dateOfMonument'), value: 'dates' },
  { key: 'architects', label: t('sheet.field.architects'), value: 'architects' },
  { key: 'patrons', label: t('sheet.field.patrons'), value: (c) => c.text.patrons ?? c.text.initial_owner },
])

const objectFacts = computed(() => [
  { key: 'alsoKnownAs', label: t('sheet.field.alsoKnownAs'), value: 'alternate_name' },
  { key: 'location', label: t('sheet.field.location'), value: 'location' },
  { key: 'holder', label: t('sheet.field.holdingMuseum'), value: 'holder' },
  { key: 'date', label: t('sheet.field.dateOfObject'), value: 'dates' },
  { key: 'artists', label: t('sheet.field.artists'), value: (c) => c.record.artist_names, join: ', ' },
  { key: 'scribe', label: t('sheet.field.scribe'), value: 'scriber' },
  { key: 'inventoryNumber', label: t('sheet.field.inventoryNumber'), value: (c) => c.record.owner_reference },
  { key: 'materials', label: t('sheet.field.materials'), value: 'type' },
  { key: 'dimensions', label: t('sheet.field.dimensions'), value: 'dimensions' },
  { key: 'provenance', label: t('sheet.field.provenance'), value: 'provenance' },
  { key: 'workshop', label: t('sheet.field.workshop'), value: 'workshop' },
  { key: 'binding', label: t('sheet.field.binding'), value: 'binding_desc' },
  { key: 'currentOwner', label: t('sheet.field.currentOwner'), value: 'owner' },
  { key: 'originalOwner', label: t('sheet.field.originalOwner'), value: 'initial_owner' },
  { key: 'placeOfProduction', label: t('sheet.field.placeOfProduction'), value: 'place_of_production' },
])

const sheetContext = computed(() => ({ record: item.value, text: text.value, glossary: glossary.value }))
const keyFacts = computed(() =>
  item.value ? sheetRows(isMonument.value ? monumentFacts.value : objectFacts.value, sheetContext.value) : [],
)

// The prose sections under the facts, with their legacy order and headings.
const monumentSections = computed(() => [
  { key: 'history', label: t('sheet.field.history'), value: 'history', render: 'block' },
  { key: 'description', label: t('sheet.field.description'), value: 'description', render: 'block' },
  { key: 'datation', label: t('sheet.field.monumentDatationMethod'), value: 'method_for_datation', render: 'block' },
  { key: 'provenanceMethod', label: t('sheet.field.provenanceMethod'), value: 'method_for_provenance', render: 'block' },
  { key: 'bibliography', label: t('sheet.field.bibliography'), value: 'bibliography', render: 'block' },
])
const objectSections = computed(() => [
  { key: 'description', label: t('sheet.field.description'), value: 'description', render: 'block' },
  { key: 'datation', label: t('sheet.field.datationMethod'), value: 'method_for_datation', render: 'block' },
  { key: 'obtention', label: t('sheet.field.obtentionMethod'), value: 'obtention', render: 'block' },
  { key: 'provenanceMethod', label: t('sheet.field.provenanceMethod'), value: 'method_for_provenance', render: 'block' },
  { key: 'bibliography', label: t('sheet.field.bibliography'), value: 'bibliography', render: 'block' },
  {
    key: 'catalogue',
    label: t('sheet.field.catalogue'),
    value: (c) => (c.text.catalogue_holding_link ? `[${c.text.catalogue_holding_link}](${c.text.catalogue_holding_link})` : ''),
    render: 'block',
  },
])
const contentSections = computed(() =>
  item.value ? sheetRows(isMonument.value ? monumentSections.value : objectSections.value, sheetContext.value) : [],
)

// Legacy's collapsible short description (`pc_view_sdesc`), under the
// description when the item also carries the shorter text.
const shortDescriptionHtml = computed(() =>
  text.value.short_description ? md(text.value.short_description, glossary.value) : '',
)
const showShortDescription = ref(false)
watch(() => item.value?.id, () => { showShortDescription.value = false })

// ── Images ────────────────────────────────────────────────────────────────

const images = computed(() =>
  (item.value?.images ?? []).map((img) => ({
    url: img.url,
    alt: img.captions?.[activeLang.value] ?? itemLabel(item.value),
    caption: img.captions?.[activeLang.value] ?? '',
    photographer: img.photographer ?? '',
  })),
)

// ── Credits, citation, related, timeline ──────────────────────────────────

const credits = computed(() =>
  [
    ['author', t('sheet.field.preparedBy')],
    ['copy_editor', t('sheet.field.copyeditedBy')],
    ['translator', t('sheet.field.translationBy')],
    ['translation_copy_editor', t('sheet.field.translationCopyeditedBy')],
  ]
    .filter(([field]) => text.value[field])
    .map(([field, label]) => ({ label, value: text.value[field] })),
)

const citationText = computed(() =>
  item.value
    ? citation({
        author: text.value.author,
        name: text.value.name ?? item.value.internal_name ?? '',
        project: projectName('BAR'),
        permalink: `${window.location.origin}${window.location.pathname}#/item/${encodeURIComponent(item.value.id)}`,
        inWord: t('record.citation.in'),
      })
    : '',
)

const related = useRelatedRecords(item, { entity: 'items', language: activeLang })
const relatedRows = computed(() =>
  related.value.inPackage.map(({ record, justification }) => ({
    id: record.id,
    image: record.images?.[0]?.url ?? '',
    imageAlt: itemLabel(record),
    name: mdInline(tr('items', record.id, activeLang.value).name ?? record.internal_name ?? record.id),
    meta: justification ? [justification] : [],
    badge: record.type,
    to: { name: 'item', params: { id: record.id } },
  })),
)

const timelineLink = computed(() => timelineLinkFor(item.value, { name: 'timeline-results' }))

// ── Related media — the active language first, any language otherwise ─────

const relatedMedia = computed(() => {
  const all = item.value?.media ?? []
  const inLang = all.filter((m) => m.language === activeLang.value)
  return inLang.length ? inLang : all
})

// ── What only this website has ────────────────────────────────────────────

// A monument's sub-details are child items of type `detail`.
const monumentDetails = computed(() =>
  (items.value ?? [])
    .filter((i) => i.parent_id === item.value?.id && i.type === 'detail')
    .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999)),
)
const detailText = (detail) => tr('items', detail.id, activeLang.value)

const onDisplayInLinks = computed(() =>
  item.value
    ? exhibitionLinksForItem(item.value.id).map((l) => ({
        label: l.label,
        to: l.themeId
          ? { name: 'exhibition-theme', params: { exhibitionId: l.exhibitionId, themeId: l.themeId } }
          : { name: 'exhibition-introduction', params: { exhibitionId: l.exhibitionId } },
      }))
    : [],
)
// THG is due for a rewrite; these stay same-page anchors, not addresses.
const thgGalleryLinks = computed(() =>
  (item.value?.thg_galleries ?? []).map((g) => ({ name: g.name, href: `#ThematicGallery-${g.name}` })),
)

function back() {
  if (window.history.length > 2) router.back()
  else router.push('/')
}
</script>

<template>
  <NotFoundView v-if="!item" />

  <div v-else class="detail-wrap">
    <a class="back-link" href="#" @click.prevent="back">← {{ $t('record.action.backToResults') }}</a>
    <router-link v-if="timelineLink" :to="timelineLink" class="timeline-link">{{ $t('record.action.viewOnTimeline') }} →</router-link>

    <div class="detail content-box" @click="onGlossaryClick">
      <div class="detail-type-badge">{{ item.type }}</div>

      <RecordLanguages :languages="recordLanguages" :language="activeLang" @select="selectLanguage" />

      <h1 class="detail-title" :dir="contentDir" v-html="mdInline(text.name ?? item.internal_name ?? item.id, glossary)"></h1>

      <MediaGallery :images="images" />

      <p v-if="!ready" class="detail-status">{{ $t('core.status.loading') }}</p>

      <RecordSheet :rows="keyFacts" :dir="contentDir" />

      <template v-for="section in contentSections" :key="section.key">
        <SheetSection :heading="section.label" :html="section.html" :dir="contentDir" />
        <section v-if="section.key === 'description' && shortDescriptionHtml" class="short-description">
          <button type="button" class="short-description-toggle" :aria-expanded="showShortDescription ? 'true' : 'false'" @click="showShortDescription = !showShortDescription">
            {{ showShortDescription ? $t('record.action.hideShortDescription') : $t('record.action.viewShortDescription') }}
          </button>
          <div v-if="showShortDescription" class="mwnf-sheet__block" :dir="contentDir" v-html="shortDescriptionHtml"></div>
        </section>
      </template>

      <!-- Special features: a monument's sub-details -->
      <SheetSection v-if="monumentDetails.length" :heading="$t('sheet.field.specialFeatures')" :dir="contentDir">
        <div v-for="d in monumentDetails" :key="d.id" class="special-feature">
          <h3 class="special-feature-name" v-html="mdInline(detailText(d).name ?? d.internal_name ?? d.id)"></h3>
          <p v-if="detailText(d).location" class="special-feature-meta">{{ detailText(d).location }}</p>
          <p v-if="detailText(d).dates" class="special-feature-meta">{{ detailText(d).dates }}</p>
          <p v-if="d.artist_names?.length" class="special-feature-meta">{{ d.artist_names.join(', ') }}</p>
          <div v-if="detailText(d).description" class="mwnf-sheet__block" v-html="md(detailText(d).description, glossary)"></div>
          <MediaGallery v-if="d.images?.length" :images="d.images.map((img) => ({ url: img.url, alt: img.captions?.[activeLang] ?? '' }))" variant="row" />
        </div>
      </SheetSection>

      <SheetSection v-if="relatedMedia.length" :heading="$t('record.related.video')">
        <div v-for="(m, i) in relatedMedia" :key="i" class="media-entry">
          <a :href="m.url" target="_blank" rel="noopener" class="media-title">{{ m.title }}</a>
          <p v-if="m.description" class="media-description">{{ m.description }}</p>
        </div>
      </SheetSection>

      <RecordCredits
        :credits="credits"
        :working-number="item.mwnf_reference ?? ''"
        :working-number-label="$t('sheet.field.workingNumber')"
        :citation="citationText"
      />

      <SheetSection v-if="onDisplayInLinks.length" :heading="$t('record.related.onDisplayIn')">
        <ul class="link-list">
          <li v-for="(l, i) in onDisplayInLinks" :key="i">
            <router-link :to="l.to"><span v-html="mdInline(l.label)"></span></router-link>
          </li>
        </ul>
      </SheetSection>

      <SheetSection v-if="thgGalleryLinks.length" :heading="$t('record.related.galleries')">
        <ul class="link-list">
          <li v-for="g in thgGalleryLinks" :key="g.name"><a :href="g.href">{{ g.name }}</a></li>
        </ul>
      </SheetSection>

      <RelatedRecords :heading="$t('record.related.items')" :records="relatedRows" variant="list" />
    </div>

    <GlossaryPopover :term="activeTerm" :html="activeTermHtml" :dir="contentDir" @close="closeGlossary" />
  </div>
</template>

<style scoped>
.detail-wrap { display: flex; flex-direction: column; gap: 10px; }

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

.detail-status { font-size: 12px; color: var(--muted); }

.detail :deep(.mwnf-media) { margin-bottom: 20px; }
.detail :deep(.mwnf-sheet) { margin-bottom: 20px; }

/* Short description: legacy's toggle, directly under the description. */
.short-description { margin-top: -8px; margin-bottom: 20px; }
.short-description-toggle {
  background: none;
  border: none;
  padding: 0;
  margin-bottom: 8px;
  font-size: 13px;
  font-style: italic;
  font-weight: 500;
  color: var(--link);
  text-decoration: underline;
  cursor: pointer;
  font-family: inherit;
}

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
