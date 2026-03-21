import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const blocks = sqliteTable('blocks', {
  id: text('id').primaryKey(),
  content: text('content').notNull().default(''),
  position: integer('position').notNull()
})

export type Block = typeof blocks.$inferSelect
export type NewBlock = typeof blocks.$inferInsert
