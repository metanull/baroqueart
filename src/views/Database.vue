<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { I18nText, useI18n } from '@metanull/viewer-core'
import { useInventoryData } from '../composables/useInventoryData.js'
import { useSearchFields } from '../composables/catalogue.js'

// The search entrance: legacy database.php's form, kept in its shape
// (decision D2). It writes the query the results page reads; nothing is
// searched here.

const router = useRouter()
const { availableLanguages } = useInventoryData()
const { t } = useI18n()
const fieldOptions = useSearchFields()

// The languages the item translations actually carry, for the form's
// "search language" — a record-level filter, not the site language.
const searchLanguages = computed(() => availableLanguages('items').slice().sort())

// Legacy's fixed century-boundary date dropdowns (database.php:88-124).
// "From" runs 501-2001 (16 values), "to" runs 600-2000 (15 values) — not symmetric.
const DATE_FROM_OPTIONS = Array.from({ length: 16 }, (_, i) => 501 + i * 100)
const DATE_TO_OPTIONS = Array.from({ length: 15 }, (_, i) => 600 + i * 100)

const rows = ref([
  { keyword: '', field: 'keyword', cond: 'AND' },
  { keyword: '', field: 'keyword', cond: 'AND' },
  { keyword: '', field: 'keyword', cond: 'AND' },
])
const rowLabels = computed(() => [t('baroqueart.search.keywordOne'), t('baroqueart.search.keywordTwo'), t('baroqueart.search.keywordThree')])
const dateFrom = ref('')
const dateTo = ref('')
const searchLanguage = ref('')

function search() {
  const q = {}
  rows.value.forEach((row, i) => {
    if (!row.keyword) return
    const n = i + 1
    q[`keyword${n}`] = row.keyword
    q[`field${n}`] = row.field
    if (n > 1) q[`cond${n}`] = row.cond
  })
  // Date range and search language are applied once, globally, to the whole
  // query — unlike the fields, which are genuinely per-row.
  if (dateFrom.value) q.date_from = String(dateFrom.value)
  if (dateTo.value) q.date_to = String(dateTo.value)
  if (searchLanguage.value) q.lang = searchLanguage.value
  router.push({ name: 'database-results', query: q })
}

function showAll() {
  router.push({ name: 'database-results', query: {} })
}
</script>

<template>
  <div>
    <h1 class="section-heading">{{ $t('baroqueart.nav.database') }}</h1>

    <div class="content-box">
      <I18nText tag="p" class="intro-text" keypath="baroqueart.search.intro" />

      <form class="db-form" @submit.prevent="search">
        <table>
          <tbody>
            <tr v-for="(row, i) in rows" :key="i">
              <th>{{ rowLabels[i] }}</th>
              <td>
                <select v-if="i > 0" v-model="row.cond" class="cond">
                  <option value="AND">{{ $t('catalogue.search.and') }}</option>
                  <option value="OR">{{ $t('catalogue.search.or') }}</option>
                </select>
                <select v-model="row.field" class="field">
                  <option v-for="f in fieldOptions" :key="f.value" :value="f.value">{{ f.label }}</option>
                </select>
                <input v-model="row.keyword" type="text" class="keyword" :placeholder="$t('catalogue.search.keywordPlaceholder')" />
              </td>
            </tr>

            <tr><td colspan="2"><hr class="form-divider" /></td></tr>

            <tr>
              <th>{{ $t('catalogue.facet.dateFrom') }}</th>
              <td>
                <select v-model="dateFrom" class="year">
                  <option value="">—</option>
                  <option v-for="y in DATE_FROM_OPTIONS" :key="y" :value="y">{{ y }}</option>
                </select>
              </td>
            </tr>
            <tr>
              <th>{{ $t('catalogue.facet.dateTo') }}</th>
              <td>
                <select v-model="dateTo" class="year">
                  <option value="">—</option>
                  <option v-for="y in DATE_TO_OPTIONS" :key="y" :value="y">{{ y }}</option>
                </select>
              </td>
            </tr>

            <tr>
              <th>{{ $t('catalogue.search.language') }}</th>
              <td>
                <select v-model="searchLanguage" class="year">
                  <option value="">{{ $t('catalogue.search.anyLanguage') }}</option>
                  <option v-for="lang in searchLanguages" :key="lang" :value="lang">{{ lang.toUpperCase() }}</option>
                </select>
              </td>
            </tr>

            <tr>
              <th></th>
              <td class="actions">
                <button type="submit" class="btn">{{ $t('core.action.search') }}</button>
                <button type="button" class="btn btn-secondary" @click="showAll">{{ $t('catalogue.search.showAll') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  </div>
</template>

<style scoped>
.intro-text {
  font-size: 14px;
  line-height: 1.65;
  color: var(--text);
  margin-bottom: 16px;
}
.db-form table { width: 100%; border-collapse: collapse; }
.db-form th {
  text-align: right;
  padding: 6px 14px 6px 0;
  font-size: 13px;
  color: var(--muted);
  font-weight: 500;
  white-space: nowrap;
  width: 130px;
  vertical-align: middle;
}
.db-form td { padding: 6px 0; vertical-align: middle; }
.db-form td > * + * { margin-left: 8px; }
.cond { width: 60px; }
.field { width: 200px; }
.keyword { width: 220px; }
.year { width: 120px; }
.actions { padding-top: 14px; }
.form-divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 8px 0;
}
</style>
