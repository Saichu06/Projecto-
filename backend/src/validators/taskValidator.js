const { z } = require('zod');
const {
  emptyToUndefined,
  trimmedStringOrNull,
  uuidSchema,
  isoDateSchema,
  sortOrderEnum,
} = require('./commonValidator');

const taskStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED'], {
  errorMap: () => ({ message: 'Status must be PENDING, IN_PROGRESS, or COMPLETED' }),
});

const taskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH'], {
  errorMap: () => ({ message: 'Priority must be LOW, MEDIUM, or HIGH' }),
});

const taskSortByEnum = z.enum(['name', 'createdAt', 'dueDate', 'priority', 'status'], {
  errorMap: () => ({ message: 'Sort by must be name, createdAt, dueDate, priority, or status' }),
});

const createTaskSchema = z.object({
  projectId: uuidSchema,
  name: z
    .string({ required_error: 'Task name is required' })
    .trim()
    .min(1, { message: 'Task name cannot be empty' })
    .max(150, { message: 'Task name cannot exceed 150 characters' }),
  description: z.preprocess(
    trimmedStringOrNull,
    z.string().max(1000, { message: 'Description cannot exceed 1000 characters' }).nullable().optional()
  ),
  priority: taskPriorityEnum.optional().default('MEDIUM'),
  status: taskStatusEnum.optional().default('PENDING'),
  dueDate: isoDateSchema,
});

const updateTaskSchema = z.object({
  projectId: uuidSchema.optional(),
  name: z
    .string()
    .trim()
    .min(1, { message: 'Task name cannot be empty' })
    .max(150, { message: 'Task name cannot exceed 150 characters' })
    .optional(),
  description: z.preprocess(
    trimmedStringOrNull,
    z.string().max(1000, { message: 'Description cannot exceed 1000 characters' }).nullable().optional()
  ),
  priority: taskPriorityEnum.optional(),
  status: taskStatusEnum.optional(),
  dueDate: isoDateSchema,
});

const taskQuerySchema = z.object({
  search: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  status: z.preprocess(emptyToUndefined, taskStatusEnum.optional()),
  priority: z.preprocess(emptyToUndefined, taskPriorityEnum.optional()),
  projectId: z.preprocess(emptyToUndefined, uuidSchema.optional()),
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
    taskSortByEnum.optional().default('createdAt')
  ),
  sortOrder: sortOrderEnum,
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
  taskStatusEnum,
  taskPriorityEnum,
  taskSortByEnum,
  uuidSchema,
};
