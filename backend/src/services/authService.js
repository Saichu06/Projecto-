const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const ApiError = require('../utils/errors');
const auditService = require('./auditService');

const generateToken = (userId, role = 'USER') => {
  const secret = process.env.JWT_SECRET || 'projecto_super_secret_jwt_key_development_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: userId, role }, secret, { expiresIn });
};

const register = async ({ fullName, email, password, role = 'USER' }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw ApiError.conflict('An account with this email address already exists.');
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const assignedRole = role === 'ADMIN' ? 'ADMIN' : 'USER';

  const user = await prisma.user.create({
    data: {
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: assignedRole,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const token = generateToken(user.id, user.role);

  // Audit log
  await auditService.logAction({
    userId: user.id,
    action: 'REGISTER',
    entityType: 'USER',
    entityId: user.id,
    metadata: { email: user.email, role: user.role },
  });

  return {
    user,
    token,
  };
};

const login = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const token = generateToken(user.id, user.role);

  const safeUser = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  // Audit log
  await auditService.logAction({
    userId: user.id,
    action: 'LOGIN',
    entityType: 'USER',
    entityId: user.id,
    metadata: { email: user.email },
  });

  return {
    user: safeUser,
    token,
  };
};

const logout = async (userId) => {
  if (userId) {
    await auditService.logAction({
      userId,
      action: 'LOGOUT',
      entityType: 'USER',
      entityId: userId,
    });
  }
  return { message: 'Logged out successfully.' };
};

const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw ApiError.notFound('User profile not found.');
  }

  return user;
};

const updateProfile = async (userId, { fullName }) => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: fullName.trim(),
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Audit log
  await auditService.logAction({
    userId,
    action: 'UPDATE_PROFILE',
    entityType: 'USER',
    entityId: userId,
    metadata: { updatedName: fullName.trim() },
  });

  return updatedUser;
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    throw ApiError.badRequest('Current password is incorrect.');
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // Audit log (never log passwords!)
  await auditService.logAction({
    userId,
    action: 'CHANGE_PASSWORD',
    entityType: 'USER',
    entityId: userId,
  });

  return { message: 'Password changed successfully.' };
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
};
