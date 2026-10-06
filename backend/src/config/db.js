const { PrismaClient } = require('@prisma/client');

let prisma;

if (!global.__projecto_prisma) {
  global.__projecto_prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
}
prisma = global.__projecto_prisma;

module.exports = prisma;

