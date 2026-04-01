import { pgTable, text, serial, timestamp, integer, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sharesTable = pgTable("shares", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title"),
  content: text("content"),
  fileName: text("file_name"),
  fileSize: bigint("file_size", { mode: "number" }),
  mimeType: text("mime_type"),
  filePath: text("file_path"),
  downloadCount: integer("download_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export const insertShareSchema = createInsertSchema(sharesTable).omit({ downloadCount: true, createdAt: true });
export type InsertShare = z.infer<typeof insertShareSchema>;
export type Share = typeof sharesTable.$inferSelect;
