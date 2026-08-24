import { useDataPackage } from '@metanull/viewer-core'
import { PageShell } from '@metanull/viewer-layout'

const { entityNames } = useDataPackage()

export default {
  // The dataset package this website renders. Must match the alias in
  // vite.config.js and the dependency in package.json.
  datasetPackage: '@metanull/__DATASET__-data',

  // Shown as the home page heading.
  siteName: '__DATASET__',

  features: {
    // Entities that get a list page (/#/<entity>) and detail pages
    // (/#/<entity>/<id>). Defaults to every entity of the data package;
    // replace with an explicit list to publish only some of them:
    // entities: ['item', 'exhibition'],
    entities: entityNames,
  },

  // The page structure rendered around the active view. Remove these two
  // keys for a bare, shell-less site.
  shell: PageShell,
  navigation: {
    // Props for PageShell — see @metanull/viewer-layout for the full list
    // (headerSubtitle, bannerImage, hyperlinks, sponsors, …).
    headerTitle: '__DATASET__',
    navLinks: [
      { label: 'Home', href: '#/' },
      ...entityNames.map((entity) => ({ label: entity, href: `#/${entity}` })),
    ],
    footerText: '',
  },

  // Website-specific extra pages (components under src/views/):
  // extraViews: [{ path: '/about', name: 'about', component: AboutView }],
}
