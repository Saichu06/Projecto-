const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');

describe('PROJECTO Backend API Comprehensive Test Suite', () => {
  let user1Token, user1Id;
  let user2Token, user2Id;
  let adminToken, adminId;
  let user1ProjectId, user1TaskId;

  const testUser1 = {
    fullName: 'Alice Developer',
    email: `alice_${Date.now()}@example.com`,
    password: 'Password123!',
  };

  const testUser2 = {
    fullName: 'Bob Designer',
    email: `bob_${Date.now()}@example.com`,
    password: 'Password123!',
  };

  const testAdmin = {
    fullName: 'System Administrator',
    email: `admin_${Date.now()}@example.com`,
    password: 'AdminPassword123!',
    role: 'ADMIN',
  };

  afterAll(async () => {
    // Clean up test data
    const userIds = [user1Id, user2Id, adminId].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.pushDevice.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.task.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.project.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await prisma.$disconnect();
  });

  describe('1. Authentication Endpoints (/api/auth)', () => {
    it('should register User 1 successfully with default USER role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser1);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser1.email.toLowerCase());
      expect(res.body.data.user.role).toBe('USER');
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.token).toBeDefined();

      user1Token = res.body.data.token;
      user1Id = res.body.data.user.id;
    });

    it('should reject registration with duplicate email (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser1);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should register User 2 successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser2);

      expect(res.statusCode).toBe(201);
      user2Token = res.body.data.token;
      user2Id = res.body.data.user.id;
    });

    it('should register Admin User with ADMIN role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testAdmin);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.user.role).toBe('ADMIN');
      adminToken = res.body.data.token;
      adminId = res.body.data.user.id;
    });

    it('should login User 1 with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser1.email,
          password: testUser1.password,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser1.email.toLowerCase());
    });

    it('should reject login with invalid password (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser1.email,
          password: 'WrongPassword!',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should get current user profile with valid token (/api/auth/me)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(user1Id);
      expect(res.body.data.fullName).toBe(testUser1.fullName);
    });

    it('should update user profile full name (/api/auth/profile)', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ fullName: 'Alice Updated Name' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fullName).toBe('Alice Updated Name');
    });

    it('should change password successfully with correct current password', async () => {
      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          currentPassword: testUser1.password,
          newPassword: 'BrandNewPassword123!',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('2. Project Operations, Pagination & Sorting (/api/projects)', () => {
    it('should create a project for User 1', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Project Alpha',
          description: 'Initial confidential project',
          status: 'IN_PROGRESS',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Project Alpha');
      expect(res.body.data.userId).toBe(user1Id);

      user1ProjectId = res.body.data.id;
    });

    it('should list projects for User 1 with pagination envelope and sorting', async () => {
      const res = await request(app)
        .get('/api/projects?page=1&limit=10&sortBy=name&sortOrder=asc')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. Cross-User Authorization & Data Isolation', () => {
    it('User 2 should NOT be able to view User 1 project (404 Not Found)', async () => {
      const res = await request(app)
        .get(`/api/projects/${user1ProjectId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('User 2 should NOT see User 1 projects in project list', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(200);
      const projectIds = res.body.data.map((p) => p.id);
      expect(projectIds).not.toContain(user1ProjectId);
    });

    it('User 2 should NOT be able to create a task inside User 1 project (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          projectId: user1ProjectId,
          name: 'Illegal Task in Alice Project',
          priority: 'HIGH',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. Task Operations, Pagination & Sorting (/api/tasks)', () => {
    it('User 1 should create a task with tomorrow dueDate in their project', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          projectId: user1ProjectId,
          name: 'Setup database schema and migrations',
          description: 'Configure Prisma models and triggers',
          priority: 'HIGH',
          status: 'PENDING',
          dueDate: tomorrow.toISOString(),
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.name).toBe('Setup database schema and migrations');
      expect(res.body.data.userId).toBe(user1Id);

      user1TaskId = res.body.data.id;
    });

    it('User 1 should list tasks with pagination and sorting by priority', async () => {
      const res = await request(app)
        .get('/api/tasks?page=1&limit=5&sortBy=priority&sortOrder=desc')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
    });

    it('User 1 should update task status to COMPLETED', async () => {
      const res = await request(app)
        .put(`/api/tasks/${user1TaskId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ status: 'COMPLETED' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');
    });
  });

  describe('5. Audit Logs (/api/audit-logs)', () => {
    it('User 1 should be able to retrieve their user-scoped audit log entries', async () => {
      const res = await request(app)
        .get('/api/audit-logs?page=1&limit=10')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.pagination).toBeDefined();

      // Check actions recorded
      const actions = res.body.data.map((log) => log.action);
      expect(actions).toEqual(expect.arrayContaining(['REGISTER', 'LOGIN', 'CREATE']));
    });
  });

  describe('6. Role-Based Access Control (RBAC) & Admin Routes (/api/admin)', () => {
    it('Standard USER (User 1) should be forbidden from accessing Admin audit logs (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Admin User should successfully access Admin audit logs', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs?page=1&limit=20')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('Admin User should access system-wide statistics', async () => {
      const res = await request(app)
        .get('/api/admin/system-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('totalUsers');
      expect(res.body.data).toHaveProperty('totalProjects');
      expect(res.body.data).toHaveProperty('totalTasks');
      expect(res.body.data).toHaveProperty('totalAuditLogs');
      expect(res.body.data.totalUsers).toBeGreaterThanOrEqual(3);
    });
  });

  describe('7. Push Notification Device Registration & Due Check (/api/notifications)', () => {
    it('User 1 should register an Expo push device token', async () => {
      const res = await request(app)
        .post('/api/notifications/register-device')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
          platform: 'android',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBe('ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]');
    });

    it('should trigger due tomorrow notifications scan', async () => {
      const res = await request(app)
        .post('/api/notifications/trigger-due-check')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('message');
    });
  });
});
