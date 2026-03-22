import { asc } from 'drizzle-orm'
import { getDb } from '../client'
import { blocks, type Block } from '../schema'

export const blockRepository = {
  findAll(): Block[] {
    return getDb().select().from(blocks).orderBy(asc(blocks.position)).all()
  },

  saveAll(items: { id: string; content: string }[]): void {
    const db = getDb()

    db.transaction(() => {
      db.delete(blocks).run()
      for (let i = 0; i < items.length; i++) {
        db.insert(blocks).values({ id: items[i].id, content: items[i].content, position: i }).run()
      }
    })
  }
}
