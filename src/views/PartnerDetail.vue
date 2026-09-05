<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '@metanull/viewer-core'
import { useInventoryData } from '../composables/useInventoryData.js'

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()
const {
  availableLanguages,
  countryLabel,
  defaultLang,
  items,
  loadTranslations,
  md,
  mdInline,
  partners,
  tr,
} = useInventoryData()

const partner = computed(() => partners.value.find(p => p.id === decodeURIComponent(route.params.id)) ?? null)

// ── Content language (partner translations are loaded on demand, per-lang) ──
// Follows the global site locale; falls back to the dataset default when the
// locale has no partner translations.

const activeLang = computed(() => (availableLanguages('items').includes(locale.value) ? locale.value : defaultLang))
watch(activeLang, lang => loadTranslations('partners', lang), { immediate: true })

// The partner's own curatorial text, in the active content language. Kept
// clear of `t`, which is this website's interface texts, and of `tr`, which
// is the lookup rather than one record's fields.
//
// `tr` falls back to the English record when the active language has none,
// which this page needs: the offered languages come from the item
// translations, and the package's per-entity coverage does not line up with
// them — several of the languages a visitor can pick ship no partners file at
// all, which would otherwise leave the whole partner sheet empty.
const text = computed(() => tr('partners', partner.value?.id, activeLang.value))

// ── Related items (View Objects / View Monuments) ────────────────────────

const relatedItems = computed(() => {
  if (!partner.value) return []
  return items.value.filter(i => i.partner_id === partner.value.id)
})

const viewItemsLabel = computed(() =>
  partner.value?.type === 'institution'
    ? t('baroqueart.action.viewMonuments')
    : t('baroqueart.action.viewObjects')
)

function viewItemsLink() {
  return { path: '/permanent-collection/results', query: { partner: partner.value.id } }
}

// ── Contact ────────────────────────────────────────────────────────────

const hasContactInfo = computed(() =>
  !!(text.value.address || text.value.phone || text.value.email || text.value.website || partner.value?.additional_urls?.length)
)

function normalizeUrl(url) {
  return url.startsWith('http') ? url : `http://${url}`
}

const contactPersons = computed(() => {
  if (!partner.value) return []
  return [partner.value.contact_person_1, partner.value.contact_person_2].filter(
    cp => cp && (cp.name || cp.title)
  )
})

// ── Map (OpenStreetMap embed — no API key required) ───────────────────────

