# Projecto — Comprehensive Setup & Execution Guide

This document provides step-by-step instructions for setting up, configuring, and executing the **Projecto** project & task management system across all components (Backend, Web, and Mobile).

---

## 1. System Prerequisites

Ensure the following tools and runtimes are installed on your host machine:

| Component | Required Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `>= 18.x` (LTS recommended) | JavaScript Runtime |
| **npm** | `>= 9.x` | Package Management |
| **PostgreSQL** | `>= 14.x` (v18 tested) | Relational Database Engine |
| **Git** | `>= 2.x` | Source Control |
| **Expo Go** / **Android SDK** | Latest | Running & testing mobile application |

---

## 2. Repository Structure

```text
Projecto/
├── backend/                  # Express REST API, Prisma ORM, PostgreSQL models
│   ├── prisma/               # Schema, migrations
│   ├── src/                  # Controllers, routes, middleware, services, validators
│   └── tests/                # Unit tests, integration tests, E2E scenarios
├── web/                      # React 19 + Vite Web Application
│   └── src/                  # Components, contexts, pages, services
├── mobile/                   # React Native (Expo SDK 52) Mobile Application
│   └── src/                  # Navigation, screens, secure API client
├── docs/                     # Visual diagrams & ER architecture specs
└── submission/               # Formal documentation & deliverables
```

---

## 3. Database Initialization

1. Start your local PostgreSQL server (via pgAdmin, systemd, or Windows Services).
2. Open a PostgreSQL interactive terminal (`psql`) or pgAdmin query tool and create the database:
   ```sql
   CREATE DATABASE projecto;
   ```
3. Ensure PostgreSQL is accepting connections on `localhost:5432` (or your configured port).

---

## 4. Backend Setup & Local Execution

### 4.1 Install Dependencies
Navigate into the `backend/` directory:
```bash
cd backend
npm install
```

### 4.2 Configure Environment Variables
Copy the `.env.example` template to `.env`:
```bash
cp .env.example .env
```
Ensure `.env` contains your PostgreSQL credentials:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/projecto?schema=public"
JWT_SECRET="super_secret_jwt_key_for_development"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173,http://localhost:3000,http://localhost:19006,exp://localhost:8081"
```

### 4.3 Run Prisma Migrations & Generate Client
Apply all database migrations (including `Role`, `AuditLog`, and `PushDevice` models) and generate the typed Prisma client:
```bash
npx prisma migrate deploy
npx prisma generate
```

### 4.4 Start the Backend Server
```bash
# Development mode with hot-reloading (nodemon)
npm run dev

# Or standard start
npm start
```
The server will start on `http://localhost:5000`.
- Health Check: `http://localhost:5000/health`
- Swagger API Docs: `http://localhost:5000/api-docs`

### 4.5 Run Backend Automated Test Suite (Unit + Integration)
```bash
npm test
```
*Executes all 39 unit and integration tests across 5 test suites.*

---

## 5. Web Frontend Setup & Execution

### 5.1 Install Dependencies
Navigate into the `web/` directory:
```bash
cd ../web
npm install
```

### 5.2 Configure Environment Variables
Copy the `.env.example` template:
```bash
cp .env.example .env
```
Ensure `VITE_API_URL` points to your active backend API:
```env
VITE_API_URL=http://localhost:5000/api
```

### 5.3 Start the Web Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 5.4 Build Web for Production
```bash
npm run build
```
The production bundle will be created in `web/dist/`.

---

## 6. Mobile Application Setup (React Native / Expo)

### 6.1 Install Dependencies
Navigate into the `mobile/` directory:
```bash
cd ../mobile
npm install
```

### 6.2 Configure Environment Variables
Copy the `.env.example` template:
```bash
cp .env.example .env
```
Set the API endpoint:
- **Android Emulator**: `EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api`
- **Physical Device via LAN**: `EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:5000/api`
- **Deployed Backend (Production)**: `EXPO_PUBLIC_API_URL=https://<DEPLOYED_BACKEND_URL>/api` (Marked `PENDING` until cloud deployment is triggered)

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

### 6.3 Start the Expo Development Server
```bash
npx expo start
```
- Press `a` to open in connected Android Emulator / Device.
- Scan the QR code using the **Expo Go** app on your physical mobile device.

---

## 7. Troubleshooting Common Issues

### Issue 1: `P1001: Can't reach database server at localhost:5432`
- **Cause**: PostgreSQL service is stopped or firewall is blocking port 5432.
- **Fix**: Verify PostgreSQL is running via Services (Windows) or `sudo systemctl status postgresql` (Linux/macOS), and check password/user in `DATABASE_URL`.

### Issue 2: `Network request failed` on Mobile
- **Cause**: Physical phone cannot reach `localhost:5000` because `localhost` refers to the phone itself.
- **Fix**: Use your host machine's Wi-Fi IPv4 address (e.g. `http://192.168.1.50:5000/api`) in `mobile/.env`, and verify your phone is on the same local Wi-Fi network.

### Issue 3: `CORS policy error` in Web Browser
- **Cause**: Web app URL is not listed in backend `CORS_ORIGIN`.
- **Fix**: Add your browser URL to `CORS_ORIGIN` in `backend/.env` (comma-separated).

---

## 8. Development Verification Checklist

- [x] PostgreSQL database `projecto` created and active with latest migrations.
- [x] Backend running on port `5000` with 39 passing automated unit + integration tests.
- [x] Swagger documentation reachable at `http://localhost:5000/api-docs`.
- [x] Web frontend reachable at `http://localhost:5173`.
- [x] Mobile app running via Expo SDK with secure authentication token storage.
- [x] Bonus features verified: Unit tests, Integration tests, Pagination, Sorting, Audit logs, RBAC, Push notifications.
