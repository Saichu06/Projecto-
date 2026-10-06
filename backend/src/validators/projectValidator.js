const { z } = require('zod');
const {
  emptyToUndefined,
  trimmedStringOrNull,
  isoDateSchema,
  sortOrderEnum,
} = require('./commonValidator');

const projectStatusEnum = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'], {
  errorMap: () => ({ message: 'Status must be NOT_STARTED, IN_PROGRESS, or COMPLETED' }),
});

const projectSortByEnum = z.enum(['name', 'createdAt', 'startDate', 'endDate', 'status'], {
  errorMap: () => ({ message: 'Sort by must be name, createdAt, startDate, endDate, or status' }),
});

const createProjectSchema = z
  .object({
    name: z
      .string({ required_error: 'Project name is required' })
      .trim()
      .min(1, { message: 'Project name cannot be empty' })
      .max(150, { message: 'Project name cannot exceed 150 characters' }),
    description: z.preprocess(
      trimmedStringOrNull,
      z.string().max(1000, { message: 'Description cannot exceed 1000 characters' }).nullable().optional()
    ),
    status: projectStatusEnum.optional().default('NOT_STARTED'),
    startDate: isoDateSchema,
    endDate: isoDateSchema,
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate).getTime() >= new Date(data.startDate).getTime();
      }
      return true;
    },
    {
      message: 'End date cannot be earlier than start date',
      path: ['endDate'],
    }
  );

const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { message: 'Project name cannot be empty' })
      .max(150, { message: 'Project name cannot exceed 150 characters' })
      .optional(),
    description: z.preprocess(
      trimmedStringOrNull,
      z.string().max(1000, { message: 'Description cannot exceed 1000 characters' }).nullable().optional()
    ),
    status: projectStatusEnum.optional(),
    startDate: isoDateSchema,
    endDate: isoDateSchema,
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate).getTime() >= new Date(data.startDate).getTime();
      }
      return true;
    },
    {
      message: 'End date cannot be earlier than start date',
      path: ['endDate'],
    }
  );

const projectQuerySchema = z.object({
  search: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  status: z.preprocess(emptyToUndefined, projectStatusEnum.optional()),
  page: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ invalid_type_error: 'Page must be a valid number' })
      .int({ message: 'Page must be an integer' })
      .min(1, { message: 'Page must be at least 1' })
      .optional()
      .default(1)
  ),
  limit: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ invalid_type_error: 'Limit must be a valid number' })
      .int({ message: 'Limit must be an integer' })
      .min(1, { message: 'Limit must be at least 1' })
      .max(100, { message: 'Limit cannot exceed 100' })
      .optional()
      .default(10)
  ),
  sortBy: z.preprocess(
    emptyToUndefined,
    projectSortByEnum.optional().default('createdAt')
  ),
  sortOrder: sortOrderEnum,
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
  projectStatusEnum,
  projectSortByEnum,
};
