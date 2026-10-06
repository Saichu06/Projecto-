const { z } = require('zod');

// Helper to preprocess empty or whitespace-only strings to undefined
const emptyToUndefined = (val) => {
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'string' && val.trim() === '') return undefined;
  return val;
};

// Helper to preprocess and trim strings (or return null if empty)
const trimmedStringOrNull = (val) => {
  if (val === undefined || val === null) return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed === '' ? null : trimmed;
  }
  return val;
};

// UUID validation helper
const uuidSchema = z.string().uuid({ message: 'Invalid UUID format' });

// Safe ISO Date string or Date validation helper
const isoDateSchema = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Must be a valid ISO date or date string (e.g., YYYY-MM-DD)',
    })
    .optional()
    .nullable()
);

// Pagination validation schema
const paginationQuerySchema = z.object({
  page: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ invalid_type_error: 'Page must be an integer' })
      .int({ message: 'Page must be an integer' })
      .min(1, { message: 'Page must be at least 1' })
      .optional()
      .default(1)
  ),
  limit: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ invalid_type_error: 'Limit must be an integer' })
      .int({ message: 'Limit must be an integer' })
      .min(1, { message: 'Limit must be at least 1' })
      .max(100, { message: 'Limit cannot exceed 100' })
      .optional()
      .default(10)
  ),
});

// Common sort order schema
const sortOrderEnum = z.preprocess(
  emptyToUndefined,
  z.enum(['asc', 'desc'], {
    errorMap: () => ({ message: 'Sort order must be "asc" or "desc"' }),
  }).optional().default('desc')
);

module.exports = {
  emptyToUndefined,
  trimmedStringOrNull,
  uuidSchema,
  isoDateSchema,
  paginationQuerySchema,
  sortOrderEnum,
};
