import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const seoSettingsTable = pgTable("seo_settings", {
  id: serial("id").primaryKey(),
  siteTitle: text("site_title").default("Affiliate Offers").notNull(),
  siteTitleAr: text("site_title_ar"),
  siteDescription: text("site_description"),
  siteDescriptionAr: text("site_description_ar"),
  keywords: text("keywords"),
  robotsTxt: text("robots_txt").default("User-agent: *\nAllow: /\nSitemap: /sitemap.xml"),
  googleAnalyticsId: text("google_analytics_id"),
  googleSearchConsoleId: text("google_search_console_id"),
  ogImage: text("og_image"),
  allowIndexing: boolean("allow_indexing").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSeoSettingsSchema = createInsertSchema(seoSettingsTable).omit({ id: true });
export type InsertSeoSettings = z.infer<typeof insertSeoSettingsSchema>;
export type SeoSettings = typeof seoSettingsTable.$inferSelect;
