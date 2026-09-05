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

export default {
  // The dataset package this website renders. Must match the alias in
  // vite.config.js and the dependency in package.json.
  datasetPackage: '@metanull/baroqueart-data',

  siteName: manifest.site?.names?.en ?? 'Baroque Art',

  // All pages are website-specific views (below) — no generic entity pages.
  features: {
    entities: [],
  },

  languages,

  shell: SiteShell,

  // Only what is not a text. The menu labels and the footer line are texts, so
  // they are built in SiteShell.vue where the catalogue is installed; the
  // language names below come from the data package, not from a translator.
  navigation: {
    languages: languageLabels(languages),
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
      meta: { entities: ['items'] },
    },
    {
      path: '/permanent-collection',
      name: 'permanent-collection',
      component: () => import('./views/PcEntrance.vue'),
      meta: { entities: ['items', 'countries', 'partners'] },
    },
    {
      path: '/permanent-collection/results',
      name: 'permanent-collection-results',
      component: () => import('./views/PcList.vue'),
      meta: { entities: ['items', 'countries', 'partners'] },
    },
    {
      path: '/database',
      name: 'database',
      component: () => import('./views/Database.vue'),
      meta: { entities: [] },
    },
    {
      path: '/database/results',
      name: 'database-results',
      component: () => import('./views/DatabaseResults.vue'),
      meta: { entities: ['items', 'countries', 'partners'] },
    },
    {
      path: '/timeline',
      name: 'timeline',
      component: () => import('./views/TimelineEntrance.vue'),
      meta: { entities: ['timelines', 'timeline_events', 'countries'] },
    },
    {
      path: '/timeline/results',
      name: 'timeline-results',
      component: () => import('./views/TimelineResults.vue'),
      meta: { entities: ['timelines', 'timeline_events', 'countries'] },
    },
    {
      path: '/partners',
      name: 'partners',
      component: () => import('./views/PartnersEntrance.vue'),
      meta: { entities: ['items', 'partners', 'countries'] },
    },
    {
      path: '/partners/results',
      name: 'partners-results',
      component: () => import('./views/PartnersResults.vue'),
      meta: { entities: ['partners', 'countries'] },
    },
    {
      path: '/partner/:id',
      name: 'partner',
      component: () => import('./views/PartnerDetail.vue'),
      meta: { entities: ['partners', 'items', 'countries'] },
    },
    {
      path: '/exhibitions',
      name: 'exhibitions',
      component: () => import('./views/ExhibitionsEntrance.vue'),
      meta: { entities: ['collections'] },
    },
    {
      path: '/exhibitions/:exhibitionId',
      name: 'exhibition',
      component: () => import('./views/ExhibitionSplash.vue'),
      meta: { entities: ['collections'] },
    },
    {
      path: '/exhibitions/:exhibitionId/introduction',
      name: 'exhibition-introduction',
      component: () => import('./views/ExhibitionIntroduction.vue'),
      meta: { entities: ['collections', 'items', 'partners'] },
    },
    {
      path: '/exhibitions/:exhibitionId/theme/:themeId',
      name: 'exhibition-theme',
      component: () => import('./views/ExhibitionTheme.vue'),
      meta: { entities: ['collections', 'items', 'partners'] },
    },
    {
      path: '/item/:id',
      name: 'item',
      component: () => import('./views/ItemDetail.vue'),
      meta: { entities: ['items', 'collections', 'partners', 'countries', 'glossary'] },
    },
  ],

  // This website has never been published under any other URL shape: its
  // routes are the canonical ones, so there is nothing to redirect from.
  legacyRoutes: [],
}
