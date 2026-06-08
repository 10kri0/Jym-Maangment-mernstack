# GymHub Project Report

## 1. Project Overview
**GymHub** is a full-stack gym management **admin panel** that allows admins to manage:
- Members (create/update/search/renewal, expiry tracking)
- Plans (pricing and duration management)
- Revenue analytics and metrics
- Reports exported as **PDF** and **Excel**
- Notifications/alerts
- Admin/client management for **superadmin** users
- Dark/Light theme support

### Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Axios, Recharts, React Router, React Hot Toast
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT authentication, bcrypt

### High-level Flow
1. Frontend logs in via `/api/auth/login`.
2. Backend returns a **JWT token**.
3. Frontend stores the token in `localStorage` and sends it as `Authorization: Bearer <token>`.
4. Protected routes validate JWT and return data from MongoDB.

---

## 2. Repository Structure
```text
gym project/
├── backend/        Node.js + Express API
├── frontend/       React + Vite UI
├── docker-compose.yml
└── README.md
```

---

## 3. Backend (backend/)

### 3.1 Backend Entry
- **`backend/server.js`**
  - Configures CORS allowlist from `env.FRONTEND_ORIGINS`.
  - Enables JSON body parsing.
  - Defines health route:
    - `GET /api/health`
  - Mounts routes under:
    - `/api/auth`
    - `/api/dashboard`
    - `/api/members`
    - `/api/plans`
    - `/api/revenue`
    - `/api/reports`
    - `/api/notifications`
    - `/api/admins`
  - Error handling middleware returns a JSON `{ detail }` response.
  - Connects to MongoDB using `connectDB()`.
  - Seeds demo data on startup using `seedDatabase()`.

### 3.2 Backend Configuration (backend/src/config/)
- **`db.js`**: MongoDB connection + DB close helpers.
- **`env.js`**:
  - Loads `.env` from the repository root.
  - Exposes `env` object with:
    - `PORT`
    - `MONGODB_URL`
    - `DATABASE_NAME`
    - `JWT_SECRET`
    - `JWT_EXPIRY_HOURS`
    - `MONGODB_SERVER_SELECTION_TIMEOUT_MS`
    - `FRONTEND_ORIGINS` (CORS allowlist)

### 3.3 Middleware (backend/src/middleware/)
- **`auth.js`**
  - JWT-based authorization utilities.
  - Includes a `requireAdmin` middleware used to protect admin-only endpoints.

### 3.4 Models (backend/src/models/)
MongoDB data schemas using Mongoose:
- **`Admin.js`**: Admin accounts (email/name/password/role).
- **`Member.js`**: Member profile + membership lifecycle.
  - Key fields include:
    - `full_name`, `mobile`, `email`
    - `address`, `branch` (enum includes `Eru`, `Motobajr`)
    - `plan_id` (references `Plan`)
    - `join_date`, `expiry_date` (indexed)
    - `payment_status` (`completed` / `pending`)
    - `amount_paid`
    - `admin_id` (references `Admin`)
- **`Plan.js`**: Plan details (pricing/duration).
- **`Payment.js`**: Tracks payments used in revenue/report calculations.

### 3.5 Routes (backend/src/routes/)
Each file defines an Express router for a domain:
- **`auth.js`**
  - `POST /api/auth/login`
    - Validates email/password.
    - Supports default/legacy admin credentials by upserting.
    - Returns:
      - `access_token`
      - `admin_name`, `admin_email`, `admin_role`
  - `PUT /api/auth/change-password` (protected)
- **`dashboard.js`**: Dashboard statistics endpoints.
- **`members.js`**: Members CRUD + renew logic + filtering.
- **`plans.js`**: Plans CRUD.
- **`revenue.js`**: Revenue charts + metrics endpoints.
- **`reports.js`**: Generates exports (PDF/Excel).
- **`notifications.js`**: Alerts/notifications endpoints.
- **`admins.js`**: Admin/superadmin management.

### 3.6 Utilities (backend/src/utils/)
- `asyncHandler.js`: Wraps async route handlers for consistent error handling.
- `dates.js`: Date computations.
- `formatters.js`: Formatting helpers (currency/date).
- `httpError.js`: Standard error creation helper.
- `seed.js`: Seeds demo data on first run.

