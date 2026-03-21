import type { Block, BlockData } from '@renderer/types'

export const blockService = {
  getAll: (): Promise<BlockData[]> => window.api.getBlocks(),

  saveAll: (blocks: Block[]): Promise<void> =>
    window.api.saveBlocks(blocks.map(({ id, content }) => ({ id, content })))
}
