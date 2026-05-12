import { pgTable, serial, text, real, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const offersTable = pgTable("offers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleAr: text("title_ar"),
  slug: text("slug").notNull().unique(),
  shortDescription: text("short_description"),
  shortDescriptionAr: text("short_description_ar"),
  longDescription: text("long_description"),
  longDescriptionAr: text("long_description_ar"),
  affiliateUrl: text("affiliate_url").notNull(),
  imageUrl: text("image_url").notNull(),
  ctaText: text("cta_text").default("Get Offer"),
  ctaTextAr: text("cta_text_ar"),
  rating: real("rating").default(4.5).notNull(),
  categoryId: integer("category_id"),
  seoTitle: text("seo_title"),
  seoTitleAr: text("seo_title_ar"),
  seoDescription: text("seo_description"),
  seoDescriptionAr: text("seo_description_ar"),
  keywords: text("keywords"),
  faqSchema: text("faq_schema"),
  isActive: boolean("is_active").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isTrending: boolean("is_trending").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  clickCount: integer("click_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertOfferSchema = createInsertSchema(offersTable).omit({ id: true, clickCount: true, createdAt: true, updatedAt: true });
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offersTable.$inferSelect;
