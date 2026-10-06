const prisma = require('../config/db');
const ApiError = require('../utils/errors');
const auditService = require('./auditService');

const ALLOWED_TASK_SORT_FIELDS = ['name', 'createdAt', 'dueDate', 'priority', 'status'];

const getTasks = async (userId, { search, status, priority, projectId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = {}) => {
  const where = {
    userId,
  };

  if (status) {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  if (projectId) {
    where.projectId = projectId;
  }

  if (search && search.trim()) {
    where.name = {
      contains: search.trim(),
      mode: 'insensitive',
    };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const validSortBy = ALLOWED_TASK_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

  const [total, tasks] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: {
        [validSortBy]: validSortOrder,
      },
    }),
  ]);

  return {
    data: tasks,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

const getTaskById = async (userId, taskId) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      userId,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  });

  if (!task) {
    throw ApiError.notFound('Task not found or you do not have permission to view it.');
  }

  return task;
};

const createTask = async (userId, taskData) => {
  const { projectId, name, description, priority, status, dueDate } = taskData;

  // Verify the project exists AND belongs to the authenticated user
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  });

  if (!project) {
    throw ApiError.badRequest('Referenced project does not exist or does not belong to you.');
  }

  const task = await prisma.task.create({
    data: {
      userId,
      projectId,
      name: name.trim(),
      description: description ? description.trim() : null,
      priority: priority || 'MEDIUM',
      status: status || 'PENDING',
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  });

  // Audit log
  await auditService.logAction({
    userId,
    action: 'CREATE',
    entityType: 'TASK',
    entityId: task.id,
    metadata: { name: task.name, priority: task.priority, status: task.status, projectId: task.projectId },
  });

  return task;
};

const updateTask = async (userId, taskId, updateData) => {
  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      userId,
    },
  });

  if (!existingTask) {
    throw ApiError.notFound('Task not found or you do not have permission to update it.');
  }

  // If changing project, ensure target project belongs to the user
  if (updateData.projectId && updateData.projectId !== existingTask.projectId) {
    const project = await prisma.project.findFirst({
      where: {
        id: updateData.projectId,
        userId,
      },
    });

    if (!project) {
      throw ApiError.badRequest('Target project does not exist or does not belong to you.');
    }
  }

  const dataToUpdate = {};
  if (updateData.projectId !== undefined) dataToUpdate.projectId = updateData.projectId;
  if (updateData.name !== undefined) dataToUpdate.name = updateData.name.trim();
  if (updateData.description !== undefined) dataToUpdate.description = updateData.description ? updateData.description.trim() : null;
  if (updateData.priority !== undefined) dataToUpdate.priority = updateData.priority;
  if (updateData.status !== undefined) dataToUpdate.status = updateData.status;
  if (updateData.dueDate !== undefined) dataToUpdate.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: dataToUpdate,
    include: {
      project: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  });

  // Determine audit action: COMPLETE or UPDATE
  const isCompletion = dataToUpdate.status === 'COMPLETED' && existingTask.status !== 'COMPLETED';
  const action = isCompletion ? 'COMPLETE' : 'UPDATE';

  await auditService.logAction({
    userId,
    action,
    entityType: 'TASK',
    entityId: taskId,
    metadata: { updatedFields: Object.keys(dataToUpdate), status: updatedTask.status },
  });

  return updatedTask;
};

const deleteTask = async (userId, taskId) => {
  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      userId,
    },
  });

  if (!existingTask) {
    throw ApiError.notFound('Task not found or you do not have permission to delete it.');
  }

  await prisma.task.delete({
    where: { id: taskId },
  });

  // Audit log
  await auditService.logAction({
    userId,
    action: 'DELETE',
    entityType: 'TASK',
    entityId: taskId,
    metadata: { name: existingTask.name },
  });

  return { id: taskId, deleted: true };
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
