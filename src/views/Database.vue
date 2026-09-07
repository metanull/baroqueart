<script setup>
import { I18nText } from '@metanull/viewer-core'
import { SearchFormView } from '@metanull/viewer-layout/views'
import { searchEntrance } from '../composables/search.js'

// The search entrance: legacy database.php's three-row keyword form, kept
// in its shape (decision D2) but drawn by the platform's own `SearchFormView`
// — the rows, the AND/OR fold, the century presets and the search-language
// select are all `SearchFormView`'s; the field list and the target route are
// this website's, in `composables/search.js`.
</script>

<template>
  <div>
    <h1 class="section-heading">{{ $t('baroqueart.nav.database') }}</h1>

    <div class="content-box">
      <SearchFormView :spec="searchEntrance">
        <template #intro>
          <I18nText tag="p" class="intro-text" keypath="catalogue.search.intro" />
        </template>
      </SearchFormView>
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
</style>
