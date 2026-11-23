import { z } from 'zod';

export const createAutomationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  instagramAccountId: z.string().uuid('Invalid Instagram Account ID'),
  trigger: z.object({
    keyword: z.string().min(1, 'Keyword is required'),
    matchType: z.enum(['EXACT', 'CONTAINS']).default('CONTAINS'),
  }),
  action: z.object({
    message: z.string().min(1, 'Message is required'),
  }),
});

export type CreateAutomationInput = z.infer<typeof createAutomationSchema>;
