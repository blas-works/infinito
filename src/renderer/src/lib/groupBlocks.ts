import type { Block, DateGroup } from '@renderer/types'
import { DATE_REGEX } from './constants'

/**
 * Merges consecutive non-date blocks into single content blocks.
 * After consolidation, each date block is followed by at most one content block.
 */
export function consolidateBlocks(blocks: Block[]): Block[] {
  if (blocks.length === 0) return []

  const result: Block[] = []

  for (const block of blocks) {
    if (DATE_REGEX.test(block.content)) {
      result.push({ ...block })
    } else {
      const prev = result[result.length - 1]
      if (prev && !DATE_REGEX.test(prev.content)) {
        if (block.content.trim()) {
          prev.content = prev.content.trim() ? prev.content + '\n' + block.content : block.content
        }
      } else {
        result.push({ id: block.id, content: block.content })
      }
    }
  }

  return result
}

export function groupBlocksByDate(blocks: Block[]): DateGroup[] {
  const groups: DateGroup[] = []

  for (const block of blocks) {
    if (DATE_REGEX.test(block.content)) {
      groups.push({ dateBlock: block, contentBlock: null })
    } else {
      const lastGroup = groups[groups.length - 1]
      if (lastGroup && lastGroup.dateBlock && !lastGroup.contentBlock) {
        lastGroup.contentBlock = block
      } else if (!lastGroup || lastGroup.dateBlock) {
        groups.push({ dateBlock: null, contentBlock: block })
      }
    }
  }

  return groups
}
