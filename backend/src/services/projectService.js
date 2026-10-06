const prisma = require('../config/db');
const ApiError = require('../utils/errors');
const auditService = require('./auditService');

const ALLOWED_SORT_FIELDS = ['name', 'createdAt', 'startDate', 'endDate', 'status'];

const getProjects = async (userId, { search, status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = {}) => {
  const where = {
    userId,
  };

  if (status) {
    where.status = status;
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

  const validSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

  const [total, rawProjects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        _count: {
          select: { tasks: true },
        },
        tasks: {
          select: {
            id: true,
            status: true,
            priority: true,
          },
        },
      },
      orderBy: {
        [validSortBy]: validSortOrder,
      },
    }),
  ]);

  const formattedProjects = rawProjects.map((project) => {
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((t) => t.status === 'COMPLETED').length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      id: project.id,
      userId: project.userId,
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      taskCount: totalTasks,
      completedTaskCount: completedTasks,
      progress: progressPercentage,
    };
  });

  return {
    data: formattedProjects,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

const getProjectById = async (userId, projectId) => {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    include: {
      tasks: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      _count: {
        select: { tasks: true },
      },
    },
  });

  if (!project) {
    throw ApiError.notFound('Project not found or you do not have access to it.');
  }

  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter((t) => t.status === 'COMPLETED').length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    ...project,
    taskCount: totalTasks,
    completedTaskCount: completedTasks,
    progress: progressPercentage,
  };
};

const createProject = async (userId, projectData) => {
  const { name, description, status, startDate, endDate } = projectData;

  const project = await prisma.project.create({
    data: {
      userId,
      name: name.trim(),
      description: description ? description.trim() : null,
      status: status || 'NOT_STARTED',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  // Audit log
  await auditService.logAction({
    userId,
    action: 'CREATE',
    entityType: 'PROJECT',
    entityId: project.id,
    metadata: { name: project.name, status: project.status },
  });

  return project;
};

const updateProject = async (userId, projectId, updateData) => {
  const existingProject = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  });

  if (!existingProject) {
    throw ApiError.notFound('Project not found or you do not have permission to update it.');
  }

  const dataToUpdate = {};
  if (updateData.name !== undefined) dataToUpdate.name = updateData.name.trim();
  if (updateData.description !== undefined) dataToUpdate.description = updateData.description ? updateData.description.trim() : null;
  if (updateData.status !== undefined) dataToUpdate.status = updateData.status;
  if (updateData.startDate !== undefined) dataToUpdate.startDate = updateData.startDate ? new Date(updateData.startDate) : null;
  if (updateData.endDate !== undefined) dataToUpdate.endDate = updateData.endDate ? new Date(updateData.endDate) : null;

  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: dataToUpdate,
  });

  // Audit log
  await auditService.logAction({
    userId,
    action: 'UPDATE',
    entityType: 'PROJECT',
    entityId: projectId,
    metadata: { updatedFields: Object.keys(dataToUpdate), name: updatedProject.name },
  });

  return updatedProject;
};

const deleteProject = async (userId, projectId) => {
  const existingProject = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  });

  if (!existingProject) {
    throw ApiError.notFound('Project not found or you do not have permission to delete it.');
  }

  await prisma.project.delete({
    where: { id: projectId },
  });

  // Audit log
  await auditService.logAction({
    userId,
    action: 'DELETE',
    entityType: 'PROJECT',
    entityId: projectId,
    metadata: { name: existingProject.name },
  });

  return { id: projectId, deleted: true };
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
