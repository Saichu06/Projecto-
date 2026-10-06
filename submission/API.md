# Projecto — REST API Specification

This document details all REST API endpoints provided by the **Projecto Backend Gateway**.

---

## 1. Overview & Base URLs

- **Local Base URL**: `http://localhost:5000/api`
- **Swagger Interactive Documentation (UI)**: `http://localhost:5000/api-docs`
- **Health Check Endpoint**: `GET http://localhost:5000/health`
- **Standard Authentication**: Bearer Token in HTTP Authorization Header:
  ```http
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Standard Success Envelope (Paginated)**:
  ```json
  {
    "success": true,
    "message": "Operation successful",
    "data": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 24,
      "totalPages": 3
    }
  }
  ```

### Validation & Error Invariants:
- **Backend as Source of Truth**: All requests undergo strict Zod runtime schema validation on the backend gateway.
- **Resource Ownership**: Scoped database queries (`where: { userId }`) ensure users cannot view or manipulate other users' resources, independent of validation schemas.
- **Date Invariant**: For Projects, `startDate <= endDate` is strictly enforced (equal dates permitted for single-day projects).
- **Pagination Invariants**: `page` >= 1, `limit` between 1 and 100. Values outside this boundary return `400 Bad Request`.
- **Sorting Whitelist**: Only predefined columns are accepted for `sortBy`. Invalid columns or directions return `400 Bad Request`.

---

## 2. Authentication Endpoints (`/api/auth`)

### 2.1 Register New User
- **Method**: `POST`
- **Route**: `/api/auth/register`
- **Auth**: Public (Rate-limited: 20 req/15min)
- **Request Body**:
  ```json
  {
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "password": "Password123!",
    "role": "USER"
  }
  ```
- **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": "8bf388ca-0454-45ba-8970-f5af42e47525",
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "role": "USER",
        "createdAt": "2026-10-06T18:00:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

### 2.2 User Login
- **Method**: `POST`
- **Route**: `/api/auth/login`
- **Auth**: Public (Rate-limited: 20 req/15min)
- **Request Body**:
  ```json
  {
    "email": "john.doe@example.com",
    "password": "Password123!"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": "8bf388ca-0454-45ba-8970-f5af42e47525",
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "role": "USER"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

### 2.3 User Logout
- **Method**: `POST`
- **Route**: `/api/auth/logout`
- **Auth**: Required (`Bearer <token>`)

### 2.4 Get Current Profile (`/me`)
- **Method**: `GET`
- **Route**: `/api/auth/me`
- **Auth**: Required

### 2.5 Update User Profile
- **Method**: `PUT`
- **Route**: `/api/auth/profile`
- **Auth**: Required
- **Request Body**: `{ "fullName": "Johnathan Doe" }`

### 2.6 Change Password
- **Method**: `PUT`
- **Route**: `/api/auth/password`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "currentPassword": "Password123!",
    "newPassword": "NewSecurePassword456!"
  }
  ```

---

## 3. Project Management Endpoints (`/api/projects`)

### 3.1 List Projects
- **Method**: `GET`
- **Route**: `/api/projects`
- **Query Parameters**:
  - `search` *(optional)*: Substring match on project name.
  - `status` *(optional)*: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`.
  - `page` *(optional, default 1)*: Page number.
  - `limit` *(optional, default 10, max 100)*: Items per page.
  - `sortBy` *(optional, default 'createdAt')*: `name`, `createdAt`, `startDate`, `endDate`, `status`.
  - `sortOrder` *(optional, default 'desc')*: `asc` or `desc`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 4,
      "totalPages": 1
    }
  }
  ```

### 3.2 Get Project by ID
- **Method**: `GET`
- **Route**: `/api/projects/:id`

### 3.3 Create Project
- **Method**: `POST`
- **Route**: `/api/projects`
- **Request Body**:
  ```json
  {
    "name": "Internal Portal Redesign",
    "description": "Migration to Next.js and Prisma",
    "status": "NOT_STARTED",
    "startDate": "2026-11-01T00:00:00.000Z",
    "endDate": "2026-12-15T00:00:00.000Z"
  }
  ```

### 3.4 Update Project
- **Method**: `PUT`
- **Route**: `/api/projects/:id`

### 3.5 Delete Project
- **Method**: `DELETE`
- **Route**: `/api/projects/:id`

---

## 4. Task Management Endpoints (`/api/tasks`)

### 4.1 List Tasks
- **Method**: `GET`
- **Route**: `/api/tasks`
- **Query Parameters**:
  - `search` *(optional)*: Substring search on task name.
  - `status` *(optional)*: `PENDING`, `IN_PROGRESS`, `COMPLETED`.
  - `priority` *(optional)*: `LOW`, `MEDIUM`, `HIGH`.
  - `projectId` *(optional)*: Filter tasks under a specific project.
  - `page` *(optional, default 1)*: Page number.
  - `limit` *(optional, default 10, max 100)*: Items per page.
  - `sortBy` *(optional, default 'createdAt')*: `name`, `createdAt`, `dueDate`, `priority`, `status`.
  - `sortOrder` *(optional, default 'desc')*: `asc` or `desc`.

### 4.2 Create Task
- **Method**: `POST`
- **Route**: `/api/tasks`
- **Request Body**:
  ```json
  {
    "projectId": "c5a3e1fa-fd39-4f8e-beeb-d4213f582c67",
    "name": "Implement Database Indexes",
    "description": "Add multi-column indexes for status and priority",
    "priority": "HIGH",
    "status": "PENDING",
    "dueDate": "2026-10-20T00:00:00.000Z"
  }
  ```

### 4.3 Update Task
- **Method**: `PUT`
- **Route**: `/api/tasks/:id`

### 4.4 Delete Task
- **Method**: `DELETE`
- **Route**: `/api/tasks/:id`

---

## 5. Dashboard Aggregation Endpoint (`/api/dashboard`)

### 5.1 Get User Dashboard Metrics
- **Method**: `GET`
- **Route**: `/api/dashboard`
- **Auth**: Required

---

## 6. Audit Logging Endpoints (`/api/audit-logs` & `/api/admin/audit-logs`)

### 6.1 Get User Audit Logs
- **Method**: `GET`
- **Route**: `/api/audit-logs`
- **Auth**: Required
- **Query Parameters**: `page` (default 1), `limit` (default 20).

### 6.2 Get System-Wide Audit Logs (Admin Only)
- **Method**: `GET`
- **Route**: `/api/admin/audit-logs`
- **Auth**: Required (`Role: ADMIN`)
- **Query Parameters**: `page`, `limit`, `action`, `entityType`, `userId`.

### 6.3 Get System Statistics (Admin Only)
- **Method**: `GET`
- **Route**: `/api/admin/system-stats`
- **Auth**: Required (`Role: ADMIN`)

---

## 7. Push Notifications Endpoints (`/api/notifications`)

### 7.1 Register Device Push Token
- **Method**: `POST`
- **Route**: `/api/notifications/register-device`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "platform": "android"
  }
  ```

### 7.2 Trigger Due Tomorrow Scan
- **Method**: `POST`
- **Route**: `/api/notifications/trigger-due-check`
- **Auth**: Required
