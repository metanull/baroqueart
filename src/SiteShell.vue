<script setup>
// PageShell with the legacy MWNF header lockup ("Museum With No Frontiers"
// over "Baroque Art") supplied through the header slot. All other PageShell
// props and the update:language event pass through untouched via $attrs.
import { computed } from 'vue'
import { useI18n } from '@metanull/viewer-core'
import { PageShell } from '@metanull/viewer-layout'

const { t } = useI18n()

// The menu is built here rather than in dataset.config.js because a label is a
// text and a text is only available inside the application: `t` needs the
// installed catalogue, and every name has to be written out where it is used
// so `viewer-i18n-check` can see it. The config keeps what is not a text —
// the offered languages — and PageShell receives these links after $attrs, so
// they take precedence over anything the config still passes.
// The legacy site's own top-level sections, in its own order — this site has no
// Dynasties or Artistic Introduction.
const navLinks = computed(() => [
  { label: t('core.nav.home'), href: '#/' },
  { label: t('baroqueart.nav.permanentCollection'), href: '#/permanent-collection' },
  { label: t('baroqueart.nav.database'), href: '#/database' },
  { label: t('baroqueart.nav.timeline'), href: '#/timeline' },
  { label: t('baroqueart.nav.partners'), href: '#/partners' },
  { label: t('baroqueart.nav.exhibitions'), href: '#/exhibitions' },
])
</script>

<template>
  <PageShell
    v-bind="$attrs"
    :nav-links="navLinks"
    :footer-text="$t('baroqueart.identity.copyright')"
  >
    <template #header>
      <a class="site-logo" href="#/">
        <span class="site-logo-org">{{ $t('baroqueart.identity.organisation') }}</span>
        <span class="site-logo-title">{{ $t('baroqueart.identity.title') }}</span>
      </a>
    </template>
    <slot />
  </PageShell>
</template>

<style scoped>
.site-logo {
  display: flex;
  flex-direction: column;
  gap: 1px;
  color: var(--header-fg);
  text-decoration: none !important;
}
.site-logo-org {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 400;
  opacity: 0.8;
}
.site-logo-title {
  font-size: 28px;
  font-weight: 400;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.site-logo:hover {
  color: var(--header-fg);
}
</style>
