const taskService = require('../../src/services/taskService');
const projectService = require('../../src/services/projectService');
const authService = require('../../src/services/authService');
const prisma = require('../../src/config/db');

describe('TaskService Unit Tests', () => {
  let user;
  let project;
  let createdTask;

  beforeAll(async () => {
    const auth = await authService.register({
      fullName: 'Task Service Tester',
      email: `task_test_${Date.now()}@example.com`,
      password: 'Password123!',
    });
    user = auth.user;

    project = await projectService.createProject(user.id, {
      name: 'Task Test Project',
    });
  });

  afterAll(async () => {
    if (user?.id) {
      await prisma.user.deleteMany({ where: { id: user.id } });
    }
  });

  test('createTask should create task belonging to project and user', async () => {
    createdTask = await taskService.createTask(user.id, {
      projectId: project.id,
      name: 'Write Unit Tests',
      priority: 'HIGH',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
    });

    expect(createdTask).toHaveProperty('id');
    expect(createdTask.projectId).toBe(project.id);
    expect(createdTask.userId).toBe(user.id);
    expect(createdTask.priority).toBe('HIGH');
  });

  test('getTasks should return paginated list with total count and sorting', async () => {
    const result = await taskService.getTasks(user.id, {
      page: 1,
      limit: 5,
      sortBy: 'dueDate',
      sortOrder: 'asc',
    });

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('pagination');
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.pagination.total).toBe(1);
    expect(result.data[0].name).toBe('Write Unit Tests');
  });

  test('updateTask should update task status and priority', async () => {
    const updated = await taskService.updateTask(user.id, createdTask.id, {
      status: 'COMPLETED',
      priority: 'MEDIUM',
    });

    expect(updated.status).toBe('COMPLETED');
    expect(updated.priority).toBe('MEDIUM');
  });

  test('deleteTask should delete task from project', async () => {
    const result = await taskService.deleteTask(user.id, createdTask.id);
    expect(result.deleted).toBe(true);

    await expect(
      taskService.getTaskById(user.id, createdTask.id)
    ).rejects.toThrow('Task not found');
  });
});
