import { languageLabels, offeredLanguages, useDataPackage } from '@metanull/viewer-core'
import SiteShell from './SiteShell.vue'

// The whole declaration of this website. Before it mounts, the website reads
// nothing from its package but the manifest: the languages it offers, their
// labels and its name come from `manifest.site`, and every record is loaded
// by the route that reads it.

const { manifest } = useDataPackage()

// The languages the package declares for this site, kept where the item
// translations actually carry them. An item sheet may offer more — whatever
// languages the record itself carries — from its own switcher, without
// touching the site language.
const languages = offeredLanguages()

// A route says which section it belongs to (kebab-case, one per top-level
// menu entry); the shell reads it through viewer-core's `useSection()` to
// mark the active menu entry, rather than deriving it from the path.
const meta = (section, entities = []) => ({ section, entities })

export default {
  // The dataset package this website renders. Must match the alias in
  // vite.config.js and the dependency in package.json.
  datasetPackage: '@metanull/baroqueart-data',

  siteName: manifest.site?.names?.en ?? 'Baroque Art',

  // The deployed origin, read by `sourceUrl()` for the citation permalink and
  // the source credit's link. GitHub Pages serves this repo at
  // metanull.github.io/<repo>, the same base path the build's BASE_PATH sets
  // in vite.config.js — this changes if the site ever moves to its own domain.
  site: { origin: 'https://metanull.github.io/baroqueart' },

  // All pages are website-specific views (below) — no generic entity pages.
  features: {
    entities: [],
  },

  languages,

  shell: SiteShell,

  // The legacy site's own top-level sections, in its own order — this site
  // has no Dynasties or Artistic Introduction. `label` is an entry name,
  // resolved by SiteShell through `t()`; `section` is matched against
  // `useSection()` (itself read off a route's `meta.section`) to mark the
  // active menu entry, never derived from the path.
  navigation: {
    languages: languageLabels(languages),
    links: [
      { section: 'home', label: 'core.nav.home', to: { name: 'home' } },
      { section: 'permanent-collection', label: 'baroqueart.nav.permanentCollection', to: { name: 'permanent-collection' } },
      { section: 'database', label: 'baroqueart.nav.database', to: { name: 'database' } },
      { section: 'timeline', label: 'baroqueart.nav.timeline', to: { name: 'timeline' } },
      { section: 'partners', label: 'baroqueart.nav.partners', to: { name: 'partners' } },
      { section: 'exhibitions', label: 'baroqueart.nav.exhibitions', to: { name: 'exhibitions' } },
    ],
  },

  // The route map: every route named, kebab-case sections, the package id in
  // the path, and the page and every filter in the query. Each route declares
  // the entities its view reads, so the router loads them before the view is
  // created and no page renders against records that are not there yet.
  //
  // The 'home' name replaces viewer-core's generic home route.
  extraViews: [
    {
      path: '/',
      name: 'home',
      component: () => import('./views/Home.vue'),
      meta: meta('home', ['items']),
    },
    {
      path: '/permanent-collection',
      name: 'permanent-collection',
      component: () => import('./views/PcEntrance.vue'),
      meta: meta('permanent-collection', ['items', 'countries', 'partners']),
    },
    {
      path: '/permanent-collection/results',
      name: 'permanent-collection-results',
      component: () => import('./views/PcList.vue'),
      meta: meta('permanent-collection', ['items', 'countries', 'partners']),
    },
    {
      path: '/database',
      name: 'database',
      component: () => import('./views/Database.vue'),
      meta: meta('database'),
    },
    {
      path: '/database/results',
      name: 'database-results',
      component: () => import('./views/DatabaseResults.vue'),
      meta: meta('database', ['items', 'countries', 'partners']),
    },
    {
      path: '/timeline',
      name: 'timeline',
      component: () => import('./views/TimelineEntrance.vue'),
      meta: meta('timeline', ['timelines', 'timeline_events', 'countries']),
    },
    {
      path: '/timeline/results',
      name: 'timeline-results',
      component: () => import('./views/TimelineResults.vue'),
      // 'items' is read only to decide whether the gallery cross-link
      // appears (decision D1) — the results themselves are events.
      meta: meta('timeline', ['timelines', 'timeline_events', 'countries', 'items']),
    },
    {
      path: '/timeline/gallery',
      name: 'timeline-gallery',
      component: () => import('./views/TimelineGallery.vue'),
      // Same three entities the Permanent Collection results route reads:
      // this page renders the same row, scoped rather than re-described.
      meta: meta('timeline', ['items', 'countries', 'partners']),
    },
    {
      path: '/partners',
      name: 'partners',
      component: () => import('./views/PartnersEntrance.vue'),
      meta: meta('partners', ['items', 'partners', 'countries']),
    },
    {
      path: '/partners/results',
      name: 'partners-results',
      component: () => import('./views/PartnersResults.vue'),
      meta: meta('partners', ['partners', 'countries']),
    },
    {
      path: '/partner/:id',
      name: 'partner',
      component: () => import('./views/PartnerDetail.vue'),
      props: (route) => ({ id: decodeURIComponent(route.params.id) }),
      meta: meta('partners', ['partners', 'items', 'countries']),
    },
    {
      path: '/exhibitions',
      name: 'exhibitions',
      component: () => import('./views/ExhibitionsEntrance.vue'),
      meta: meta('exhibitions', ['collections']),
    },
    {
      path: '/exhibitions/:exhibitionId',
      name: 'exhibition',
      component: () => import('./views/ExhibitionSplash.vue'),
      meta: meta('exhibitions', ['collections']),
    },
    {
      path: '/exhibitions/:exhibitionId/introduction',
      name: 'exhibition-introduction',
      component: () => import('./views/ExhibitionIntroduction.vue'),
      meta: meta('exhibitions', ['collections', 'items', 'partners']),
    },
    {
      path: '/exhibitions/:exhibitionId/theme/:themeId',
      name: 'exhibition-theme',
      component: () => import('./views/ExhibitionTheme.vue'),
      meta: meta('exhibitions', ['collections', 'items', 'partners']),
    },
    {
      path: '/item/:id',
      name: 'item',
      component: () => import('./views/ItemDetail.vue'),
      props: (route) => ({ id: decodeURIComponent(route.params.id) }),
      // No single nav entry owns this page — it opens from the Permanent
      // Collection, the Database search and Exhibitions alike — but its own
      // full-text lookup is the Database entry, so that is the section it
      // carries (matching carpets' item route, itself under 'database').
      meta: meta('database', ['items', 'collections', 'partners', 'countries', 'glossary']),
    },
  ],

  // This website has never been published under any other URL shape: its
  // routes are the canonical ones, so there is nothing to redirect from.
  legacyRoutes: [],
}
