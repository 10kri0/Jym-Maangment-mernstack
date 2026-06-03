# GymPro

GymPro is a modern gym management admin panel built with React, Vite, Tailwind CSS, Node.js, Express, and MongoDB.

It includes member management, plans, revenue analytics, reports, notifications, dark/light theme support, and a clean responsive dashboard.

## Highlights

- Member CRUD with search, filters, address, branch, and auto-calculated expiry dates
- Plan management with pricing and duration
- Dashboard KPIs and revenue charts
- PDF and Excel report endpoints
- PWA-ready frontend
- Docker Compose support for local full-stack runs

## Stack

- Frontend: React, Vite, Tailwind CSS, Recharts, Axios
- Backend: Node.js, Express, Mongoose, JWT
- Database: MongoDB Atlas or local MongoDB
- Optional: Docker and Docker Compose

## Project Layout

```text
gym project/
├── backend/        Node.js + Express API
├── frontend/       React + Vite UI
├── docker-compose.yml
└── README.md
```

```mermaid
flowchart LR
	A[Frontend React App] --> B[Express API]
	B --> C[MongoDB]
	B --> D[Reports / Auth / Dashboard]
```

## Prerequisites

- Node.js 20+
- npm
- MongoDB Atlas account or local MongoDB
- Docker and Docker Compose if you want containerized runs

## Environment Variables

Create a root `.env` file:

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=gym_management
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRY_HOURS=24
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000
VITE_API_URL=http://localhost:8000/api
```

For MongoDB Atlas, replace `MONGODB_URL` with your Atlas URI.

## Quick Start

Run the backend in one terminal:

```bash
cd backend
npm install
npm run dev
```

Run the frontend in another terminal:

```bash
cd frontend
npm install
npm run dev -- --host
```

Open:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Health check: `http://localhost:8000/api/health`

Default admin login:

```text
Email: admin@gym.com
Password: admin123
```

## Docker Compose

If Docker is installed:

```bash
docker compose up --build
```

This starts:

- MongoDB on `localhost:27017`
- Backend on `localhost:8000`
- Frontend on `localhost:5173`

Stop it with:

```bash
docker compose down
```

## Useful Commands

```bash
cd backend && npm run dev
cd backend && npm start
cd frontend && npm run dev
cd frontend && npm run build
cd frontend && npm run lint
```

## API Overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/login` | Admin login |
| GET | `/api/dashboard/stats` | Dashboard metrics |
| GET/POST | `/api/members` | List or create members |
| GET/PUT/DELETE | `/api/members/{id}` | Member CRUD |
| POST | `/api/members/{id}/renew` | Renew membership |
| GET/POST | `/api/plans` | List or create plans |
| GET/PUT/DELETE | `/api/plans/{id}` | Plan CRUD |
| GET | `/api/revenue/{period}` | Revenue charts |
| GET | `/api/revenue/metrics` | Revenue metrics |
| GET | `/api/reports/{type}/{format}` | PDF / Excel reports |
| GET | `/api/notifications` | Alerts and notifications |

## Troubleshooting

- If login fails, make sure the backend is running and let it finish seeding.
- If the frontend cannot reach the backend, confirm `VITE_API_URL` points to the correct host.
- If MongoDB is unreachable, use Docker Compose or verify the Atlas IP whitelist.
- If a port is busy, stop the old process or change the port before restarting.

## GitHub Setup

If you want to publish this repo on GitHub:

```bash
git init
git add .
git commit -m "Initial GymPro project"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```
