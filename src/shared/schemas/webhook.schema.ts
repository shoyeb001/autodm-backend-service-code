import { z } from 'zod';

export const metaWebhookEntrySchema = z.object({
  id: z.string(),
  time: z.number(),
  changes: z.array(
    z.object({
      field: z.string(),
      value: z.record(z.unknown()),
    })
  ).optional(),
});

export const metaWebhookPayloadSchema = z.object({
  object: z.string(),
  entry: z.array(metaWebhookEntrySchema),
});

export type MetaWebhookPayload = z.infer<typeof metaWebhookPayloadSchema>;
