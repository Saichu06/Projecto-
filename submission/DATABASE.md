# Projecto — Database Architecture & Setup Guide

This document details the PostgreSQL relational database architecture, Prisma ORM schema specifications, indexes, migrations, and Entity Relationship design for **Projecto**.

---

## 1. Database Specifications

| Attribute | Specification |
| :--- | :--- |
| **Engine** | PostgreSQL 14+ (Tested on v18.0) |
| **Database Name** | `projecto` |
| **Default Schema** | `public` |
| **ORM / Query Builder** | Prisma ORM `6.4.1` (`@prisma/client`) |
| **Primary Keys** | UUID v4 (`@default(uuid()) @db.Uuid`) |
| **Referential Integrity** | Foreign Key Constraints with Cascade Deletes (`onDelete: Cascade`) |
| **Data Isolation Model** | User-scoped resource ownership queries (`where: { userId }`) |

---

## 2. PostgreSQL Local Setup & Creation

### 2.1 Create the Database
Via `psql` command line:
```sql
psql -U postgres
CREATE DATABASE projecto;
\l
```

### 2.2 Connection String Format
Prisma connects to PostgreSQL using the standard PostgreSQL URI syntax configured in `backend/.env`:
```env
DATABASE_URL="postgresql://<DB_USER>:<DB_PASSWORD>@localhost:5432/projecto?schema=public"
```

---

## 3. Prisma Migrations & Client Generation

All schema alterations and table creations are managed through versioned Prisma migrations located in `backend/prisma/migrations/`.

### 3.1 Apply Existing Migrations to Local DB
```bash
cd backend
npx prisma migrate deploy
```

### 3.2 Generate / Refresh Prisma Client
```bash
npx prisma generate
```

### 3.3 Open Prisma Studio
```bash
npx prisma studio
```
Launches an interactive GUI at `http://localhost:5555` to view, inspect, and verify database rows.

---

## 4. Database Schema Overview

The database comprises five relational tables and four custom enumerations:

### 4.1 Enumerations
1. **`Role`**: `USER`, `ADMIN`
2. **`ProjectStatus`**: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`
3. **`TaskStatus`**: `PENDING`, `IN_PROGRESS`, `COMPLETED`
4. **`TaskPriority`**: `LOW`, `MEDIUM`, `HIGH`

### 4.2 Tables & Models

#### Table 1: `users`
Stores user authentication credentials, role, and account metadata.
- `id` (`UUID`, Primary Key)
- `fullName` (`VARCHAR`, Not Null)
- `email` (`VARCHAR`, Unique, Indexed, Not Null)
- `passwordHash` (`VARCHAR`, Bcrypt Hash, Not Null)
- `role` (`Role`, Default `USER`)
- `createdAt` (`TIMESTAMPTZ`, Default `now()`)
- `updatedAt` (`TIMESTAMPTZ`, Auto-update)

#### Table 2: `projects`
Stores parent project initiatives scoped to an authenticated user.
- `id` (`UUID`, Primary Key)
- `userId` (`UUID`, Foreign Key -> `users.id`, `ON DELETE CASCADE`)
- `name` (`VARCHAR`, Not Null)
- `description` (`TEXT`, Nullable)
- `status` (`ProjectStatus`, Default `NOT_STARTED`)
- `startDate` (`DATE` / `TIMESTAMPTZ`, Nullable)
- `endDate` (`DATE` / `TIMESTAMPTZ`, Nullable)
- `createdAt` (`TIMESTAMPTZ`, Default `now()`)
- `updatedAt` (`TIMESTAMPTZ`, Auto-update)
- *Indexes*: `(userId)`, `(status)`

#### Table 3: `tasks`
Stores actionable tasks belonging to a specific project and user.
- `id` (`UUID`, Primary Key)
- `projectId` (`UUID`, Foreign Key -> `projects.id`, `ON DELETE CASCADE`)
- `userId` (`UUID`, Foreign Key -> `users.id`, `ON DELETE CASCADE`)
- `name` (`VARCHAR`, Not Null)
- `description` (`TEXT`, Nullable)
- `priority` (`TaskPriority`, Default `MEDIUM`)
- `status` (`TaskStatus`, Default `PENDING`)
- `dueDate` (`DATE` / `TIMESTAMPTZ`, Nullable)
- `createdAt` (`TIMESTAMPTZ`, Default `now()`)
- `updatedAt` (`TIMESTAMPTZ`, Auto-update)
- *Indexes*: `(userId)`, `(projectId)`, `(status)`, `(priority)`

#### Table 4: `audit_logs`
Stores non-sensitive records of user and administrative actions.
- `id` (`UUID`, Primary Key)
- `userId` (`UUID`, Foreign Key -> `users.id`, `ON DELETE CASCADE`, Nullable)
- `action` (`VARCHAR`, Not Null)
- `entityType` (`VARCHAR`, Not Null)
- `entityId` (`VARCHAR`, Nullable)
- `metadata` (`JSONB`, Nullable)
- `createdAt` (`TIMESTAMPTZ`, Default `now()`)
- *Indexes*: `(userId)`, `(action)`, `(createdAt)`

#### Table 5: `push_devices`
Stores registered mobile Expo push notification tokens.
- `id` (`UUID`, Primary Key)
- `userId` (`UUID`, Foreign Key -> `users.id`, `ON DELETE CASCADE`)
- `token` (`VARCHAR`, Unique, Not Null)
- `platform` (`VARCHAR`, Nullable)
- `createdAt` (`TIMESTAMPTZ`, Default `now()`)
- `updatedAt` (`TIMESTAMPTZ`, Auto-update)
- *Indexes*: `(userId)`

---

## 5. Complete `schema.prisma` Code

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

enum ProjectStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
}

model User {
  id           String        @id @default(uuid()) @db.Uuid
  fullName     String
  email        String        @unique
  passwordHash String
  role         Role          @default(USER)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  projects     Project[]
  tasks        Task[]
  auditLogs    AuditLog[]
  pushDevices  PushDevice[]

  @@map("users")
}

model Project {
  id          String        @id @default(uuid()) @db.Uuid
  userId      String        @db.Uuid
  name        String
  description String?
  status      ProjectStatus @default(NOT_STARTED)
  startDate   DateTime?
  endDate     DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks       Task[]

  @@index([userId])
  @@index([status])
  @@map("projects")
}

model Task {
  id          String       @id @default(uuid()) @db.Uuid
  projectId   String       @db.Uuid
  userId      String       @db.Uuid
  name        String
  description String?
  priority    TaskPriority @default(MEDIUM)
  status      TaskStatus   @default(PENDING)
  dueDate     DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  project     Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([projectId])
  @@index([status])
  @@index([priority])
  @@map("tasks")
}

model AuditLog {
  id         String   @id @default(uuid()) @db.Uuid
  userId     String?  @db.Uuid
  action     String
  entityType String
  entityId   String?
  metadata   Json?
  createdAt  DateTime @default(now())

  user       User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}

model PushDevice {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  token     String   @unique
  platform  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("push_devices")
}
```
