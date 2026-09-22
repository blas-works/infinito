import { describe, it, expect } from 'vitest'
import { formatForClipboard } from '../../lib/clipboard'

describe('formatForClipboard', () => {
  it('should keep plain markdown unchanged', () => {
    const content = '- [ ] review L-A208\n**net amount** without VAT'

    expect(formatForClipboard(content)).toBe(content)
  })

  it('should replace embedded base64 images with a placeholder', () => {
    const content = 'before\n![image](data:image/png;base64,iVBORw0KGgo+/=)\nafter'

    expect(formatForClipboard(content)).toBe('before\n[image]\nafter')
  })

  it('should replace every embedded image', () => {
    const content = '![a](data:image/png;base64,AAAA) text ![b](data:image/jpeg;base64,BBBB)'

    expect(formatForClipboard(content)).toBe('[image] text [image]')
  })

  it('should keep images that point to external URLs', () => {
    const content = '![logo](https://example.com/logo.png)'

    expect(formatForClipboard(content)).toBe(content)
  })

  it('should trim surrounding whitespace', () => {
    expect(formatForClipboard('\n  note  \n')).toBe('note')
  })
})
