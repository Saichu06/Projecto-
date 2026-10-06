# Projecto — Vercel Deployment & Serverless Architecture Guide

This guide documents the technical configuration, architecture audit, and deployment instructions for deploying both the **Projecto Web Frontend** and **Projecto Express Backend API** on **Vercel Serverless Functions**.

---

## 1. Vercel Architecture Overview

```
+-------------------------------------------------------------+
|                      VERCEL PLATFORM                        |
|                                                             |
|   +--------------------------+   +----------------------+   |
|   |   Projecto Web Frontend  |   | Projecto Express API |   |
|   |      (Vite + React 19)   |   | (Node.js Serverless) |   |
|   |   projecto-web.vercel.app|   | projecto-api.vercel  |   |
|   +--------------------------+   +----------------------+   |
|                |                             |              |
+----------------|-----------------------------|--------------+
                 | HTTPS API Calls             |
                 v                             v
+-------------------------------------------------------------+
|           Managed Cloud PostgreSQL (Neon / Supabase)        |
|             (Connection Pooling with PgBouncer)             |
+-------------------------------------------------------------+
```

- **Web Frontend**: Built as static SPA bundle using Vite (`dist/`), deployed on Vercel Edge Network with client-side SPA routing (`/* -> /index.html`).
- **Backend API**: Deployed as Vercel Serverless Function (`api/index.js`), routing all incoming requests (`/(.*)`) through the unified Express 5.2 application.
- **Database Layer**: External cloud-managed PostgreSQL instance (e.g. Neon, Supabase, Railway, RDS) accessed via Prisma ORM with connection pooling.

---

## 2. Serverless Compatibility Audit Checklist

| Component | Audit Result | Serverless Considerations & Solutions |
| :--- | :--- | :--- |
| **Express App Initialization** | **COMPATIBLE** | `app.js` is cleanly decoupled from `server.js`. `app.js` exports the `app` instance without calling `app.listen()`. |
| **`app.listen()` Usage** | **COMPATIBLE** | Isolated solely in `server.js` for local development; serverless handler uses `api/index.js` which exports Express directly. |
| **Server Entry Point** | **COMPATIBLE** | Created `backend/api/index.js` and `backend/vercel.json` rewrite routing. |
| **Prisma Initialization** | **COMPATIBLE** | Cached on `global.__projecto_prisma` in `backend/src/config/db.js` to reuse connection pools across hot lambda invocations. |
| **Prisma Generation on Build**| **COMPATIBLE** | Added `"postinstall": "prisma generate"` and `"build": "prisma generate"` to `backend/package.json`. |
| **PostgreSQL Connections** | **COMPATIBLE** | Recommended to use pooled connection string (`pgbouncer=true` on Neon/Supabase) to handle serverless scale. |
| **JWT Authentication** | **COMPATIBLE** | Stateless HMAC-SHA256 signature verification via HTTP `Authorization: Bearer <token>` header. Zero session memory. |
| **CORS Configuration** | **COMPATIBLE** | Configurable via `CORS_ORIGIN` environment variable (comma-separated list of allowed domains). |
| **Swagger UI (`/api-docs`)** | **COMPATIBLE** | Built using in-memory JSON spec (`swagger-jsdoc`), CSP configured in Helmet for seamless asset rendering. |
| **Rate Limiting** | **COMPATIBLE** | `express-rate-limit` operates per serverless instance in memory. |
| **Audit Logging** | **COMPATIBLE** | Fully persisted to PostgreSQL `audit_logs` table via Prisma with automated metadata sanitization. |
| **Static File Storage** | **COMPATIBLE** | Backend does not rely on local filesystem storage; assets are bundled inside the web client. |
| **Background Schedulers** | **COMPATIBLE** | Due-tomorrow task scanner is exposed as on-demand REST endpoint (`POST /api/notifications/trigger-due-check`), compatible with Vercel Cron. |

---

## 3. Step-by-Step Deployment Instructions

### Project 1: Deploy Backend API on Vercel

1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your Git repository (`Projecto`).
4. Set **Root Directory** to `backend`.
5. Configure the Build & Development Settings:
   - **Framework Preset**: `Other`
   - **Build Command**: `npm run build` (runs `prisma generate`)
   - **Output Directory**: Leave default
   - **Install Command**: `npm install`
6. Add the following **Environment Variables**:
   - `DATABASE_URL`: `postgresql://USER:PASSWORD@HOST:5432/projecto?sslmode=require` (Pooled connection recommended)
   - `JWT_SECRET`: Secure 64-character random string
   - `JWT_EXPIRES_IN`: `7d`
   - `CORS_ORIGIN`: `https://your-web-project.vercel.app,http://localhost:5173`
   - `NODE_ENV`: `production`
7. Click **Deploy**.
8. Verify the deployment:
   - Health check: `https://your-backend-project.vercel.app/api/health`
   - Swagger docs: `https://your-backend-project.vercel.app/api-docs`

---

### Project 2: Deploy React Web Frontend on Vercel

1. In the Vercel Dashboard, click **Add New...** → **Project**.
2. Select the same repository (`Projecto`).
3. Set **Root Directory** to `web`.
4. Configure Build Settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Add the following **Environment Variable**:
   - `VITE_API_URL`: `https://your-backend-project.vercel.app/api`
6. Click **Deploy**.
7. Once deployed, copy your web project's production URL (e.g. `https://projecto-web.vercel.app`) and update `CORS_ORIGIN` in the Backend project's environment variables.

---

## 4. Configuration Files Summary

### `backend/vercel.json`
```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api/index.js"
    }
  ]
}
```

### `backend/api/index.js`
```javascript
const app = require('../src/app');

module.exports = app;
```

### `web/vercel.json`
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 5. Known Deployment Limitations & Best Practices

1. **Database Connection Limits (Cold Starts)**:
   - When deploying to serverless platforms, multiple lambda instances may spin up simultaneously during traffic spikes.
   - **Recommendation**: Use a PostgreSQL provider with a built-in connection pooler (e.g. Neon with pooled endpoint, Supabase with PgBouncer, or AWS RDS Proxy).
2. **In-Memory Rate Limiting**:
   - `express-rate-limit` maintains counters in the memory of individual serverless function containers.
   - For strict global rate limiting across hundreds of ephemeral lambda instances, an external store like Redis/Upstash can be connected.
3. **Execution Time Limits**:
   - Vercel Serverless Functions have a default 10s (Hobby) or 60s (Pro) execution timeout. All Projecto REST endpoints are lightweight database queries and respond in under 50ms.
4. **Prisma Migrations**:
   - Database migrations (`prisma migrate deploy`) should be executed during CI/CD or from a local deployment terminal against the production database, rather than during serverless function runtime.
