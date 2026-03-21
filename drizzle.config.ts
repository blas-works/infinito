import { defineConfig } from 'drizzle-kit'
import { join } from 'path'

export default defineConfig({
  schema: './src/database/schema/index.ts',
  out: './src/database/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: join(process.cwd(), 'infinito.db')
  }
})
