const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'PROJECTO API Documentation',
    version: '1.1.0',
    description:
      'Robust and secure REST API for Projecto Project & Task Management System. Single unified backend shared by Web and Mobile applications with Pagination, Sorting, RBAC, Audit Logging, and Push Notifications.',
    contact: {
      name: 'Projecto Engineering Team',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token in the format: Bearer <token>',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          fullName: { type: 'string', example: 'Alex Johnson' },
          email: { type: 'string', format: 'email', example: 'alex@example.com' },
          role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      PaginationMetadata: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          total: { type: 'integer', example: 24 },
          totalPages: { type: 'integer', example: 3 },
        },
      },
      AuditLog: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid', nullable: true },
          action: { type: 'string', example: 'CREATE' },
          entityType: { type: 'string', example: 'PROJECT' },
          entityId: { type: 'string', nullable: true },
          metadata: { type: 'object', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'E-Commerce Platform' },
          description: { type: 'string', example: 'Build modern store with payment gateway' },
          status: {
            type: 'string',
            enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
            example: 'IN_PROGRESS',
          },
          startDate: { type: 'string', format: 'date-time', nullable: true },
          endDate: { type: 'string', format: 'date-time', nullable: true },
          taskCount: { type: 'integer', example: 5 },
          completedTaskCount: { type: 'integer', example: 2 },
          progress: { type: 'integer', example: 40 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          projectId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Implement JWT Auth' },
          description: { type: 'string', example: 'Add access token verification' },
          priority: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH'],
            example: 'HIGH',
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
            example: 'IN_PROGRESS',
          },
          dueDate: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          project: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              status: { type: 'string' },
            },
          },
        },
      },
      DashboardStats: {
        type: 'object',
        properties: {
          totalProjects: { type: 'integer', example: 4 },
          totalTasks: { type: 'integer', example: 18 },
          completedTasks: { type: 'integer', example: 7 },
          pendingTasks: { type: 'integer', example: 6 },
          projectsInProgress: { type: 'integer', example: 2 },
          recentProjects: {
            type: 'array',
            items: { $ref: '#/components/schemas/Project' },
          },
          recentTasks: {
            type: 'array',
            items: { $ref: '#/components/schemas/Task' },
          },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' },
          pagination: { $ref: '#/components/schemas/PaginationMetadata' },
        },
      },
      ApiErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'email', 'password'],
                properties: {
                  fullName: { type: 'string', example: 'Alex Johnson' },
                  email: { type: 'string', format: 'email', example: 'alex@example.com' },
                  password: { type: 'string', format: 'password', example: 'Password123!' },
                  role: { type: 'string', enum: ['USER', 'ADMIN'], default: 'USER' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User registered successfully' },
          400: { description: 'Validation error' },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Authenticate user and receive JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'alex@example.com' },
                  password: { type: 'string', format: 'password', example: 'Password123!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/projects': {
      get: {
        tags: ['Projects'],
        summary: 'List user projects with search, filter, pagination, and sorting',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by project name' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['name', 'createdAt', 'startDate', 'endDate', 'status'], default: 'createdAt' } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
        ],
        responses: {
          200: { description: 'Projects retrieved with pagination metadata' },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create a new project',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Project Apollo' },
                  description: { type: 'string', example: 'Core architecture overhaul' },
                  status: { type: 'string', enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] },
                  startDate: { type: 'string', format: 'date-time' },
                  endDate: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Project created successfully' },
        },
      },
    },
    '/api/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'List user tasks with search, filters, pagination, and sorting',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] } },
          { name: 'priority', in: 'query', schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] } },
          { name: 'projectId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['name', 'createdAt', 'dueDate', 'priority', 'status'], default: 'createdAt' } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
        ],
        responses: {
          200: { description: 'Tasks retrieved with pagination metadata' },
        },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create a new task under a project',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['projectId', 'name'],
                properties: {
                  projectId: { type: 'string', format: 'uuid' },
                  name: { type: 'string', example: 'Design wireframes' },
                  description: { type: 'string', example: 'Draft mobile view wireframes' },
                  priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
                  status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] },
                  dueDate: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Task created successfully' },
        },
      },
    },
    '/api/dashboard': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get aggregated statistics for current user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Dashboard metrics calculated' },
        },
      },
    },
    '/api/audit-logs': {
      get: {
        tags: ['Audit Logs'],
        summary: 'Get user-scoped audit activity log',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'User audit logs retrieved' },
        },
      },
    },
    '/api/admin/audit-logs': {
      get: {
        tags: ['Admin (RBAC)'],
        summary: 'Get all system audit logs across all users (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'action', in: 'query', schema: { type: 'string' } },
          { name: 'entityType', in: 'query', schema: { type: 'string' } },
          { name: 'userId', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Admin system audit logs retrieved' },
          403: { description: 'Forbidden: Requires ADMIN role' },
        },
      },
    },
    '/api/admin/system-stats': {
      get: {
        tags: ['Admin (RBAC)'],
        summary: 'Get platform-wide statistics (Admin only)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'System overview statistics retrieved' },
          403: { description: 'Forbidden: Requires ADMIN role' },
        },
      },
    },
    '/api/notifications/register-device': {
      post: {
        tags: ['Notifications'],
        summary: 'Register Expo push device token for current user',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token'],
                properties: {
                  token: { type: 'string', example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' },
                  platform: { type: 'string', enum: ['android', 'ios', 'web'], default: 'android' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Device token registered successfully' },
        },
      },
    },
    '/api/notifications/trigger-due-check': {
      post: {
        tags: ['Notifications'],
        summary: 'Scan and trigger push notifications for tasks due tomorrow',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Due tomorrow scan executed' },
        },
      },
    },
  },
};

const swaggerOptions = {
  swaggerDefinition,
  apis: [],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;
