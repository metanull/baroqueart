<script setup>
// PageShell with the legacy MWNF header lockup ("Museum With No Frontiers"
// over "Baroque Art") supplied through the header slot. All other PageShell
// props and the update:language event pass through untouched via $attrs.
import { PageShell } from '@metanull/viewer-layout'
</script>

<template>
  <PageShell v-bind="$attrs">
    <template #header>
      <a class="site-logo" href="#/">
        <span class="site-logo-org">Museum With No Frontiers</span>
        <span class="site-logo-title">Baroque Art</span>
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
