import languagesData from '@inventory-data/languages.json'
import SiteShell from './SiteShell.vue'

// Content languages — the "items-driven" rule (#7): the site offers exactly
// the languages the item records are translated into, derived from the
// items.<lang>.json files present in the installed data package. Item records
// are the bulk of the site (1800+ rows), so every offered language translates
// the material the site is mostly made of; languages that only cover side
// entities (e.g. French collections, Arabic partners) are not offered, because
// picking them would yield mostly-English pages — the legacy viewer's bug.
// Never derive this from manifest.languages: it declares 18 languages, most
// without any translation file at all. Entities not covered in the active
// language fall back per entity to English, then internal_name.
// The interface chrome (labels, navigation) is English-only by decision —
// locales/ carries only en.json and vue-i18n falls back to it.
// English first, the rest sorted.
const itemTranslationFiles = import.meta.glob('@inventory-data/translations/items.*.json')
const itemLangs = new Set(
  Object.keys(itemTranslationFiles)
    .map((path) => path.match(/items\.([a-z]{2})\.json$/)?.[1])
    .filter(Boolean),
)
const languages = [
  ...(itemLangs.has('en') ? ['en'] : []),
  ...[...itemLangs].filter((l) => l !== 'en').sort(),
]

// Native display name for the language switcher, from the data package's
// language table (falls back to the English name, then the raw code).
function languageLabel(code) {
  const row = languagesData.find((l) => l.code === code)
  return row?.names?.[code] ?? row?.names?.en ?? code.toUpperCase()
}

export default {
  // The dataset package this website renders. Must match the alias in
  // vite.config.js and the dependency in package.json.
  datasetPackage: '@metanull/baroqueart-data',

  // Shown as the home page heading.
  siteName: 'Baroque Art',

  // Every page is a website-specific view (below) reimplementing the legacy
  // site's own pages. The generic entity list/detail pages viewer-core can
  // auto-generate are switched off: they publish the data package's shape
  // rather than the site's, and the two disagree — an exhibition is a
  // Collection here, and the legacy site never had a "collections" index.
  features: {
    entities: [],
  },

  // vue-i18n locale doubles as the content language; 'en' first so it is the
  // initial locale.
  languages,

  // SiteShell wraps @metanull/viewer-layout's PageShell with the MWNF
  // header lockup; everything in `navigation` reaches PageShell untouched.
  shell: SiteShell,
  navigation: {
    // Props for PageShell — see @metanull/viewer-layout for the full list
    // (headerSubtitle, bannerImage, hyperlinks, sponsors, …).
    // The legacy site's own top-level sections, in its own order.
    navLinks: [
      { label: 'Home', href: '#/' },
      { label: 'Permanent Collection', href: '#/permanent-collection' },
      { label: 'Database', href: '#/database' },
      { label: 'Timeline', href: '#/timeline' },
      { label: 'Partners', href: '#/partners' },
      { label: 'Exhibitions', href: '#/exhibitions' },
    ],
    languages: languages.map((code) => ({ code, label: languageLabel(code) })),
    footerText: '© Museum With No Frontiers (MWNF) 2004 – 2026',
  },

  // The full legacy route map, one view per page. The 'home' name replaces
  // viewer-core's generic home route. Entrance/results are separate paths
  // rather than one page with a toggle, because legacy links into the results
  // form directly (a search is a shareable URL) and the entrance page carries
  // its own editorial introduction.
  extraViews: [
    { path: '/', name: 'home', component: () => import('./views/Home.vue') },
    { path: '/permanent-collection', component: () => import('./views/PcEntrance.vue') },
    { path: '/permanent-collection/results', component: () => import('./views/PcList.vue') },
    { path: '/database', component: () => import('./views/Database.vue') },
    { path: '/database/results', component: () => import('./views/DatabaseResults.vue') },
    { path: '/timeline', component: () => import('./views/TimelineEntrance.vue') },
    { path: '/timeline/results', component: () => import('./views/TimelineResults.vue') },
    { path: '/partners', component: () => import('./views/PartnersEntrance.vue') },
    { path: '/partners/results', component: () => import('./views/PartnersResults.vue') },
    { path: '/partner/:id', component: () => import('./views/PartnerDetail.vue') },
    { path: '/exhibitions', component: () => import('./views/ExhibitionsEntrance.vue') },
    { path: '/exhibitions/:exhibitionId', component: () => import('./views/ExhibitionSplash.vue') },
    {
      path: '/exhibitions/:exhibitionId/introduction',
      component: () => import('./views/ExhibitionIntroduction.vue'),
    },
    {
      path: '/exhibitions/:exhibitionId/theme/:themeId',
      component: () => import('./views/ExhibitionTheme.vue'),
    },
    { path: '/item/:id', component: () => import('./views/ItemDetail.vue') },
  ],
}
