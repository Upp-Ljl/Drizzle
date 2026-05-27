/**
 * Shared Zod schemas — input validation for API routes.
 *
 * Each schema is hand-written, named after the endpoint it guards.
 * Stable shape so tspr's backend_test_plan can enumerate.
 */

import { z } from 'zod';

export const BetInput = z.object({
  amount: z.number().int().min(1).max(100),
});

export const NominateInput = z.object({
  signalId: z.number().int().positive(),
});

export const FlowerInput = z.object({
  graveyardId: z.number().int().positive(),
});

export const EpitaphInput = z.object({
  graveyardId: z.number().int().positive(),
  text: z.string().min(1).max(100),
});

export const PosterInput = z.object({
  weekId: z.number().int().positive(),
});

export const PaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const AccelerateInput = z.object({
  weekId: z.number().int().positive().optional(),
});

export type BetInputT = z.infer<typeof BetInput>;
export type NominateInputT = z.infer<typeof NominateInput>;
export type FlowerInputT = z.infer<typeof FlowerInput>;
export type PaginationQueryT = z.infer<typeof PaginationQuery>;
