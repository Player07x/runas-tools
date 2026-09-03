import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const backupSnapshots = sqliteTable("backup_snapshots", {
  id: text("id").primaryKey(),
  payload: text("payload").notNull(),
  updatedAt: integer("updated_at").notNull(),
})

export const knowledgeSnapshots = sqliteTable("knowledge_snapshots", {
  id: text("id").primaryKey(),
  payload: text("payload").notNull(),
  updatedAt: integer("updated_at").notNull(),
})
