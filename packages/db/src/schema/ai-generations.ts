import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * AI-generated banner history. Admin calls provider SDKs client-side (BYOK)
 * and only posts metadata + R2 keys here — worker never holds provider keys.
 */
export const aiGenerations = sqliteTable('ai_generations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  /** 'openai' | 'google' — the SDK used. */
  provider: text('provider').notNull(),
  /** Exact model name, e.g. 'gpt-image-1.5' / 'gemini-3-pro-image-preview'. */
  model: text('model').notNull(),
  /** Full prompt sent to the provider. */
  prompt: text('prompt').notNull(),
  /** R2 key of the raw model output (pre-crop). */
  originalKey: text('original_key').notNull(),
  /** R2 key of the user-cropped version, when the user cropped before saving. */
  croppedKey: text('cropped_key'),
  /** Final delivered pixel dimensions (cropped if present, else original). */
  width: integer('width'),
  height: integer('height'),
  productId: text('product_id'),
  adId: text('ad_id'),
  ownerId: text('owner_id'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
