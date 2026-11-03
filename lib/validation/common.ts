import { z } from 'zod';

export const paginationSchema = z.object({
  pn: z.coerce.number().int().positive().optional(),
  ps: z.coerce.number().int().positive().max(100).optional(),
});
