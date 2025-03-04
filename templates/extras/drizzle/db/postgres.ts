import { index, pgTable, serial, text } from "drizzle-orm/pg-core";

export const posts = pgTable(
  "post",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    post: text("post").notNull(),
  },
  (example) => ({
    titleIndex: index("title_idx").on(example.title),
  })
);
