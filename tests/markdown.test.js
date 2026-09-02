import { describe, expect, it } from 'vitest'
import { useInventoryData } from '../src/composables/useInventoryData.js'

const { md, mdInline, mdStrip } = useInventoryData()

// A data package holds Markdown, and the importer is what converts the legacy
// HTML on the way in. These three are the only places a record's text becomes
// HTML on this site, so this is where that stays true: a tag that slipped past
// the importer must appear on the page as the characters it is, never as
// markup. When one shows up, the fix belongs in the importer.

describe('rendering a record field', () => {
  it('renders Markdown', () => {
    expect(md('A **bold** claim.')).toContain('<strong>bold</strong>')
    expect(mdInline('A **bold** claim.')).toBe('A <strong>bold</strong> claim.')
  })

  it('keeps a line break, which a record types on purpose', () => {
    expect(md(['One', 'Two'].join(String.fromCharCode(10)))).toContain('<br>')
  })

  it('escapes HTML instead of rendering it', () => {
    expect(md('An <i>italic</i> title.')).toContain('&lt;i&gt;')
    expect(md('An <i>italic</i> title.')).not.toContain('<i>')
    expect(mdInline('An <i>italic</i> title.')).not.toContain('<i>')
    expect(md('<script>alert(1)</script>')).not.toContain('<script>')
  })

  it('drops markup entirely where the text has to be plain', () => {
    expect(mdStrip('An *italic* title.')).toBe('An italic title.')
    expect(mdStrip('An <i>italic</i> title.')).not.toContain('<i>')
  })
})
