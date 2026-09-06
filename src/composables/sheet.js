// The item sheet, as a spec: what viewer-layout's `RecordView` renders on
// `/item/:id`. The mechanics — which language the record is read in, what is
// loaded for it, the glossary terms it reaches, how a field becomes a row,
// the credits, the citation, the related records — are the platform's. What
// is declared here is only what is this website's: the field specification
// (legacy `database_item.php`'s two orders, one for a monument and one for an
// object), the prose sections under it, and the project the citation names.
// Every label is an entry name, written out so the check that every name
// resolves can read it.

const monumentFacts = [
  { key: 'alsoKnownAs', label: 'sheet.field.alsoKnownAs', value: 'alternate_name' },
  { key: 'location', label: 'sheet.field.location', value: 'location' },
  { key: 'date', label: 'sheet.field.dateOfMonument', value: 'dates' },
  { key: 'architects', label: 'sheet.field.architects', value: 'architects' },
  { key: 'patrons', label: 'sheet.field.patrons', value: (c) => c.text.patrons ?? c.text.initial_owner },
]

const objectFacts = [
  { key: 'alsoKnownAs', label: 'sheet.field.alsoKnownAs', value: 'alternate_name' },
  { key: 'location', label: 'sheet.field.location', value: 'location' },
  { key: 'holder', label: 'sheet.field.holdingMuseum', value: 'holder' },
  { key: 'date', label: 'sheet.field.dateOfObject', value: 'dates' },
  { key: 'artists', label: 'sheet.field.artists', value: (c) => c.record.artist_names, join: ', ' },
  { key: 'scribe', label: 'sheet.field.scribe', value: 'scriber' },
  { key: 'inventoryNumber', label: 'sheet.field.inventoryNumber', value: (c) => c.record.owner_reference },
  { key: 'materials', label: 'sheet.field.materials', value: 'type' },
  { key: 'dimensions', label: 'sheet.field.dimensions', value: 'dimensions' },
  { key: 'provenance', label: 'sheet.field.provenance', value: 'provenance' },
  { key: 'workshop', label: 'sheet.field.workshop', value: 'workshop' },
  { key: 'binding', label: 'sheet.field.binding', value: 'binding_desc' },
  { key: 'currentOwner', label: 'sheet.field.currentOwner', value: 'owner' },
  { key: 'originalOwner', label: 'sheet.field.originalOwner', value: 'initial_owner' },
  { key: 'placeOfProduction', label: 'sheet.field.placeOfProduction', value: 'place_of_production' },
]

// The prose under the facts, in legacy's order and under its headings.
const monumentSections = [
  { key: 'history', label: 'sheet.field.history', value: 'history' },
  { key: 'description', label: 'sheet.field.description', value: 'description' },
  { key: 'datation', label: 'sheet.field.monumentDatationMethod', value: 'method_for_datation' },
  { key: 'provenanceMethod', label: 'sheet.field.provenanceMethod', value: 'method_for_provenance' },
  { key: 'bibliography', label: 'sheet.field.bibliography', value: 'bibliography' },
]

const objectSections = [
  { key: 'description', label: 'sheet.field.description', value: 'description' },
  { key: 'datation', label: 'sheet.field.datationMethod', value: 'method_for_datation' },
  { key: 'obtention', label: 'sheet.field.obtentionMethod', value: 'obtention' },
  { key: 'provenanceMethod', label: 'sheet.field.provenanceMethod', value: 'method_for_provenance' },
  { key: 'bibliography', label: 'sheet.field.bibliography', value: 'bibliography' },
  {
    key: 'catalogue',
    label: 'sheet.field.catalogue',
    value: (c) => (c.text.catalogue_holding_link ? `[${c.text.catalogue_holding_link}](${c.text.catalogue_holding_link})` : ''),
  },
]

const isMonument = (ctx) => ctx.record?.type === 'monument'

export const itemSheet = {
  entity: 'items',
  translations: ['glossary'],
  fields: (ctx) => (isMonument(ctx) ? monumentFacts : objectFacts),
  sections: (ctx) => (isMonument(ctx) ? monumentSections : objectSections),
  layout: 'table',
  // Legacy's collapsible short description (`pc_view_sdesc`), folded under
  // the description when the item also carries the shorter text.
  shortDescription: 'short_description',
  shortDescriptionAfter: 'description',
  citation: { project: 'BAR' },
  related: { variant: 'list', heading: 'record.related.items' },
  route: 'item',
}
