<script setup>
import { I18nText } from '@metanull/viewer-core'
import { SearchFormView } from '@metanull/viewer-layout/views'
import { pcEntrance } from '../composables/search.js'

// The Permanent Collection entrance: one filter at a time, chosen by a
// radio, as legacy's form was (decision D2) — now `SearchFormView`'s own
// `mode: 'radio'`. The options are the values the records carry (this
// website's `FACETS`, read through `composables/search.js`'s `pcEntrance`);
// the page only supplies the intro text and the heading.
</script>

<template>
  <div>
    <h1 class="section-heading">{{ $t('baroqueart.nav.permanentCollection') }}</h1>

    <div class="content-box">
      <SearchFormView :spec="pcEntrance">
        <template #intro>
          <I18nText tag="p" class="intro-text" keypath="baroqueart.pc.intro" />
        </template>
      </SearchFormView>
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
</style>
