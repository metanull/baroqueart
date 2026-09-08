<script setup>
// A mount of the layout's SiteShell: the menu links, the active entry (off
// `meta.section` through viewer-core's `useSection()`) and the offered
// languages all come from `dataset.config.js`'s `navigation`, read inside
// SiteShell itself through `useSiteConfig()`. All that is left here is the
// header lockup ("Museum With No Frontiers" over "Baroque Art"), through the
// `#brand` slot — SiteShell renders it beside the computed nav links, unlike
// a full `#header` override. The footer line stays a prop rather than a
// config field: it is a text, and a text is only available inside the
// application, where `t()` runs against the installed catalogue.
import { SiteShell } from '@metanull/viewer-layout/components'
</script>

<template>
  <SiteShell v-bind="$attrs" :footer-text="$t('baroqueart.identity.copyright')">
    <template #brand>
      <a class="site-logo" href="#/">
        <span class="site-logo-org">{{ $t('baroqueart.identity.organisation') }}</span>
        <span class="site-logo-title">{{ $t('baroqueart.identity.title') }}</span>
      </a>
    </template>
    <slot />
  </SiteShell>
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
