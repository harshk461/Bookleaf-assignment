import { z } from 'zod';
import { bookIdParamSchema } from './common.js';

export const bookIdParamsSchema = z.object({
  bookId: bookIdParamSchema,
});
