<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { I18nText, useFacets } from '@metanull/viewer-core'
import { FacetSelect } from '@metanull/viewer-layout/content'
import { useInventoryData } from '../composables/useInventoryData.js'
import { FACETS } from '../composables/catalogue.js'

// The Permanent Collection entrance: one filter at a time, chosen by a
// radio, as legacy's form was (decision D2). The options are the values the
// records carry, by the catalogue spec; the page only writes the query the
// results page reads.

const router = useRouter()
const { items } = useInventoryData()
const options = useFacets(items, FACETS)

const filterType = ref('country') // country | partner | begin | end
const selected = ref({ country: '', partner: '', begin: '', end: '' })

function search() {
  const q = {}
  const value = selected.value[filterType.value]
  if (value) q[filterType.value] = String(value)
  router.push({ name: 'permanent-collection-results', query: q })
}
</script>

<template>
  <div>
    <h1 class="section-heading">{{ $t('baroqueart.nav.permanentCollection') }}</h1>

    <div class="content-box">
      <I18nText tag="p" class="intro-text" keypath="baroqueart.pc.intro" />

      <form class="filter-form" @submit.prevent="search">
        <!-- `value` is the filter this row drives and never a text; each label is
             written out so the check that every name resolves can read it. -->
        <div
          v-for="opt in [
            { value: 'country', label: $t('catalogue.facet.country') },
            { value: 'partner', label: $t('catalogue.facet.holdingInstitution') },
            { value: 'begin', label: $t('catalogue.facet.startDate') },
            { value: 'end', label: $t('catalogue.facet.endDate') },
          ]"
          :key="opt.value"
          class="filter-row"
        >
          <label class="filter-choice" :for="`filter-${opt.value}`">
            <input :id="`filter-${opt.value}`" v-model="filterType" type="radio" name="filterType" :value="opt.value" />
            {{ opt.label }}
          </label>
          <div class="filter-control">
            <FacetSelect
              v-if="options[opt.value]"
              v-model="selected[opt.value]"
              :options="options[opt.value]"
              :placeholder="opt.value === 'country' ? $t('catalogue.facet.selectCountry') : $t('catalogue.facet.selectInstitution')"
              :disabled="filterType !== opt.value"
            />
            <input
              v-else
              v-model="selected[opt.value]"
              type="number"
              :disabled="filterType !== opt.value"
              :placeholder="opt.value === 'begin' ? $t('baroqueart.filter.fromYearHint') : $t('baroqueart.filter.endDateHint')"
            />
          </div>
        </div>

        <div class="filter-row actions">
          <span class="filter-choice"></span>
          <button type="submit" class="btn">{{ $t('core.action.browse') }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.intro-text {
  font-size: 13px;
  line-height: 1.65;
  color: var(--muted);
  margin-bottom: 16px;
}
.filter-form { display: flex; flex-direction: column; gap: 8px; }
.filter-row { display: flex; align-items: center; gap: 16px; }
.filter-choice {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 200px;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
}
.filter-control :deep(.mwnf-facet__select) { width: 280px; }
.filter-control input[type='number'] { width: 120px; }
.filter-control :deep(select:disabled),
.filter-control input:disabled { opacity: 0.4; cursor: not-allowed; }
.actions { padding-top: 6px; }
</style>
