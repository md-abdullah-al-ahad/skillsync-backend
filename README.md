# SkillSync Backend 🚀

> **RESTful API powering [SkillSync](https://skillsync-portal.vercel.app)** — a full-stack platform connecting learners with expert tutors. Built with Express 5, TypeScript, Prisma 7, and Better Auth.

🔗 **Live API:** [skillsync-api.vercel.app](https://skillsync-api.vercel.app)  
🔗 **Live Client:** [skillsync-portal.vercel.app](https://skillsync-portal.vercel.app)  
📂 **Frontend Repo:** [skillsync-client](../skillsync-client)

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Seeding](#-database-seeding)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)

---

## ✨ Features

| Area                        | Highlights                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| **Authentication**          | Email/password + Google OAuth via Better Auth, email verification with SMTP, session-based auth |
| **Role-Based Access**       | Three roles (Student, Tutor, Admin) with middleware-level enforcement                           |
| **Tutor Discovery**         | Public search & filter by category, price range, rating, keyword                                |
| **Booking Workflow**        | Instant booking → CONFIRMED → COMPLETED / CANCELLED with conflict detection                     |
| **Reviews & Ratings**       | Students review completed sessions; auto-aggregated tutor ratings                               |
| **Availability Management** | Tutors set weekly time slots (day + start/end time); CRUD operations                            |
| **Admin Dashboard API**     | User management (ban/unban), platform stats, booking oversight, category CRUD                   |
| **Database Seeding**        | One-command seed script for admin user + default subject categories                             |

---

## 🛠 Tech Stack

| Layer     | Technology              | Version |
| --------- | ----------------------- | ------- |
| Runtime   | Node.js                 | 20+     |
| Framework | Express                 | 5.x     |
| Language  | TypeScript              | 5.9     |
| Database  | PostgreSQL              | 15+     |
| ORM       | Prisma                  | 7.3     |
| Auth      | Better Auth             | 1.4     |
| Email     | Nodemailer + Gmail SMTP | —       |
| Build     | tsup                    | 8.x     |
| Deploy    | Vercel (Serverless)     | —       |

---

## 🏗 Architecture

```
Client (Next.js)
    │
    ▼
Express API (this repo)
    │
    ├── Better Auth ──────► /api/auth/* (sign-up, sign-in, OAuth, email verify)
    │
    ├── Auth Middleware ───► Session validation + role guard + ban check
    │
    ├── Modules ──────────► /api/tutors, /api/bookings, /api/reviews, ...
    │
    └── Prisma ORM ───────► PostgreSQL
```

### Request Flow

1. Client sends request with session cookie
2. Auth middleware validates session via Better Auth
3. Middleware checks email verification → user status (banned?) → role permission
4. Controller validates request body
5. Service layer executes business logic via Prisma
6. JSON response returned

---

## 📊 Database Schema

```
┌──────────┐       ┌──────────────┐       ┌───────────┐
│   User   │──1:1──│ TutorProfile │──M:N──│ Category  │
│          │       │              │       │           │
│ role     │       │ bio          │       │ name      │
│ status   │       │ hourlyRate   │       │ slug      │
│ phone    │       │ ratingAvg    │       └───────────┘
└──────────┘       │ ratingCount  │
     │             └──────────────┘
     │ 1:M               │ 1:M
     ▼                    ▼
┌──────────┐       ┌──────────────────┐
│ Booking  │       │ AvailabilitySlot │
│          │       │                  │
│ status   │       │ dayOfWeek        │
│ price    │       │ startTime        │
│ start/end│       │ endTime          │
└──────────┘       └──────────────────┘
     │ 1:1
     ▼
┌──────────┐
│  Review  │
│          │
│ rating   │
│ comment  │
└──────────┘
```

### Models

| Model                                  | Purpose                                  | Key Fields                                                    |
| -------------------------------------- | ---------------------------------------- | ------------------------------------------------------------- |
| `User`                                 | All platform users                       | `role` (STUDENT / TUTOR / ADMIN), `status` (ACTIVE / BANNED)  |
| `TutorProfile`                         | Tutor-specific data (1:1 with User)      | `bio`, `hourlyRate`, `experience`, `ratingAvg`, `ratingCount` |
| `Category`                             | Subject categories                       | `name`, `slug`                                                |
| `TutorCategory`                        | Many-to-many join (Tutor ↔ Category)     | composite PK                                                  |
| `AvailabilitySlot`                     | Weekly time slots per tutor              | `dayOfWeek`, `startTime`, `endTime`                           |
| `Booking`                              | Session between student & tutor          | `status` (CONFIRMED → COMPLETED / CANCELLED), `price`         |
| `Review`                               | Post-session feedback (1:1 with Booking) | `rating` (1–5), `comment`                                     |
| `Session` / `Account` / `Verification` | Better Auth internals                    | Managed by Better Auth                                        |

### Booking Status Flow

```
                      ┌─────────────┐
                      │  CONFIRMED  │  ← Created instantly
                      │  (default)  │
                      └──────┬──────┘
                       ╱            ╲
                 (tutor marks)   (student cancels)
                     ╱                ╲
              ┌───────────┐    ┌───────────┐
              │ COMPLETED │    │ CANCELLED │
              └───────────┘    └───────────┘
```

---

## 📡 API Reference

Base URL: `/api`

### 🔐 Authentication (Better Auth)

| Method | Endpoint                   | Description                               |
| ------ | -------------------------- | ----------------------------------------- |
| POST   | `/api/auth/sign-up/email`  | Register with email, password, name, role |
| POST   | `/api/auth/sign-in/email`  | Login with email & password               |
| GET    | `/api/auth/get-session`    | Get current session                       |
| POST   | `/api/auth/sign-out`       | Logout                                    |
| POST   | `/api/auth/sign-in/social` | Google OAuth login                        |
| GET    | `/api/auth/verify-email`   | Verify email token                        |

### 👤 User Profile

| Method | Endpoint            | Auth   | Description                                         |
| ------ | ------------------- | ------ | --------------------------------------------------- |
| GET    | `/api/user/me`      | ✅ Any | Get current user with tutor profile (if applicable) |
| PUT    | `/api/user/profile` | ✅ Any | Update name and/or phone                            |

### 🔍 Tutor Discovery (Public)

| Method | Endpoint          | Auth | Description                                                                           |
| ------ | ----------------- | ---- | ------------------------------------------------------------------------------------- |
| GET    | `/api/tutors`     | ❌   | Browse tutors — query: `?category`, `?minPrice`, `?maxPrice`, `?minRating`, `?search` |
| GET    | `/api/tutors/:id` | ❌   | Tutor detail (profile, categories, availability, top reviews)                         |

### 📚 Tutor Management

| Method | Endpoint                      | Auth     | Description                                    |
| ------ | ----------------------------- | -------- | ---------------------------------------------- |
| GET    | `/api/tutor/profile/me`       | ✅ Tutor | Own profile with stats (sessions, earnings)    |
| PUT    | `/api/tutor/profile`          | ✅ Tutor | Update bio, hourlyRate, experience, categories |
| GET    | `/api/tutor/availability`     | ✅ Tutor | List own availability slots                    |
| POST   | `/api/tutor/availability`     | ✅ Tutor | Add a single availability slot                 |
| PUT    | `/api/tutor/availability`     | ✅ Tutor | Bulk-replace all slots                         |
| DELETE | `/api/tutor/availability/:id` | ✅ Tutor | Delete a single slot                           |

### 🎓 Student

| Method | Endpoint                | Auth       | Description                |
| ------ | ----------------------- | ---------- | -------------------------- |
| GET    | `/api/student/profile`  | ✅ Student | Profile with booking stats |
| PUT    | `/api/student/profile`  | ✅ Student | Update name / phone        |
| GET    | `/api/student/bookings` | ✅ Student | Filterable booking list    |

### 📅 Bookings

| Method | Endpoint            | Auth       | Description                                                      |
| ------ | ------------------- | ---------- | ---------------------------------------------------------------- |
| POST   | `/api/bookings`     | ✅ Student | Create booking (validates conflicts, prevents self-booking)      |
| GET    | `/api/bookings`     | ✅ Any     | Role-aware booking list (students see theirs, tutors see theirs) |
| GET    | `/api/bookings/:id` | ✅ Any     | Booking detail (authorized parties only)                         |
| PATCH  | `/api/bookings/:id` | ✅ Any     | Update status — body: `{ "status": "COMPLETED" \| "CANCELLED" }` |

### ⭐ Reviews

| Method | Endpoint                             | Auth       | Description                                                 |
| ------ | ------------------------------------ | ---------- | ----------------------------------------------------------- |
| POST   | `/api/reviews`                       | ✅ Student | Create review (only for own COMPLETED bookings, rating 1–5) |
| GET    | `/api/reviews/tutor/:tutorProfileId` | ❌         | Paginated tutor reviews                                     |
| GET    | `/api/reviews/:id`                   | ❌         | Review detail                                               |

### 📁 Categories

| Method | Endpoint              | Auth     | Description                                |
| ------ | --------------------- | -------- | ------------------------------------------ |
| GET    | `/api/categories`     | ❌       | All categories with tutor count            |
| GET    | `/api/categories/:id` | ❌       | Single category                            |
| POST   | `/api/categories`     | ✅ Admin | Create category (name + slug)              |
| PUT    | `/api/categories/:id` | ✅ Admin | Update category                            |
| DELETE | `/api/categories/:id` | ✅ Admin | Delete category (fails if tutors assigned) |

### 🛡 Admin

| Method | Endpoint               | Auth     | Description                                                   |
| ------ | ---------------------- | -------- | ------------------------------------------------------------- |
| GET    | `/api/admin/users`     | ✅ Admin | Paginated user list — query: `?role`, `?status`, `?search`    |
| PATCH  | `/api/admin/users/:id` | ✅ Admin | Ban / unban — body: `{ "status": "ACTIVE" \| "BANNED" }`      |
| GET    | `/api/admin/bookings`  | ✅ Admin | All bookings — query: `?status`                               |
| GET    | `/api/admin/stats`     | ✅ Admin | Platform analytics (users, bookings, revenue, recent signups) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- pnpm (recommended)
- Gmail App Password (for email verification)
- Google OAuth credentials (optional, for social login)

### Installation

```bash
# Clone & navigate
git clone <repo-url>
cd skillsync-backend

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values (see below)

# Run database migrations
pnpm prisma migrate dev

# Seed admin user + default categories
npx prisma db seed

# Start development server
pnpm dev
```

The server will be running at `http://localhost:3000`.

---

## 🔑 Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/skillsync?schema=public"

# Better Auth
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="your-random-secret-key"

# Application
APP_URL="http://localhost:3000"    # Frontend origin (for CORS + email links)
NODE_ENV="development"

# Email (Gmail SMTP)
APP_USER="your-email@gmail.com"
APP_PASS="your-16-character-app-password"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

| Variable                  | Purpose                                                      |
| ------------------------- | ------------------------------------------------------------ |
| `DATABASE_URL`            | PostgreSQL connection string                                 |
| `BETTER_AUTH_SECRET`      | Secret for session signing                                   |
| `APP_URL`                 | Frontend origin — used for CORS and email verification links |
| `BETTER_AUTH_URL`         | Backend URL for Better Auth                                  |
| `APP_USER` / `APP_PASS`   | Gmail SMTP credentials for sending verification emails       |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth credentials                                     |

---

## 🌱 Database Seeding

```bash
npx prisma db seed
```

This seeds:

| Data           | Details                                                                             |
| -------------- | ----------------------------------------------------------------------------------- |
| **Admin User** | `admin@skillsync.com` / `Admin@123` (email pre-verified, role = ADMIN)              |
| **Categories** | Mathematics, Physics, Chemistry, Biology, English, Computer Science, History, Music |

> ⚠️ **Change the admin password** after first login in production.

---

## ☁️ Deployment

Deployed on **Vercel** as a serverless function.

```bash
# Build for production
pnpm build

# Deploy
vercel --prod
```

The `vercel.json` routes all requests to `api/server.mjs`. The build step generates the Prisma client and bundles the app with tsup.

---

## 📂 Project Structure

```
skillsync-backend/
├── prisma/
│   ├── schema.prisma          # Database schema (10 models, 4 enums)
│   ├── seed.ts                # Admin + category seed script
│   └── migrations/            # Migration history
├── src/
│   ├── server.ts              # Entry point — starts Express
│   ├── app.ts                 # Express app, middleware, route registration
│   ├── lib/
│   │   ├── auth.ts            # Better Auth config (OAuth, email, hooks)
│   │   └── prisma.ts          # Prisma client singleton
│   ├── middleware/
│   │   └── auth.ts            # Session validation + role guard + ban check
│   └── modules/
│       ├── admin/             # Admin: users, bookings, stats
│       ├── auth/              # User profile (me, update)
│       ├── booking/           # CRUD + status workflow
│       ├── category/          # CRUD (public read, admin write)
│       ├── review/            # Create + list by tutor
│       ├── student/           # Student profile + bookings
│       └── tutor/             # Profile, availability, public discovery
├── api/
│   └── server.mjs             # Production build output (Vercel entry)
├── package.json
├── tsconfig.json
└── vercel.json
```

Each module follows **Controller → Service → Prisma** pattern:

- **Routes** define endpoints and attach middleware
- **Controller** validates input and sends responses
- **Service** contains business logic and database queries

---

## 📜 Scripts

| Command                   | Description                                  |
| ------------------------- | -------------------------------------------- |
| `pnpm dev`                | Start dev server with hot-reload (tsx watch) |
| `pnpm build`              | Generate Prisma client + bundle with tsup    |
| `pnpm prisma migrate dev` | Run pending migrations                       |
| `pnpm prisma studio`      | Open Prisma Studio (database GUI)            |
| `npx prisma db seed`      | Seed admin user + categories                 |

---

## 🤝 Related

- **Frontend:** [skillsync-client](../skillsync-client) — Next.js 16, React 19, shadcn/ui
- **Live Site:** [skillsync-portal.vercel.app](https://skillsync-portal.vercel.app)
- **Live API:** [skillsync-api.vercel.app](https://skillsync-api.vercel.app)
