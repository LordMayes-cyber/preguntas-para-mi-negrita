import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";
export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(), manageHash: text("manage_hash").notNull(),
  sender: text("sender").notNull(), recipient: text("recipient").notNull(), title: text("title").notNull(),
  questions: text("questions").notNull(), letter: text("letter").notNull(), revision: text("revision").notNull(), createdAt: text("created_at").notNull(),
});
export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey(), roomId: text("room_id").notNull().references(() => rooms.id), attempt: integer("attempt").notNull(),
  answers: text("answers").notNull(), letter: text("letter").notNull(), sender: text("sender").notNull(), recipient: text("recipient").notNull(), createdAt: text("created_at").notNull(),
}, table => [uniqueIndex("room_attempt_unique").on(table.roomId, table.attempt), index("submission_room_idx").on(table.roomId)]);
