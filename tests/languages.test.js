import { describe, expect, it } from 'vitest'
import config from '../src/dataset.config.js'

describe('language strategy (items-driven, #7)', () => {
  it('offers exactly the languages items are translated into', () => {
    const itemFiles = import.meta.glob('@inventory-data/translations/items.*.json')
    const expected = Object.keys(itemFiles)
      .map((path) => path.match(/items\.([a-z]{2})\.json$/)?.[1])
      .filter(Boolean)
    expect(expected.length).toBeGreaterThan(0)
    expect([...config.languages].sort()).toEqual([...expected].sort())
    // The order is the switcher's, not the opening language's: the site used to
    // open at `languages[0]` and English was forced to the front for it.
    // viewer-core negotiates the opening language now, so nothing may depend on
    // that again.
    expect([...config.languages].sort()).toEqual(config.languages)
  })

  it('labels every offered language for the switcher', () => {
    const codes = config.navigation.languages.map((l) => l.code)
    expect(codes).toEqual(config.languages)
    for (const { code, label } of config.navigation.languages) {
      // A real display name from languages.json, not the bare code.
      expect(label).toBeTruthy()
      expect(label).not.toBe(code)
    }
  })
})
