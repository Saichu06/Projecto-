const authService = require('../../src/services/authService');
const prisma = require('../../src/config/db');

describe('AuthService Unit Tests', () => {
  const testEmail = `unit_test_${Date.now()}@example.com`;
  let createdUserId;

  afterAll(async () => {
    if (createdUserId) {
      await prisma.user.deleteMany({ where: { id: createdUserId } });
    }
  });

  test('register service should hash password, assign role, create user and token', async () => {
    const result = await authService.register({
      fullName: 'Unit Tester',
      email: testEmail,
      password: 'SecurePassword123!',
      role: 'USER',
    });

    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('token');
    expect(result.user.email).toBe(testEmail);
    expect(result.user.role).toBe('USER');
    expect(result.user).not.toHaveProperty('passwordHash');

    createdUserId = result.user.id;
  });

  test('register service should reject duplicate email', async () => {
    await expect(
      authService.register({
        fullName: 'Duplicate User',
        email: testEmail,
        password: 'AnotherPassword123!',
      })
    ).rejects.toThrow('An account with this email address already exists.');
  });

  test('login service should authenticate valid credentials', async () => {
    const result = await authService.login({
      email: testEmail,
      password: 'SecurePassword123!',
    });

    expect(result).toHaveProperty('token');
    expect(result.user.email).toBe(testEmail);
  });

  test('login service should reject incorrect password', async () => {
    await expect(
      authService.login({
        email: testEmail,
        password: 'WrongPassword!',
      })
    ).rejects.toThrow('Invalid email or password.');
  });

  test('changePassword service should reject invalid current password', async () => {
    await expect(
      authService.changePassword(createdUserId, {
        currentPassword: 'IncorrectOldPassword',
        newPassword: 'BrandNewPassword123!',
      })
    ).rejects.toThrow('Current password is incorrect.');
  });

  test('changePassword service should succeed with correct current password', async () => {
    const result = await authService.changePassword(createdUserId, {
      currentPassword: 'SecurePassword123!',
      newPassword: 'BrandNewPassword123!',
    });

    expect(result.message).toBe('Password changed successfully.');

    // Verify login with new password
    const loginResult = await authService.login({
      email: testEmail,
      password: 'BrandNewPassword123!',
    });
    expect(loginResult).toHaveProperty('token');
  });
});
