import { useInventoryData } from './useInventoryData.js'

// The partner pages: what viewer-layout's `PartnerListView` renders on
// `/partners/results` (one spec per type, the site's own museum/institution
// axis) and what its `RecordView` sibling renders on `/partner/:id`. The
// grouping, the accordion, the sheet engine are the platform's; what is
// declared here is only this website's: which axis a list is scoped to, the
// contact block and the logo strip (structured data legacy showed as its
// own sections, folded into Markdown so the sheet's block renderer can carry
// them), and the partner's own image shape (`alt_text`, not the item
// package's per-language `captions`).

const { countryLabel, items, itemLabel, mdInline, mdStrip, tr } = useInventoryData()

function normalizeUrl(url) {
  return url.startsWith('http') ? url : `http://${url}`
}

// The contact block: the partner's own address/phone/email/website, its
// extra links, and its one or two contact persons — legacy's four separate
// `<p>` groups, folded into one Markdown block (`breaks: true` turns each
// line into its own line) so the sheet's block section can carry it without
// a bespoke render path for what is, structurally, still just text.
function contactBlock(ctx) {
  const { record, t, text } = ctx
  const main = []
  if (text.address) main.push(`**${t('partner.info.addresses')}:** ${text.address}`)
  if (text.phone) main.push(`**${t('partner.info.phone')}:** ${text.phone}`)
  if (text.email) main.push(`[${text.email}](mailto:${text.email})`)
  if (text.website) main.push(`[${text.website}](${normalizeUrl(text.website)})`)
  for (const url of record.additional_urls ?? []) main.push(`[${url.title ?? url.url}](${normalizeUrl(url.url)})`)

  const blocks = main.length ? [main.join('\n')] : []
  for (const person of [record.contact_person_1, record.contact_person_2]) {
    if (!person || !(person.name || person.title)) continue
    const lines = [[person.title, person.name].filter(Boolean).join(' — ')]
    if (person.phone) lines.push(`${t('partner.info.phone')}: ${person.phone}`)
    if (person.fax) lines.push(`${t('partner.info.fax')}: ${person.fax}`)
    if (person.email) lines.push(`[${person.email}](mailto:${person.email})`)
    blocks.push(lines.join('\n'))
  }
  return blocks.join('\n\n')
}

// The logo strip: Markdown images, one a line, so the sheet's block renderer
// draws them the same way it draws any other embedded picture.
function logoBlock(ctx) {
  return (ctx.record.logos ?? []).map((logo) => `![](${logo.url})`).join('\n\n')
}

/**
 * `/partners/results`: one spec per type (`'museum'` / `'institution'`),
 * the site's own axis — `PartnersEntrance.vue` still picks it, unchanged.
 * `nested: true` carries an associated partner under its own main partner
 * (`partnerHierarchy`) rather than the flat "Associated Partners" column, for
 * the third that has one.
 */
export function partnerList(type) {
  return {
    entity: 'partners',
    scope: (partner) => partner.type === type,
    group: { tier: 'level' },
    nested: true,
    route: 'partner',
    count: true,
    label: (countryId, ctx) => (countryId ? countryLabel(countryId) : ctx.t('baroqueart.results.otherCountry')),
    empty: type === 'museum' ? 'baroqueart.partner.noMuseums' : 'baroqueart.partner.noInstitutions',
  }
}

/** `/partner/:id`: description, contact and logo as sections; the location as a fact. */
export const partnerSheet = {
  entity: 'partners',
  fields: [
    {
      key: 'location',
      label: 'sheet.field.location',
      value: (ctx) => [ctx.text.city, ctx.record.country_id ? countryLabel(ctx.record.country_id) : ''].filter(Boolean).join(', '),
    },
  ],
  sections: [
    { key: 'description', label: 'partner.info.about', value: 'description' },
    { key: 'contact', label: 'partner.info.contact', value: contactBlock },
    { key: 'logo', label: 'partner.info.logo', value: logoBlock },
  ],
  shortDescription: false,
  // Partner images carry `alt_text` directly; the item package's per-language
  // `captions` map, which `RecordView`'s default `media()` reads, is not this
  // entity's shape.
  media: (record) =>
    (record.images ?? []).map((image) => ({
      url: image.url,
      alt: image.alt_text ?? '',
      caption: image.alt_text ?? '',
      photographer: image.photographer ?? '',
      copyright: image.copyright ?? '',
    })),
  // No author/translator credits and no citation permalink for a partner
  // profile — legacy never carried either for this page.
  citation: false,
  // The held items are a reverse lookup (`item.partner_id`, not a relation
  // the partner record carries), which the platform's own `related` cannot
  // express; `PartnerDetail.vue`'s `#related` slot builds it instead.
  related: false,
}

/** The items a partner holds — the reverse lookup `related: false` leaves to the view. */
export function heldItems(partner) {
  if (!partner) return []
  return items.value.filter((item) => item.partner_id === partner.id)
}

export function heldItemRow(item) {
  const text = tr('items', item.id)
  const name = text.name ?? item.internal_name ?? item.id
  return {
    id: item.id,
    image: item.images?.[0]?.url ?? '',
    imageAlt: itemLabel(item),
    name: mdInline(name),
    meta: [countryLabel(item.country_id), text.dates].filter(Boolean),
    badge: item.type,
    to: { name: 'item', params: { id: item.id } },
  }
}

/** The map's own label: the partner's translated name, plain (no Markdown). */
export function mapLabel(partner, text) {
  return mdStrip(text.name ?? partner.id)
}
