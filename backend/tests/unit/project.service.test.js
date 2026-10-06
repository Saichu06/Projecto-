const projectService = require('../../src/services/projectService');
const authService = require('../../src/services/authService');
const prisma = require('../../src/config/db');

describe('ProjectService Unit Tests', () => {
  let user;
  let createdProject;

  beforeAll(async () => {
    const auth = await authService.register({
      fullName: 'Project Service Tester',
      email: `proj_test_${Date.now()}@example.com`,
      password: 'Password123!',
    });
    user = auth.user;
  });

  afterAll(async () => {
    if (user?.id) {
      await prisma.user.deleteMany({ where: { id: user.id } });
    }
  });

  test('createProject should create a project scoped to user', async () => {
    createdProject = await projectService.createProject(user.id, {
      name: 'Alpha Initiative',
      description: 'Initial unit test project',
      status: 'NOT_STARTED',
    });

    expect(createdProject).toHaveProperty('id');
    expect(createdProject.userId).toBe(user.id);
    expect(createdProject.name).toBe('Alpha Initiative');
  });

  test('getProjects should return paginated list with total count', async () => {
    const result = await projectService.getProjects(user.id, {
      page: 1,
      limit: 10,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('pagination');
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.pagination.total).toBeGreaterThanOrEqual(1);
    expect(result.pagination.page).toBe(1);
  });

  test('getProjects should filter by search term', async () => {
    const result = await projectService.getProjects(user.id, {
      search: 'Alpha',
    });
    expect(result.data.length).toBe(1);
    expect(result.data[0].name).toBe('Alpha Initiative');
  });

  test('updateProject should modify project properties', async () => {
    const updated = await projectService.updateProject(user.id, createdProject.id, {
      name: 'Alpha Initiative Updated',
      status: 'IN_PROGRESS',
    });

    expect(updated.name).toBe('Alpha Initiative Updated');
    expect(updated.status).toBe('IN_PROGRESS');
  });

  test('deleteProject should remove project', async () => {
    const result = await projectService.deleteProject(user.id, createdProject.id);
    expect(result.deleted).toBe(true);

    await expect(
      projectService.getProjectById(user.id, createdProject.id)
    ).rejects.toThrow('Project not found');
  });
});