---

## 4. Frontend (frontend/)

### 4.1 Frontend Entry + Routing
- **`frontend/src/main.jsx`**: React mount/bootstrap.
- **`frontend/src/App.jsx`**
  - Wraps the app with:
    - `BrowserRouter`
    - `ThemeProvider`
    - `AuthProvider`
    - `Toaster` (top-right notifications)
  - Role-based routing:
    - If `adminRole === 'superadmin'`:
      - `/admins`, `/settings`
    - Otherwise:
      - `/` (dashboard), `/members`, `/plans`, `/revenue`, `/reports`, `/notifications`, `/settings`
  - Uses `ProtectedRoute` + `Layout` to guard pages.

### 4.2 Theme and Auth Context
- **`frontend/src/context/AuthContext.jsx`**
  - Stores token and admin details in `localStorage`:
    - `gym_admin_token`
    - `gym_admin_name`
    - `gym_admin_email`
    - `gym_admin_role`
  - Exposes:
    - `login(email, password)` → calls backend `/auth/login`
    - `logout()` → clears localStorage + state
- **`frontend/src/context/ThemeContext.jsx`**
  - Manages dark/light mode and provides `toggleTheme()`.

### 4.3 Shared Utilities
- **`frontend/src/utils/api.js`**
  - Creates an Axios instance with base URL determined by:
    - `import.meta.env.VITE_API_URL`
    - fallback: `http(s)://<current-host>:8000/api`
  - Adds JWT token into request headers.
  - Global 401 handling:
    - clears stored auth
    - redirects user to `/login`

### 4.4 UI Components
- **`frontend/src/components/Layout.jsx`**
  - Main application shell:
    - Sidebar + top bar + page content area
    - Mobile sidebar overlay
    - Mobile bottom navigation
  - Navigation items vary by role (`superadmin` vs normal admin).
  - Includes theme toggle and logout.
- **`ProtectedRoute.jsx`**: blocks access to pages without auth.
- **`Modal.jsx`**: reusable modal component.
- **`KPICard.jsx`**: dashboard KPI card component.

### 4.5 Pages (frontend/src/pages/)
- **`Login.jsx`**
  - Email/password form UI
  - Uses `useAuth().login()` and displays error state
  - Redirects authenticated users away from `/login`
- **`Dashboard.jsx`**: KPI dashboard and charts.
- **`Members.jsx`**: member management UI.
- **`Plans.jsx`**: plan management UI.
- **`Revenue.jsx`**: revenue charts/metrics UI.
- **`Reports.jsx`**: report generation UI.
- **`Notifications.jsx`**: notifications UI.
- **`Admins.jsx`**: superadmin client/admin management UI.
- **`Settings.jsx`**: settings UI (including password change, theme preference, etc.).

---

## 5. Environment Variables

### Backend (.env)
Key variables:
- `MONGODB_URL`
- `DATABASE_NAME`
- `JWT_SECRET`
- `JWT_EXPIRY_HOURS`
- `FRONTEND_ORIGINS`
- `PORT`

### Frontend (.env)
- `VITE_API_URL` (optional)

---

## 6. Docker Support
- **`docker-compose.yml`** runs frontend + backend + MongoDB.
- Backend and frontend Dockerfiles exist:
  - `backend/Dockerfile`
  - `frontend/Dockerfile`

---

## 7. API Surface (high-level)
Base URL: `http://localhost:8000/api`

- Auth
  - `POST /api/auth/login`
  - `PUT /api/auth/change-password`
- Dashboard
  - `GET /api/dashboard/stats` (metrics)
- Members
  - `GET/POST /api/members`
  - `GET/PUT/DELETE /api/members/:id`
  - `POST /api/members/:id/renew`
- Plans
  - `GET/POST /api/plans`
  - `GET/PUT/DELETE /api/plans/:id`
- Revenue
  - `GET /api/revenue/:period`
  - `GET /api/revenue/metrics`
- Reports
  - `GET /api/reports/:type/:format`
- Notifications
  - `GET /api/notifications`

---

## 8. Conclusion
GymHub is a modular full-stack admin panel using role-based routing on the frontend and JWT-protected endpoints on the backend. The backend organizes features via routes and models, while the frontend uses context providers for authentication and theme handling.

