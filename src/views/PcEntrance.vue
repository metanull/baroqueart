<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { I18nText } from '@metanull/viewer-core'
import { useInventoryData } from '../composables/useInventoryData.js'

const router = useRouter()
const {
  items, countries, partners,
  countryLabel, partnerLabel,
} = useInventoryData()

const filterType = ref('country') // country | partner | begin | end

// Build option lists from items actually present
const availableCountries = computed(() => {
  const ids = new Set(items.value.map(i => i.country_id).filter(Boolean))
  return countries.value
    .filter(c => ids.has(c.id))
    .map(c => ({ id: c.id, name: countryLabel(c.id) }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

const availablePartners = computed(() => {
  const ids = new Set(items.value.map(i => i.partner_id).filter(Boolean))
  return partners.value
    .filter(p => ids.has(p.id))
    .map(p => ({ id: p.id, name: partnerLabel(p.id) }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

const selectedCountry = ref('')
const selectedPartner = ref('')
const beginDate = ref('')
const endDate = ref('')

function search() {
  const q = {}
  if (filterType.value === 'country' && selectedCountry.value)   q.country = selectedCountry.value
  if (filterType.value === 'partner' && selectedPartner.value)   q.partner = selectedPartner.value
  if (filterType.value === 'begin'   && beginDate.value)         q.begin   = beginDate.value
  if (filterType.value === 'end'     && endDate.value)           q.end     = endDate.value
  router.push({ path: '/permanent-collection/results', query: q })
}
</script>

<template>
  <div>
    <h1 class="section-heading">{{ $t('baroqueart.nav.permanentCollection') }}</h1>

    <div class="content-box">
      <I18nText tag="p" class="intro-text" keypath="baroqueart.pc.intro" />

      <table class="form-table filter-table">
        <tbody>
          <!-- Filter type selector. `value` is the filter this row drives and
               never a text; each label is written out so the check that every
               name resolves can read it. -->
          <tr v-for="opt in [
            { value: 'country', label: $t('baroqueart.filter.country') },
            { value: 'partner', label: $t('baroqueart.filter.holdingInstitution') },
            { value: 'begin',   label: $t('baroqueart.filter.startDate') },
            { value: 'end',     label: $t('baroqueart.filter.endDate') },
          ]" :key="opt.value">
            <th>
              <label :for="'filter-' + opt.value">
                <input
                  type="radio"
                  :id="'filter-' + opt.value"
                  name="filterType"
                  :value="opt.value"
                  v-model="filterType"
                />
                {{ opt.label }}
              </label>
            </th>
            <td>
              <!-- Country -->
              <template v-if="opt.value === 'country'">
                <select v-model="selectedCountry" :disabled="filterType !== 'country'" style="width:280px">
                  <option value="">{{ $t('baroqueart.filter.selectCountry') }}</option>
                  <option v-for="c in availableCountries" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </template>

              <!-- Partner -->
              <template v-else-if="opt.value === 'partner'">
                <select v-model="selectedPartner" :disabled="filterType !== 'partner'" style="width:280px">
                  <option value="">{{ $t('baroqueart.filter.selectInstitution') }}</option>
                  <option v-for="p in availablePartners" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
              </template>

              <!-- Begin date -->
              <template v-else-if="opt.value === 'begin'">
                <input
                  type="number"
                  v-model="beginDate"
                  :disabled="filterType !== 'begin'"
                  :placeholder="$t('baroqueart.filter.fromYearHint')"
                  style="width:120px"
                />
              </template>

              <!-- End date -->
              <template v-else-if="opt.value === 'end'">
                <input
                  type="number"
                  v-model="endDate"
                  :disabled="filterType !== 'end'"
                  :placeholder="$t('baroqueart.filter.endDateHint')"
                  style="width:120px"
                />
              </template>
            </td>
          </tr>

          <!-- Submit -->
          <tr>
            <th></th>
            <td style="padding-top:12px">
              <button class="btn" @click="search">{{ $t('baroqueart.action.browse') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.intro-text {
  font-size: 13px;
  line-height: 1.65;
  color: var(--muted);
  margin-bottom: 16px;
  font-family: 'Roboto', sans-serif;
}

.filter-table th {
  text-align: left;
  font-weight: normal;
  padding: 6px 16px 6px 0;
  font-family: 'Roboto', sans-serif;
  font-size: 13px;
  color: var(--text);
  vertical-align: middle;
  width: auto;
}
.filter-table th label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}
.filter-table input[type="radio"] { cursor: pointer; }

select:disabled, input:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
