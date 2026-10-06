# Projecto — Environment Variables Specification

This document details all configuration and environment variables across the **Backend**, **Web**, and **Mobile** components.

---

## 1. Backend (`backend/.env`)

The backend requires the following configuration keys to manage network binding, PostgreSQL connection pooling, JSON Web Token issuance, CORS origins, and optional notification scheduling.

| Variable Name | Type | Example / Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | `Number` | `5000` | No (default: 5000) | Port on which the Express server listens. |
| `NODE_ENV` | `String` | `development` / `production` | No (default: development) | Node environment runtime mode. |
| `DATABASE_URL` | `String` | `postgresql://<user>:<password>@localhost:5432/projecto?schema=public` | **Yes** | Standard PostgreSQL connection URI used by Prisma ORM. |
| `JWT_SECRET` | `String` | `your_secure_jwt_secret_phrase_here` | **Yes** | Secret cryptographic key used to sign and verify HMAC-SHA256 JWT tokens. |
| `JWT_EXPIRES_IN` | `String` | `7d` | No (default: 7d) | Expiration timeframe for authentication tokens. |
| `CORS_ORIGIN` | `String` | `http://localhost:5173,http://localhost:3000,exp://localhost:8081` | No | Comma-separated list of allowed origin headers for cross-origin browser requests. |

### Backend `.env.example` Template
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/projecto?schema=public"
JWT_SECRET="replace_with_a_secure_random_string_in_production"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173,http://localhost:3000,http://localhost:19006,exp://localhost:8081"
```

---

## 2. Web Frontend (`web/.env`)

The React + Vite web client uses Vite's prefixed environment variables (`VITE_`).

| Variable Name | Type | Example / Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_API_URL` | `String` | `http://localhost:5000/api` | **Yes** | Base endpoint URL of the backend REST API gateway. |

### Web `.env.example` Template
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 3. Mobile Client (`mobile/.env`)

The React Native Expo client uses Expo's public environment variables (`EXPO_PUBLIC_`).

| Variable Name | Type | Example / Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `EXPO_PUBLIC_API_URL` | `String` | `http://localhost:5000/api` | **Yes** | Target REST API endpoint for mobile HTTP communication. |

### Configuration Rules for Mobile Environments:
1. **Android Emulator (Local)**:
   ```env
   EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api
   ```
2. **Physical Device via Wi-Fi LAN (Local)**:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
   ```
3. **Production / Cloud Deployed Backend**:
   ```env
   EXPO_PUBLIC_API_URL=https://<DEPLOYED_BACKEND_URL>/api
   ```
   *(Marked `PENDING` until remote hosting deployment is executed)*

### Mobile `.env.example` Template
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 4. Security & Best Practices

- **Never commit `.env` files**: All `.env` files are explicitly listed in `.gitignore`.
- **Secret Management**: Passwords, connection strings, and production JWT secrets must be provisioned through secure environment secret injectors in cloud deployments.
