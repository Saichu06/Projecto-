const dashboardService = require('../../src/services/dashboardService');
const projectService = require('../../src/services/projectService');
const taskService = require('../../src/services/taskService');
const authService = require('../../src/services/authService');
const prisma = require('../../src/config/db');

describe('DashboardService Unit Tests', () => {
  let user;

  beforeAll(async () => {
    const auth = await authService.register({
      fullName: 'Dashboard Service Tester',
      email: `dash_test_${Date.now()}@example.com`,
      password: 'Password123!',
    });
    user = auth.user;

    const proj = await projectService.createProject(user.id, {
      name: 'Dashboard Analytics Project',
      status: 'IN_PROGRESS',
    });

    await taskService.createTask(user.id, {
      projectId: proj.id,
      name: 'Task 1 Pending',
      status: 'PENDING',
    });

    await taskService.createTask(user.id, {
      projectId: proj.id,
      name: 'Task 2 Completed',
      status: 'COMPLETED',
    });
  });

  afterAll(async () => {
    if (user?.id) {
      await prisma.user.deleteMany({ where: { id: user.id } });
    }
  });

  test('getDashboardStats should return calculated metrics strictly scoped to user', async () => {
    const stats = await dashboardService.getDashboardStats(user.id);

    expect(stats.totalProjects).toBe(1);
    expect(stats.projectsInProgress).toBe(1);
    expect(stats.totalTasks).toBe(2);
    expect(stats.completedTasks).toBe(1);
    expect(stats.pendingTasks).toBe(1);
    expect(stats.recentProjects.length).toBe(1);
    expect(stats.recentTasks.length).toBe(2);
  });
});
