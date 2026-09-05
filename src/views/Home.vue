<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { I18nText } from '@metanull/viewer-core'
import { useInventoryData } from '../composables/useInventoryData.js'

const router = useRouter()
const {
  itemLabel,
  items,
  mdInline,
  tr,
} = useInventoryData()

// Pick a random item that has an image, as the featured spotlight
const featured = computed(() => {
  const withImages = items.value.filter(i => i.images?.length > 0)
  if (!withImages.length) return items.value[0] ?? null
  const idx = Math.floor(Math.random() * withImages.length)
  return withImages[idx]
})

function goToItem(item) {
  router.push({ path: `/item/${encodeURIComponent(item.id)}` })
}
</script>

<template>
  <div class="home">
    <!-- Welcome banner -->
    <div class="home-banner content-box">
      <h1 class="home-title">{{ $t('baroqueart.home.title') }}</h1>
      <I18nText tag="p" class="home-intro" keypath="baroqueart.home.intro" />
    </div>

    <!-- Navigation cards -->
    <div class="home-cards">
      <div class="home-card content-box" @click="$router.push('/permanent-collection')">
        <h2 class="home-card-title">{{ $t('baroqueart.nav.permanentCollection') }}</h2>
        <I18nText tag="p" class="home-card-desc" keypath="baroqueart.home.permanentCollectionText" />
        <span class="home-card-link">{{ $t('baroqueart.action.browse') }} →</span>
      </div>

      <div class="home-card content-box" @click="$router.push('/database')">
        <h2 class="home-card-title">{{ $t('baroqueart.nav.database') }}</h2>
        <I18nText tag="p" class="home-card-desc" keypath="baroqueart.home.databaseText" />
        <span class="home-card-link">{{ $t('baroqueart.action.search') }} →</span>
      </div>

      <div class="home-card content-box" @click="$router.push('/timeline')">
        <h2 class="home-card-title">{{ $t('baroqueart.nav.timeline') }}</h2>
        <I18nText tag="p" class="home-card-desc" keypath="baroqueart.home.timelineText" />
        <span class="home-card-link">{{ $t('baroqueart.action.explore') }} →</span>
      </div>

      <div class="home-card content-box" @click="$router.push('/partners')">
        <h2 class="home-card-title">{{ $t('baroqueart.nav.partners') }}</h2>
        <I18nText tag="p" class="home-card-desc" keypath="baroqueart.home.partnersText" />
        <span class="home-card-link">{{ $t('baroqueart.action.browse') }} →</span>
      </div>

      <div class="home-card content-box" @click="$router.push('/exhibitions')">
        <h2 class="home-card-title">{{ $t('baroqueart.nav.exhibitions') }}</h2>
        <I18nText tag="p" class="home-card-desc" keypath="baroqueart.home.exhibitionsText" />
        <span class="home-card-link">{{ $t('baroqueart.action.explore') }} →</span>
      </div>
    </div>

    <!-- Featured item spotlight -->
    <div v-if="featured" class="home-featured content-box">
      <h2 class="section-heading">{{ $t('baroqueart.home.itemOnDisplay') }}</h2>
      <div class="featured-inner" @click="goToItem(featured)" :title="$t('baroqueart.home.clickForDetails')">
        <div v-if="featured.images?.length" class="featured-img-wrap">
          <img
            :src="featured.images[0].url"
            :alt="itemLabel(featured)"
            class="featured-img"
            loading="eager"
          />
        </div>
        <div class="featured-info">
          <p class="featured-type">{{ featured.type }}</p>
          <h3 class="featured-name" v-html="mdInline(tr('items', featured.id)?.name ?? featured.internal_name ?? featured.id)" />
          <p v-if="tr('items', featured.id)?.location" class="featured-meta">
            {{ tr('items', featured.id).location }}
          </p>
          <p v-if="tr('items', featured.id)?.dates" class="featured-meta">
            {{ tr('items', featured.id).dates }}
          </p>
          <span class="featured-link">{{ $t('baroqueart.action.viewDetails') }} →</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home { display: flex; flex-direction: column; gap: 16px; }

.home-banner { border-top: 3px solid var(--accent); }
.home-title {
  font-size: 20px;
  font-weight: 400;
  color: var(--heading);
  margin-bottom: 10px;
  font-family: 'Roboto', sans-serif;
}
.home-intro {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text);
  max-width: 680px;
  font-family: 'Roboto', sans-serif;
}

/* Cards */
.home-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
@media (max-width: 800px) { .home-cards { grid-template-columns: 1fr 1fr; } }
@media (max-width: 600px) { .home-cards { grid-template-columns: 1fr; } }

.home-card {
  cursor: pointer;
  border-top: 3px solid var(--accent);
  transition: box-shadow 0.15s;
}
.home-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.12); }
.home-card-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--heading);
  margin-bottom: 8px;
  font-family: 'Roboto', sans-serif;
}
.home-card-desc { font-size: 13px; line-height: 1.65; color: var(--muted); margin-bottom: 12px; font-family: 'Roboto', sans-serif; }
.home-card-link {
  font-size: 13px;
  font-family: 'Roboto', sans-serif;
  font-weight: 500;
  color: var(--nav-active);
}

/* Featured */
.home-featured { border-top: 3px solid var(--accent); }
.featured-inner {
  display: flex;
  gap: 20px;
  cursor: pointer;
  align-items: flex-start;
}
.featured-inner:hover .featured-name { color: var(--nav-active); }

.featured-img-wrap {
  flex-shrink: 0;
  width: 200px;
  border: 1px solid var(--border);
  overflow: hidden;
}
.featured-img { width: 100%; height: 160px; object-fit: cover; display: block; }

.featured-info { flex: 1; }
.featured-type {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
  font-family: 'Roboto', sans-serif;
  margin-bottom: 6px;
}
.featured-name {
  font-size: 18px;
  font-weight: 400;
  color: var(--heading);
  margin-bottom: 8px;
  line-height: 1.3;
  font-family: 'Roboto', sans-serif;
}
.featured-meta {
  font-size: 13px;
  color: var(--muted);
  font-family: 'Roboto', sans-serif;
  margin-bottom: 4px;
}
.featured-link {
  display: inline-block;
  margin-top: 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--nav-active);
  font-family: 'Roboto', sans-serif;
}
</style>
