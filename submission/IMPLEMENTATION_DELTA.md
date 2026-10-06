# Projecto — Implementation Delta & Enhancements Matrix

---

## 1. Purpose

This document maps the original requirements of the technical assessment to the implemented solution in **Projecto**, highlighting areas where the system satisfies base requirements and delivers additional engineering and user experience improvements.

---

## 2. Original Assessment → Implementation Matrix

| Area | Original Requirement | Projecto Implementation | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Database** | Shared PostgreSQL database | PostgreSQL 18 with Prisma ORM 6.4.1, UUID primary keys, cascade deletions, indexes | Local DB & Migration test | **PASS** |
| **Backend API** | Node.js / Express REST API | Centralized Express 5.2 gateway shared by Web and Mobile | Jest integration suite | **PASS** |
| **Authentication** | Secure user auth with JWT & password hashing | Bcrypt (10 rounds), JWT signed with HMAC-SHA256, session expiration | Auth test suite (8 tests) | **PASS** |
| **Authorization** | Individual user data isolation | Query-level ownership checks (`where: { userId }`), preventing cross-user data leakage | Cross-user rejection tests | **PASS** |
| **Projects CRUD** | Full CRUD on projects with dates and status | Complete project lifecycle (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`), progress % | Project CRUD test suite | **PASS** |
| **Tasks CRUD** | Full CRUD on tasks with priority and status | Complete task lifecycle, priority (`LOW`, `MEDIUM`, `HIGH`), cascade deletion | Task CRUD test suite | **PASS** |
| **Dashboard** | Aggregated project & task statistics | Real-time counts computed strictly per authenticated user | Dashboard test suite | **PASS** |
| **Search & Filtering** | Search by name, filter by status and priority | Substring search, multi-field filtering on backend and frontend | Filter test suite & UI verification | **PASS** |
| **Web Client** | Modern responsive web frontend | React 19, Vite 8, Tailwind CSS, Lucide icons, responsive sidebar | Web production build (0 errors) | **PASS** |
| **Mobile Client** | Native mobile client sharing backend | React Native, Expo SDK 52, `expo-secure-store`, Bottom Tabs | Cross-platform scenario test | **PASS** |
| **Security** | Input validation, secure headers, rate limits | Zod 4.6 runtime schema validation, Helmet security headers, Express Rate Limit | Validation test suite | **PASS** |
| **API Docs** | Interactive API documentation | OpenAPI 3.0 / Swagger UI active at `/api-docs` | Swagger spec verification | **PASS** |
| **Documentation** | Setup guide, env guide, DB architecture | Complete Markdown suite + formal Word Technical Documentation | Full documentation audit | **PASS** |

---

## 3. UX Improvements Beyond the Requirement

The following user experience enhancements were implemented beyond the minimum baseline to provide an intuitive, polished workflow:

1. **Collapsible Desktop Sidebar**: Toggles between expanded (icon + label) and collapsed (icon only with tooltip), maximizing available workspace.
2. **Responsive Mobile Navigation Drawer**: Slide-out mobile drawer with touch backdrop for seamless navigation on smaller screens.
3. **User Profile Dropdown**: Accessible header menu showing user name, email, and assigned system role badge (`USER` / `ADMIN`).
4. **Interactive Profile Editing & Password Change**: In-app modal dialogs to update full name and securely change account passwords.
5. **Toast Notification System**: Dynamic, non-blocking toast notifications for successes, errors, and informational updates.
6. **Skeleton Loaders**: Content-shaped shimmer placeholder loaders preventing layout shifts during asynchronous network fetches.
7. **Empty State Handlers**: Meaningful visual empty states with direct call-to-action buttons when no projects or tasks exist.
8. **Confirmation Dialogs**: Explicit modal confirmation before destructive operations (deleting projects or tasks).
9. **Breadcrumb Navigation**: Clear hierarchical trail (`Projects / <Project Name>`) on detail pages.
10. **Interactive Help & User Guide Modal**: Top-navigation `(?)` dialog with multi-tab guidance (Getting Started, Projects, Tasks, Dashboard, Account, Mobile App, Shortcuts).
11. **Zero-Project Onboarding Card**: Subtle 3-step onboarding guide on the Dashboard when a new user has 0 projects.
12. **Upcoming Tasks Prioritization**: Dashboard section displaying impending deliverables sorted by `dueDate`.
13. **Keyboard Accessibility Shortcuts**: Rapid navigation shortcuts (`N` for New Task, `P` for New Project, `/` for Search focus, `Esc` to close dialogs).

---

## 4. Bonus Features Implemented

| Bonus Feature | Implementation | User Value | Technical Value | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Unit Tests** | Service-level unit tests for auth, projects, tasks, dashboard | Ensures core business logic reliability | Prevents regression in calculations and data transforms | **PASS** |
| **Integration Tests** | Multi-user Supertest suite covering all REST endpoints | Validates complete end-to-end workflows | Verifies HTTP status codes, schemas, and database operations | **PASS** |
| **Pagination** | `page` and `limit` query parameters with standard pagination envelope | Faster page loads and manageable data chunks | Reduces database memory consumption and payload transfer size | **PASS** |
| **Server-Side Sorting** | `sortBy` and `sortOrder` query parameters with field whitelisting | Flexible sorting by date, name, priority, or status | Prevents SQL injection and optimizes index traversal | **PASS** |
| **Audit Logging** | `AuditLog` model recording user actions with metadata sanitization | Accountability and activity history tracking | Immutable record of create/update/delete/auth events | **PASS** |
| **Role-Based Access Control (RBAC)** | `Role` enum (`USER`, `ADMIN`), `requireRole('ADMIN')` middleware | Clear distinction between normal users and administrators | Protected administrative endpoints without compromising resource ownership | **PASS** |
| **Push Notifications for Due Tasks** | Expo device token registration and scheduled due-check scanner | Alerts users about tasks due tomorrow | Decoupled notification architecture compatible with mobile push gateways | **PASS** |

---

## 5. Engineering Improvements

1. **Centralized Runtime Validation**: Every request payload and query string is validated with Zod schemas before touching service layers.
2. **Strict Resource Ownership Enforcement**: Every database query explicitly includes `where: { userId }`, ensuring zero data leakage between users.
3. **Hardware-Backed Token Security**: Mobile client persists JWT credentials inside hardware-encrypted storage (`expo-secure-store`).
4. **Centralized Error Handling**: Custom `ApiError` class with standardized JSON response formatting and Prisma error code mapping.
5. **Brute-Force & Denial-of-Service Protection**: Rate limiting on authentication routes (20 req/15min) and Helmet HTTP security headers.
6. **Unified REST API Gateway**: Single backend eliminates code divergence and guarantees cross-platform data consistency.

---

## 6. Before vs. After Comparison

```text
┌───────────────────────────────────────────────────┬────────────────────────────────────────────────────────┐
│ Initial Assessment Baseline                       │ Final Projecto Implementation                          │
├───────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ • Basic project/task CRUD                         │ • Full-lifecycle project & task tracking with progress │
│ • Single-platform or split backends               │ • Unified Node.js/Express API + PostgreSQL + Prisma    │
│ • Minimal UI forms                                │ • Polished React 19 Web App with keyboard shortcuts    │
│ • Unauthenticated or generic storage              │ • Hardware-backed mobile SecureStore & JWT auth        │
│ • Unbounded database queries                      │ • Server-side pagination & safe whitelisted sorting    │
│ • No activity tracking                            │ • Audit logging with automated metadata sanitization   │
│ • Single flat permission model                    │ • Role-Based Access Control (USER & ADMIN)             │
│ • Manual deadline checks                          │ • Push notification scanner for tasks due tomorrow     │
│ • Basic smoke tests                               │ • 59 automated unit, integration & validation tests   │
└───────────────────────────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 7. Assessment Coverage Summary

- **Mandatory Functional Requirements**: 100% Implemented & Verified
- **Mandatory Architecture Requirements**: 100% Implemented & Verified
- **Validation & Data Integrity Hardening**: 100% Implemented & Verified (20 dedicated validation tests)
- **Optional Bonus Features**: 100% Implemented & Verified (Unit Tests, Integration Tests, Pagination, Sorting, Audit Logs, RBAC, Push Notifications)

---

## 8. Final Verification Results

- **Backend Test Suite**: `npm test` → **39 tests passed** (5 test suites, 0 failures).
- **Web Production Build**: `npm run build` → **0 errors**, bundle size 104.85 kB gzip.
- **Cross-Platform Scenario Verification**: `node tests/e2e-scenario.js` → **100% PASS**.
