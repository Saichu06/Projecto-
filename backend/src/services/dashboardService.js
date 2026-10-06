const prisma = require('../config/db');

const getDashboardStats = async (userId) => {
  const [
    totalProjects,
    projectsInProgress,
    totalTasks,
    completedTasks,
    pendingTasks,
    recentProjects,
    recentTasks,
  ] = await Promise.all([
    prisma.project.count({
      where: { userId },
    }),
    prisma.project.count({
      where: { userId, status: 'IN_PROGRESS' },
    }),
    prisma.task.count({
      where: { userId },
    }),
    prisma.task.count({
      where: { userId, status: 'COMPLETED' },
    }),
    prisma.task.count({
      where: { userId, status: 'PENDING' },
    }),
    prisma.project.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    }),
    prisma.task.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ]);

  return {
    totalProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    projectsInProgress,
    recentProjects: recentProjects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      startDate: p.startDate,
      endDate: p.endDate,
      taskCount: p._count.tasks,
      createdAt: p.createdAt,
    })),
    recentTasks,
  };
};

module.exports = {
  getDashboardStats,
};
