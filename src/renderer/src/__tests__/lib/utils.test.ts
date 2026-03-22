import { describe, it, expect } from 'vitest'
import { cn } from '../../lib/utils'

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    const condition = false
    expect(cn('foo', condition && 'bar', 'baz')).toBe('foo baz')
  })

  it('should merge tailwind classes correctly', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  it('should handle undefined values', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar')
  })

  it('should handle null values', () => {
    expect(cn('foo', null, 'bar')).toBe('foo bar')
  })

  it('should handle empty strings', () => {
    expect(cn('', 'foo', '')).toBe('foo')
  })

  it('should handle arrays', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
  })

  it('should handle objects', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
  })

  it('should merge conflicting tailwind classes', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('should combine multiple types of inputs', () => {
    expect(cn('base', ['array'], { conditional: true, ignored: false }, null, undefined)).toBe(
      'base array conditional'
    )
  })
})
