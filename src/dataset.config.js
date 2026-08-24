import { useDataPackage } from '@metanull/viewer-core'
import { PageShell } from '@metanull/viewer-layout'
import languagesData from '@inventory-data/languages.json'

const { entityNames } = useDataPackage()

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

  features: {
    // Entities that get a list page (/#/<entity>) and detail pages
    // (/#/<entity>/<id>). Defaults to every entity of the data package;
    // replace with an explicit list to publish only some of them:
    // entities: ['item', 'exhibition'],
    entities: entityNames,
  },

  // vue-i18n locale doubles as the content language; 'en' first so it is the
  // initial locale.
  languages,

  // The page structure rendered around the active view. Remove these two
  // keys for a bare, shell-less site.
  shell: PageShell,
  navigation: {
    // Props for PageShell — see @metanull/viewer-layout for the full list
    // (headerSubtitle, bannerImage, hyperlinks, sponsors, …).
    headerTitle: 'Discover Baroque Art',
    navLinks: [
      { label: 'Home', href: '#/' },
      ...entityNames.map((entity) => ({ label: entity, href: `#/${entity}` })),
    ],
    languages: languages.map((code) => ({ code, label: languageLabel(code) })),
    footerText: '© Museum With No Frontiers (MWNF) 2004 – 2026',
  },

  // Website-specific extra pages (components under src/views/):
  // extraViews: [{ path: '/about', name: 'about', component: AboutView }],
}
