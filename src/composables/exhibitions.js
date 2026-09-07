import { useCollectionTree } from '@metanull/viewer-core'
import { useInventoryData } from './useInventoryData.js'

// The Exhibitions tree — exhibitions-root → exhibition → theme → page — was
// three hand-written parent_id walks (exhibitions, exhibitionThemes,
// exhibitionThemeById) plus a hand-written reverse "collections containing
// this item" scan (exhibitionLinksForItem); useCollectionTree is that walk,
// written once, in viewer-core.

const { tr } = useInventoryData()

// The whole tree: the entrance (its exhibitions) and the splash (an
// exhibition's themes) both read across every exhibition, so they share one
// instance rather than each walking `collections.json` again.
export const exhibitionsTree = useCollectionTree({ purpose: 'exhibitions-root', entity: 'collections' })

// `EssayView` reads `spec.tree` once, at setup — a component that keeps its
// identity across an `:exhibitionId` route-param change would keep the
// first exhibition's tree forever. The introduction/theme routes key their
// `EssayView` on `exhibitionId` (forcing a remount there) and call this for
// a tree scoped to *that* exhibition, rather than reading `exhibitionsTree`
// above: scoping to the exhibition (`rootId`, not the global `purpose`) is
// what keeps previous/next inside that exhibition's own boundary (decision
// D2) instead of walking into the next one.
export function exhibitionTree(exhibitionId) {
  return useCollectionTree({ rootId: exhibitionId, entity: 'collections' })
}

// The reverse lookup ItemDetail.vue renders as "on display in": every
// exhibition — and, within it, the theme — an item is attached to, whether
// directly to the exhibition itself (an introduction item, one hop below
// the root) or to one of a theme's pages (three hops below the root). An
// item attached straight to a theme, skipping its pages, matched nothing in
// the hand-written scan this replaces either, so it is left out here too.
export function exhibitionLinksForItem(itemId) {
  const seen = new Set()
  const links = []
  for (const node of exhibitionsTree.containing(itemId)) {
    const parents = exhibitionsTree.parents(node.id)
    const exhibition = parents.length === 1 ? node : parents.length === 3 ? parents[1] : null
    if (!exhibition) continue
    const themeId = parents.length === 3 ? node.parent_id : null
    const key = `${exhibition.id}:${themeId ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    links.push({ exhibitionId: exhibition.id, themeId, label: tr('collections', exhibition.id).title ?? exhibition.internal_name })
  }
  return links
}
