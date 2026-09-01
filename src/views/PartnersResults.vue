<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@metanull/viewer-core'
import { useInventoryData } from '../composables/useInventoryData.js'

const route = useRoute()
const { partners, countryLabel, partnerLabel } = useInventoryData()
const { t } = useI18n()

const filterType = computed(() => (route.query.type === 'institution' ? 'institution' : 'museum'))
const otherType = computed(() => (filterType.value === 'museum' ? 'institution' : 'museum'))

// Both branches spell their name out. A single name built from the type
// (`islamicart.partner.` + type) would resolve at run time and be invisible to
// the check that every name a page asks for exists.
const typeHeading = computed(() =>
  filterType.value === 'museum'
    ? t('baroqueart.partner.museums')
    : t('baroqueart.partner.institutions')
)
const associatedLabel = computed(() =>
  filterType.value === 'museum'
    ? t('baroqueart.partner.associatedMuseums')
    : t('baroqueart.partner.associatedInstitutions')
)
const noneFoundLabel = computed(() =>
  filterType.value === 'museum'
    ? t('baroqueart.partner.noMuseums')
    : t('baroqueart.partner.noInstitutions')
)
const otherTypeLabel = computed(() =>
  otherType.value === 'museum'
    ? t('baroqueart.partner.viewMuseums')
    : t('baroqueart.partner.viewInstitutions')
)

// Associated tiers are nested under the main "Partners" list per country,
// mirroring the legacy pm_partner_list.php accordion (level is only present
// once the exporter's partner-hierarchy join has been re-published; a
// partner without a level is treated as a main partner).
const groupedByCountry = computed(() => {
  const byType = partners.value.filter(p => p.type === filterType.value)

  const countries = new Map()
  for (const p of byType) {
    const key = p.country_id ?? ''
    if (!countries.has(key)) countries.set(key, { main: [], associated: [] })
    const bucket = countries.get(key)
    if (p.level === 'associated_partner' || p.level === 'minor_contributor') {
      bucket.associated.push(p)
    } else {
      bucket.main.push(p)
    }
  }

  return [...countries.entries()]
    .map(([countryId, group]) => ({
      countryId,
      name: countryId ? countryLabel(countryId) : t('baroqueart.results.otherCountry'),
      main: group.main.sort((a, b) => partnerLabel(a.id).localeCompare(partnerLabel(b.id))),
      associated: group.associated.sort((a, b) => partnerLabel(a.id).localeCompare(partnerLabel(b.id))),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

const totalCount = computed(() =>
  groupedByCountry.value.reduce((sum, g) => sum + g.main.length + g.associated.length, 0)
)

function partnerLink(partner) {
  return { path: `/partner/${encodeURIComponent(partner.id)}` }
}
</script>

<template>
  <div>
    <RouterLink to="/partners" class="back-link">‹ {{ $t('baroqueart.partner.backLink') }}</RouterLink>

    <h1 class="section-heading">
      {{ typeHeading }}
      <span class="heading-project"> — {{ $t('baroqueart.project.discover') }}</span>
    </h1>

    <div class="content-box">
      <p class="result-count">
        {{ $t('baroqueart.results.partnersFound') }}: {{ totalCount }} —
        <RouterLink :to="{ path: '/partners/results', query: { type: otherType } }">
          {{ otherTypeLabel }}
        </RouterLink>
      </p>

      <div v-if="groupedByCountry.length" class="country-accordion">
        <details v-for="group in groupedByCountry" :key="group.countryId" class="country-group" open>
          <summary class="country-head">
            <h3>{{ group.name }}</h3>
          </summary>

          <div class="country-body">
            <div class="partner-col">
              <p v-for="p in group.main" :key="p.id">
                <RouterLink :to="partnerLink(p)">{{ partnerLabel(p.id) }}</RouterLink>
              </p>
            </div>

            <div v-if="group.associated.length" class="partner-col associated-col">
              <p class="associated-label">{{ associatedLabel }}</p>
              <p v-for="p in group.associated" :key="p.id">
                <RouterLink :to="partnerLink(p)">{{ partnerLabel(p.id) }}</RouterLink>
              </p>
            </div>
          </div>
        </details>
      </div>

      <p v-else class="no-results">{{ noneFoundLabel }}</p>
    </div>
  </div>
</template>

<style scoped>
.heading-project { font-weight: normal; font-size: 14px; color: var(--muted); }

.result-count {
  font-family: 'Roboto', sans-serif;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.no-results { color: var(--muted); font-family: 'Roboto', sans-serif; font-size: 13px; padding: 20px 0; }

.country-group {
  border-bottom: 1px solid var(--border-light);
  padding: 10px 0;
}
.country-group:last-child { border-bottom: none; }

.country-head {
  cursor: pointer;
  list-style: none;
}
.country-head::-webkit-details-marker { display: none; }
.country-head h3 {
  display: inline-block;
  font-size: 15px;
  font-weight: 500;
  color: var(--heading);
  font-family: 'Roboto', sans-serif;
}
.country-head h3::before {
  content: '▸ ';
  color: var(--accent);
}
details[open] > .country-head h3::before { content: '▾ '; }

.country-body {
  display: flex;
  gap: 32px;
  padding: 8px 0 4px 16px;
  flex-wrap: wrap;
}
.partner-col { flex: 1; min-width: 220px; }
.partner-col p {
  font-size: 13px;
  font-family: 'Roboto', sans-serif;
  padding: 3px 0;
}
.associated-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  font-weight: bold;
  margin-bottom: 4px;
}
</style>
