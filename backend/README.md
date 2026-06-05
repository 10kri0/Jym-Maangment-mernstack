# GymPro Backend

GymPro Backend is an Express + MongoDB API that powers the GymPro admin dashboard.

## What It Does

- Handles admin login with JWT
- Serves dashboard stats, members, plans, revenue, reports, and notifications
- Seeds demo data on first run
- Falls back to temporary in-memory MongoDB in local development if the main database is unreachable

## Stack

- Node.js
- Express
- Mongoose
- JWT
- MongoDB

## Setup

Install dependencies:

```bash
npm install
```

Run in development:

```bash
npm run dev
```

Run in production mode:

```bash
npm start
```

## Environment Variables

The backend reads the root `.env` file.

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=gym_management
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRY_HOURS=24
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000
FRONTEND_ORIGINS=http://localhost:5173,https://mygymhub.vercel.app
```

## Default Seeded Logins

```text
Superadmin: superadmin@gym.com / superadmin123
Client admin: admin@am.com / 123
```

## Main Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/login` | Admin login |
| GET | `/api/dashboard/stats` | KPI and chart data |
| GET/POST | `/api/members` | Member list and create |
| GET/PUT/DELETE | `/api/members/{id}` | Member CRUD |
| POST | `/api/members/{id}/renew` | Renew member plan |
| GET/POST | `/api/plans` | Plan list and create |
| GET/PUT/DELETE | `/api/plans/{id}` | Plan CRUD |
| GET | `/api/revenue/{period}` | Revenue charts |
| GET | `/api/revenue/metrics` | Revenue metrics |
| GET | `/api/reports/{type}/{format}` | Report downloads |
| GET | `/api/notifications` | Notifications |

## Docker

If Docker Compose is available, the full stack can be started from the project root with:

```bash
docker compose up --build
```

The backend container uses the MongoDB service defined in `docker-compose.yml`.

## Troubleshooting

- If login fails, confirm the backend is connected to the expected MongoDB instance.
- If Atlas is used, make sure your IP address is whitelisted.
- If the backend cannot start, check the terminal for connection errors or port conflicts.
