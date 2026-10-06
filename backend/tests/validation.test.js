const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');

describe('PROJECTO Validation Hardening Test Suite', () => {
  let userToken, userId;
  let otherUserToken, otherUserId;
  let validProjectId;

  const validUser = {
    fullName: 'Validation Tester',
    email: `val_user_${Date.now()}@example.com`,
    password: 'Password123!',
  };

  const otherUser = {
    fullName: 'Other Tester',
    email: `val_other_${Date.now()}@example.com`,
    password: 'Password123!',
  };

  beforeAll(async () => {
    const res1 = await request(app).post('/api/auth/register').send(validUser);
    userToken = res1.body.data.token;
    userId = res1.body.data.user.id;

    const res2 = await request(app).post('/api/auth/register').send(otherUser);
    otherToken = res2.body.data.token;
    otherUserId = res2.body.data.user.id;

    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Validation Project',
        startDate: '2026-10-10T00:00:00.000Z',
        endDate: '2026-10-25T00:00:00.000Z',
      });
    validProjectId = projRes.body.data.id;
  });

  afterAll(async () => {
    const ids = [userId, otherUserId].filter(Boolean);
    if (ids.length > 0) {
      await prisma.auditLog.deleteMany({ where: { userId: { in: ids } } });
      await prisma.pushDevice.deleteMany({ where: { userId: { in: ids } } });
      await prisma.task.deleteMany({ where: { userId: { in: ids } } });
      await prisma.project.deleteMany({ where: { userId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.$disconnect();
  });

  describe('1. Project Validation', () => {
    it('should reject project with empty / whitespace name (400)', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: '   ' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject project when end date is earlier than start date (400)', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Invalid Date Project',
          startDate: '2026-10-25T00:00:00.000Z',
          endDate: '2026-10-10T00:00:00.000Z',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should accept project when start date equals end date (201)', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Single Day Project',
          startDate: '2026-10-15T00:00:00.000Z',
          endDate: '2026-10-15T00:00:00.000Z',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should accept project with valid date range (201)', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Valid Range Project',
          startDate: '2026-10-10T00:00:00.000Z',
          endDate: '2026-10-20T00:00:00.000Z',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should reject project with invalid date string format (400)', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Invalid Date Format',
          startDate: 'not-a-valid-date',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject project with invalid status enum (400)', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Invalid Status Project',
          status: 'INVALID_STATUS',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Task Validation', () => {
    it('should reject task with empty name (400)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          projectId: validProjectId,
          name: '   ',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject task with invalid priority enum (400)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          projectId: validProjectId,
          name: 'Invalid Priority Task',
          priority: 'URGENT_NOW',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject task with invalid status enum (400)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          projectId: validProjectId,
          name: 'Invalid Status Task',
          status: 'ARCHIVED',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject task with non-existent project UUID (400/404)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          projectId: '00000000-0000-0000-0000-000000000000',
          name: 'Orphan Task',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject task when referencing another user project (400)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          projectId: validProjectId,
          name: 'Intruder Task',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Authentication Validation', () => {
    it('should reject registration with invalid email format (400)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Bad Email User',
          email: 'not-an-email',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with weak/short password (<6 chars) (400)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Short Pass User',
          email: `shortpass_${Date.now()}@example.com`,
          password: '123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject password change when new password equals current password (400)', async () => {
      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: validUser.password,
          newPassword: validUser.password,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. Pagination & Sorting Validation', () => {
    it('should reject page <= 0 (400)', async () => {
      const res = await request(app)
        .get('/api/projects?page=0')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject negative limit (400)', async () => {
      const res = await request(app)
        .get('/api/projects?limit=-5')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject excessive limit > 100 (400)', async () => {
      const res = await request(app)
        .get('/api/projects?limit=1000')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should accept valid sorting parameters (200)', async () => {
      const res = await request(app)
        .get('/api/projects?sortBy=name&sortOrder=asc')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject invalid sorting field (400)', async () => {
      const res = await request(app)
        .get('/api/projects?sortBy=unsupported_column')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid sort direction (400)', async () => {
      const res = await request(app)
        .get('/api/projects?sortOrder=sideways')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
