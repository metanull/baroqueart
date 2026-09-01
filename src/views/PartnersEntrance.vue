<script setup>
import { useRouter } from 'vue-router'
import { I18nText } from '@metanull/viewer-core'

const router = useRouter()

function browse(type) {
  router.push({ path: '/partners/results', query: { type } })
}
</script>

<template>
  <div>
    <h1 class="section-heading">{{ $t('baroqueart.nav.partners') }}</h1>

    <div class="content-box">
      <I18nText tag="p" class="intro-text" keypath="baroqueart.partner.introDiscover" />

      <table class="form-table filter-table">
        <tbody>
          <tr>
            <th><label>{{ $t('baroqueart.partner.museums') }}</label></th>
            <td>
              <button class="btn" @click="browse('museum')">{{ $t('baroqueart.action.browseMuseums') }} →</button>
            </td>
          </tr>
          <tr>
            <th><label>{{ $t('baroqueart.partner.others') }}</label></th>
            <td>
              <button class="btn" @click="browse('institution')">{{ $t('baroqueart.action.browseInstitutions') }} →</button>
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
  padding: 10px 16px 10px 0;
  font-family: 'Roboto', sans-serif;
  font-size: 13px;
  color: var(--text);
  vertical-align: middle;
  width: auto;
}
</style>
