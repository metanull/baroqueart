<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { CatalogueResultsView } from '@metanull/viewer-layout/views'
import { useInventoryData } from '../composables/useInventoryData.js'
import { searchResults, useSearchFieldLabels } from '../composables/search.js'

// The database results: the query in the URL, read the same way
// `SearchFormView` writes it (`q`/`field`, `q2..4`/`field2..4`/`op2..4`,
// `from`, `to`, `lang`); the eight fields and the AND/OR fold of
// database.php, run by viewer-core's field grammar (decision D3: ranked by
// hit count, with the glossary and country expansions) over this website's
// field map (`composables/search.js`). What is this page's own is the
// refine row (a fourth keyword the entrance never offers) and the
// search-language watch — a second `useListQuery` inside the spec would
// fight the one `CatalogueResultsView` already keeps, so this reads the
// route directly instead.

const route = useRoute()
const { loadTranslations } = useInventoryData()
watch(() => route.query.lang, (lang) => { if (lang) loadTranslations('items', lang) }, { immediate: true })

// Resolved once here (`t` on a literal name each), not per iteration in the
// template below — a template that called `$t(f.label)` on a value out of
// an array would be a name the check that every name resolves cannot see.
const fieldOptions = useSearchFieldLabels()
</script>

<template>
  <div>
    <h1 class="mwnf-heading">{{ $t('baroqueart.nav.database') }} — {{ $t('catalogue.results.heading') }}</h1>

    <div class="mwnf-panel">
      <CatalogueResultsView :spec="searchResults">
        <template #actions>
          <RouterLink :to="{ name: 'database' }" class="mwnf-button mwnf-button--secondary small">{{ $t('catalogue.search.newSearch') }}</RouterLink>
        </template>

        <template #filters="{ filters }">
          <div class="refine-row">
            <span class="refine-label">{{ $t('catalogue.search.refine') }}</span>
            <select v-model="filters.op4" class="mwnf-select cond">
              <option value="AND">{{ $t('catalogue.search.and') }}</option>
              <option value="OR">{{ $t('catalogue.search.or') }}</option>
            </select>
            <select v-model="filters.field4" class="mwnf-select field">
              <option v-for="f in fieldOptions" :key="f.key" :value="f.key">{{ f.label }}</option>
            </select>
            <input v-model="filters.q4" type="text" class="keyword" :placeholder="$t('catalogue.search.keywordPlaceholder')" />
          </div>
        </template>

        <template #empty>
          {{ $t('catalogue.results.noResultsSearch') }}
          <RouterLink :to="{ name: 'database' }">{{ $t('catalogue.search.tryNewSearch') }}</RouterLink>
        </template>
      </CatalogueResultsView>
    </div>
  </div>
</template>

<style scoped>
.mwnf-button.small { font-size: 12px; padding: 4px 12px; text-decoration: none; }
.refine-row { display: flex; align-items: center; gap: 8px; }
.refine-label { font-size: 12px; color: var(--muted); }
.cond { width: 60px; }
.field { width: 200px; }
.keyword { width: 200px; }
</style>
