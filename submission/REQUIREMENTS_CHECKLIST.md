# Projecto — Requirements Traceability & Verification Checklist

This matrix maps every mandatory requirement and optional bonus feature from the assessment specification to the exact source code, tests, and documentation files in the repository.

---

## 1. Mandatory Requirements

| Category | Requirement | Implementation Location | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Database** | PostgreSQL shared database | `backend/prisma/schema.prisma` | PostgreSQL 18 Local DB | **PASS** |
| **Database** | Prisma ORM with versioned migrations | `backend/prisma/migrations/` | `npx prisma migrate deploy` | **PASS** |
| **Database** | UUID Primary Keys & Cascade Deletes | `backend/prisma/schema.prisma` | Prisma Schema & DB Constraints | **PASS** |
| **Database** | Database Indexes on FKs & Enums | `backend/prisma/schema.prisma` | Index creation verified | **PASS** |
| **Backend** | Single unified Express REST API | `backend/src/server.js` | Express 5.2 & Node.js 18+ | **PASS** |
| **Backend** | User Auth (Register, Login, JWT, Bcrypt) | `backend/src/controllers/authController.js` | Automated Jest Integration Tests | **PASS** |
| **Backend** | User Profile & Password Updates | `backend/src/routes/authRoutes.js` | Unit & Integration Tests | **PASS** |
| **Backend** | Project CRUD & Task CRUD | `backend/src/controllers/projectController.js`, `taskController.js` | Passing API Tests | **PASS** |
| **Backend** | User-Scoped Data Isolation (`where: { userId }`) | All controllers & services | Multi-user isolation tests | **PASS** |
| **Backend** | Zod Runtime Schema Validation & Hardening | `backend/src/validators/` | `backend/tests/validation.test.js` (20 tests) | **PASS** |
| **Backend** | Rate Limiting & Helmet Security | `backend/src/middleware/rateLimitMiddleware.js` | Security middleware inspection | **PASS** |
| **Backend** | Swagger OpenAPI Interactive Docs | `backend/src/config/swagger.js` | Active at `/api-docs` | **PASS** |
| **Web Frontend** | React 19 + Vite Web Application | `web/src/App.jsx` | `npm run build` (0 errors) | **PASS** |
| **Web Frontend** | Light/Minimal UI with Blue Accents | `web/src/index.css`, `tailwind.config.js` | UI Visual Review | **PASS** |
| **Web Frontend** | Collapsible Sidebar with Logo | `web/src/components/common/Sidebar.jsx` | UI Component Verification | **PASS** |
| **Web Frontend** | Help & User Guide Modal | `web/src/components/help/HelpModal.jsx` | Top nav `(?)` button | **PASS** |
| **Web Frontend** | Dashboard Onboarding (0 Projects) | `web/src/pages/DashboardPage.jsx` | 0-project state UI test | **PASS** |
| **Web Frontend** | Upcoming Tasks Section | `web/src/pages/DashboardPage.jsx` | Sorted by `dueDate` | **PASS** |
| **Web Frontend** | Detail Page Breadcrumbs | `web/src/pages/ProjectDetailPage.jsx` | `Projects / <Name>` | **PASS** |
| **Web Frontend** | Keyboard Shortcuts (`N`, `P`, `/`, `Esc`) | `web/src/pages/DashboardPage.jsx`, `ProjectsPage.jsx`, `TasksPage.jsx` | Keystroke listeners | **PASS** |
| **Mobile App** | React Native (Expo SDK 52) | `mobile/App.js` | Metro bundler start verified | **PASS** |
| **Mobile App** | Secure Hardware Storage (`SecureStore`) | `mobile/src/services/api.js` | Token persistence | **PASS** |
| **Mobile App** | Native Bottom Tab Navigation | `mobile/src/navigation/AppNavigator.jsx` | 4 tab navigation | **PASS** |
| **Mobile App** | Native Pull-to-Refresh | `mobile/src/screens/` | `RefreshControl` on lists | **PASS** |
| **Mobile App** | Cross-platform Data Synchronization | Shared API Gateway & PostgreSQL | `tests/e2e-scenario.js` (100%) | **PASS** |

---

## 2. Optional Bonus Features

| Bonus Feature | Assessment Specification | Implementation Location | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1. Unit Tests** | Service-level unit tests for auth, projects, tasks, dashboard | `backend/tests/unit/` (4 suites) | `npm test` → 16 unit tests passed | **PASS** |
| **2. Integration Tests** | Multi-user API integration tests with data isolation checks | `backend/tests/api.test.js` | `npm test` → 23 integration tests passed | **PASS** |
| **3. Validation Hardening** | Invariant `startDate <= endDate`, enums, bounds, trimmed inputs | `backend/tests/validation.test.js` | `npm test` → 20 validation tests passed | **PASS** |
| **4. Pagination** | `page` and `limit` query parameters with standard pagination envelope | `backend/src/services/projectService.js`, `taskService.js` | Integration test & Web/Mobile UI | **PASS** |
| **5. Sorting** | Safe server-side sorting with field whitelisting | `backend/src/validators/projectValidator.js`, `taskValidator.js` | Integration test & Web UI sorting | **PASS** |
| **6. Audit Logs** | `AuditLog` model with non-sensitive metadata logging | `backend/src/services/auditService.js`, `schema.prisma` | Audit logging tests & UI modal | **PASS** |
| **7. Role-Based Access Control** | `Role` enum (`USER`, `ADMIN`), `requireRole` middleware | `backend/src/middleware/roleMiddleware.js`, `adminRoutes.js` | 403 Forbidden & 200 Admin tests | **PASS** |
| **8. Push Notifications** | Push token registration & scanner for tasks due tomorrow | `backend/src/services/notificationService.js`, `push_devices` | Device registration & due check test | **PASS** |

---

## 3. Deployment & Standalone Distribution (Environment-Dependent)

| Item | Requirement | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Cloud Production Hosting** | Vercel / Render / Neon | **PENDING** | Configured via environment variables; pending cloud account credentials. |
| **Android Standalone APK** | EAS Cloud Build | **PENDING** | Configured in `eas.json`; pending EAS Cloud trigger. |