const mapEmbedUrl = computed(() => {
  if (partner.value?.type !== 'museum') return null
  const { latitude: lat, longitude: lon } = partner.value
  if (lat == null || lon == null) return null
  const delta = 0.01
  const bbox = [lon - delta, lat - delta, lon + delta, lat + delta].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`
})

function imageCredit(img) {
  const parts = []
  if (img.copyright) parts.push(`© ${img.copyright}`)
  if (img.photographer) parts.push(img.photographer)
  return parts.join(' — ')
}

function back() {
  if (window.history.length > 2) {
    router.back()
  } else {
    router.push('/partners')
  }
}
</script>

<template>
  <div v-if="!partner" class="content-box not-found">
    <p>{{ $t('baroqueart.notFound.partner') }}</p>
    <router-link to="/partners">← {{ $t('baroqueart.partner.returnLink') }}</router-link>
  </div>

  <div v-else class="detail-wrap">
    <a class="back-link" href="#" @click.prevent="back">← {{ $t('baroqueart.partner.backLink') }}</a>

    <div class="detail content-box">
      <div class="detail-type-badge">{{ partner.type }}</div>

      <h1 class="detail-title" v-html="mdInline(text.name ?? partner.id)" />
      <h2 v-if="text.city || partner.country_id" class="detail-subtitle">
        <template v-if="text.city">{{ text.city }}<template v-if="partner.country_id">, </template></template>
        <template v-if="partner.country_id">{{ countryLabel(partner.country_id) }}</template>
      </h2>

      <!-- View objects / monuments -->
      <div v-if="relatedItems.length" class="view-items-row">
        <RouterLink :to="viewItemsLink()" class="btn">{{ viewItemsLabel }} ({{ relatedItems.length }}) →</RouterLink>
        <a v-if="text.website" :href="normalizeUrl(text.website)" target="_blank" rel="noopener" class="homepage-link">
          {{ $t('baroqueart.action.visitWebsite') }} ↗
        </a>
      </div>

      <!-- Images -->
      <div v-if="partner.images?.length" class="images">
        <figure v-for="(img, i) in partner.images" :key="i">
          <img :src="img.url" :alt="img.alt_text ?? ''" loading="lazy" class="detail-img" />
          <figcaption v-if="img.alt_text || imageCredit(img)">
            <span v-if="img.alt_text">{{ img.alt_text }}</span>
            <span v-if="imageCredit(img)" class="photo-credit">{{ imageCredit(img) }}</span>
          </figcaption>
        </figure>
      </div>

      <!-- About -->
      <section v-if="text.description" class="content-section">
        <h2 class="content-section-heading">{{ $t('baroqueart.partner.about') }}</h2>
        <div v-html="md(text.description)" class="prose" />
      </section>

      <!-- Contact -->
      <section v-if="hasContactInfo || contactPersons.length" class="content-section">
        <h2 class="content-section-heading">{{ $t('baroqueart.partner.contact') }}</h2>

        <div v-if="hasContactInfo" class="contact-block">
          <p v-if="text.address" class="contact-address">{{ text.address }}</p>
          <p v-if="text.phone">{{ $t('baroqueart.partner.phone') }}: {{ text.phone }}</p>
          <p v-if="text.email"><a :href="`mailto:${text.email}`">{{ text.email }}</a></p>
          <p v-if="text.website">
            <a :href="normalizeUrl(text.website)" target="_blank" rel="noopener">{{ text.website }}</a>
            <template v-for="(u, i) in partner.additional_urls" :key="i">
              &nbsp;|&nbsp;<a :href="normalizeUrl(u.url)" target="_blank" rel="noopener">{{ u.title ?? u.url }}</a>
            </template>
          </p>
        </div>

        <div v-for="(cp, i) in contactPersons" :key="i" class="contact-block contact-person">
          <p v-if="cp.title" class="contact-person-title">{{ cp.title }}</p>
          <p v-if="cp.name">{{ cp.name }}</p>
          <p v-if="cp.phone">{{ $t('baroqueart.partner.phone') }}: {{ cp.phone }}</p>
          <p v-if="cp.fax">{{ $t('baroqueart.partner.fax') }}: {{ cp.fax }}</p>
          <p v-if="cp.email"><a :href="`mailto:${cp.email}`">{{ cp.email }}</a></p>
        </div>
      </section>

      <!-- Logos -->
      <section v-if="partner.logos?.length" class="content-section">
        <h2 class="content-section-heading">{{ $t('baroqueart.partner.logo') }}</h2>
        <div class="logos">
          <img v-for="(logo, i) in partner.logos" :key="i" :src="logo.url" :alt="logo.alt_text ?? ''" class="logo-img" />
        </div>
      </section>

      <!-- Map -->
      <section v-if="mapEmbedUrl" class="content-section">
        <h2 class="content-section-heading">{{ $t('baroqueart.partner.map') }}</h2>
        <iframe class="map-frame" :src="mapEmbedUrl" loading="lazy" :title="$t('baroqueart.partner.mapTitle')" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.not-found { color: var(--muted); font-family: 'Roboto', sans-serif; font-size: 13px; }

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
  font-family: 'Roboto', sans-serif;
}

.detail-title {
  font-size: 24px;
  font-weight: 400;
  color: var(--heading);
  margin-bottom: 4px;
  line-height: 1.3;
  font-family: 'Roboto', sans-serif;
}
.detail-subtitle {
  font-size: 14px;
  font-weight: 400;
  font-style: italic;
  color: var(--muted);
  margin-bottom: 16px;
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

/* Images */
.images {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.images figure { flex-shrink: 0; }
.detail-img {
  width: 180px;
  height: 140px;
  object-fit: cover;
  border: 1px solid var(--border);
  display: block;
}
.images figcaption {
  font-size: 11px;
  color: var(--muted);
  margin-top: 4px;
  width: 180px;
  font-family: 'Roboto', sans-serif;
}
.photo-credit { display: block; }

/* Content sections */
.content-section {
  margin-bottom: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}
.content-section-heading {
  font-size: 13px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--heading);
  margin-bottom: 10px;
  font-family: 'Roboto', sans-serif;
}

.prose { font-size: 14px; line-height: 1.7; color: var(--text); font-family: 'Roboto', sans-serif; }
.prose :deep(p) { margin: 0 0 .75em; }
.prose :deep(p:last-child) { margin-bottom: 0; }

.contact-block {
  font-size: 13px;
  line-height: 1.7;
  color: var(--text);
  font-family: 'Roboto', sans-serif;
  margin-bottom: 12px;
}
.contact-person {
  padding-left: 12px;
  border-left: 3px solid var(--accent);
}
.contact-person-title { font-weight: 500; color: var(--heading); }
.contact-address { white-space: pre-line; }

.logos { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
.logo-img { max-height: 80px; max-width: 200px; object-fit: contain; }

.map-frame {
  width: 100%;
  height: 380px;
  border: 1px solid var(--border);
}
</style>
