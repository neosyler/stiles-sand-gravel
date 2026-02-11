import { z } from 'zod';

export const quoteRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  phone: z.string().min(1, 'Phone is required').max(40),
  email: z.string().email().max(160).optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(120).optional().or(z.literal('')),
  materialNeeded: z.string().max(120).optional().or(z.literal('')),
  quantityYards: z.string().max(40).optional().or(z.literal('')),
  preferredDeliveryDate: z.string().max(40).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  website: z.string().max(200).optional().or(z.literal('')),
  turnstileToken: z.string().max(4000).optional().or(z.literal('')),
});

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
