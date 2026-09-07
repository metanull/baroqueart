import { renderInline } from '@metanull/viewer-core'
import { useInventoryData } from './useInventoryData.js'

// The two `EssayView` specs this site declares: an exhibition's theme (its
// pages, each a quote + prose narrative over a thumbnail-driven item panel)
// and its introduction (the exhibition's own text plus the items attached
// to the exhibition itself, not to any theme/page — an "about" page, no
// panel or navigation). Both are built against a tree already scoped to one
// exhibition (`composables/exhibitions.js`'s `exhibitionTree`), never the
// whole-site one, so `route()` below can read the exhibition id off the
// tree itself rather than being handed it separately.

const { partnerLabel } = useInventoryData()

// The importer synthesizes a placeholder title ("Theme 5", "Page 17") when
// the legacy source has no page_title/theme_title for a given language;
// `EssayView` treats a title matching this as missing and falls back to the
// English one itself.
export const THEME_PLACEHOLDER_TITLE = /^(Theme|Page) \d+$/

function itemEntry(node, itemId) {
  return node?.items?.find((entry) => entry.id === itemId) ?? null
}

function localCaption(entry, language) {
  return entry?.caption?.[language] ?? entry?.caption?.en ?? {}
}

// The three unlabeled meta lines legacy showed beside an item's picture —
// date, location, holding museum — read the same way on both the
// exhibition's introduction grid and a theme page's item panel: a caption
// override first, the item's own generic translation/relations otherwise.
// This dataset carries no dynasties, unlike islamicart's — the fourth line
// legacy showed there has nothing to read here.
function itemMetaValues(item, node, ctx) {
  const caption = localCaption(itemEntry(node, item.id), ctx.language)
  const own = ctx.tr('items', item.id)
  return [
    caption.date ?? own.dates,
    caption.location ?? own.location,
    caption.museum ?? (item.partner_id ? partnerLabel(item.partner_id) : ''),
  ].filter(Boolean)
}

function itemMetaFields(item, node, ctx) {
  return itemMetaValues(item, node, ctx).map((value) => ({ label: '', value }))
}

// A "detail" close-up's own caption carries its own date/location/museum,
// read only from the variant's caption itself — unlike the item's main
// view, a detail never falls back to the item's generic translation.
function detailMetaFields(caption) {
  return [caption.date, caption.location, caption.museum]
    .filter(Boolean)
    .map((value) => ({ label: '', value }))
}

// A node's own route, for the breadcrumb (`spec.breadcrumb: true` below)
// and for `navigation: 'tree'`'s previous/next, both of which can hand this
// any depth: the exhibition itself (`parents.length === 0`, the breadcrumb's
// own first crumb), a theme (`=== 1` — reached only by crossing a branch
// boundary in the tree, since a theme carries no text or items of its own
// to route to directly; this lands on its first page instead, same as a
// visitor arriving from the splash list), or a page (`=== 2`, its own
// address, plus `?tab` unless it is the theme's first page).
export function themeRoute(tree) {
  return (node) => {
    const exhibitionId = tree.root.value?.id
    const parents = tree.parents(node.id)
    if (parents.length === 0) {
      return { name: 'exhibition', params: { exhibitionId } }
    }
    if (parents.length === 1) {
      return { name: 'exhibition-theme', params: { exhibitionId, themeId: node.id }, query: {} }
    }
    const themeNode = parents[1]
    const siblings = tree.children(themeNode.id)
    const tab = siblings.findIndex((sibling) => sibling.id === node.id)
    return { name: 'exhibition-theme', params: { exhibitionId, themeId: themeNode.id }, query: tab > 0 ? { tab } : {} }
  }
}

export function exhibitionThemeSpec(tree) {
  return {
    tree,
    entity: 'items',
    route: themeRoute(tree),
    placeholder: THEME_PLACEHOLDER_TITLE,
    quote: 'quote',
    body: 'description',
    items: {
      of: (node) => (node.items ?? []).map((entry) => entry.id),
      caption: (item, node, ctx) => {
        const caption = localCaption(itemEntry(node, item.id), ctx.language)
        const override = {}
        if (caption.name) override.name = renderInline(String(caption.name))
        return override
      },
      route: (item) => ({ name: 'item', params: { id: item.id } }),
    },
    panel: {
      // Each "detail" close-up carries its own image *and* caption (title,
      // justification, fields) — legacy's variant selector swapped all of
      // them together, not just the picture. `fields` falls back to the
      // fields below when a variant carries none of its own (the item's
      // own main view, `EssayView`'s auto-injected primary variant).
      variants: (item, ctx) => {
        const entry = itemEntry(ctx.node, item.id)
        return (entry?.details ?? []).map((variant) => {
          const caption = localCaption(variant, ctx.language)
          const title = caption.detail_name ?? caption.name ?? ''
          return {
            image: variant.image_url,
            alt: renderInline(String(title)),
            caption: {
              title: title ? renderInline(String(title)) : '',
              justification: caption.justification ?? '',
              fields: detailMetaFields(caption),
            },
          }
        })
      },
      fields: (item, node, ctx) => itemMetaFields(item, node, ctx),
    },
    navigation: 'tree',
    breadcrumb: true,
    // Legacy showed no strip: the page title as heading, previous/next walking
    // the pages, and the pages of a theme carry the theme's title, so a strip
    // would repeat one label.
    tabs: false,
    numbering: false,
  }
}

export function exhibitionIntroductionSpec(tree) {
  return {
    tree,
    entity: 'items',
    route: themeRoute(tree),
    // The introduction's own heading and prose are `extra.intro_header` /
    // `extra.intro_text` — a second, distinct pair of fields on the same
    // exhibition record the splash reads `title`/`description` from,
    // reached through the dotted path `body` now accepts.
    heading: (ctx) => renderInline(String(ctx.text.extra?.intro_header ?? ctx.t('exhibition.nav.introduction'))),
    quote: false,
    body: 'extra.intro_text',
    about: () => true,
    items: {
      of: (node) =>
        [...(node.items ?? [])]
          .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999))
          .map((entry) => entry.id),
      caption: (item, node, ctx) => {
        const caption = localCaption(itemEntry(node, item.id), ctx.language)
        const override = {}
        if (caption.name) override.name = renderInline(String(caption.name))
        return override
      },
      meta: (item, ctx) => itemMetaValues(item, ctx.node, ctx),
      route: (item) => ({ name: 'item', params: { id: item.id } }),
    },
    panel: false,
  }
}
