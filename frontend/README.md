# GymPro Frontend

The GymPro frontend is a responsive React + Vite admin dashboard for managing gym members, plans, revenue, reports, and notifications.

## Features

- Dashboard with KPI cards and charts
- Members list with add/edit/delete, branch selection, address, and auto-expiry calculation
- Plans, revenue, reports, and notifications pages
- Mobile-friendly layout with bottom navigation
- Theme toggle with persistence

## Tech Stack

- React 19
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts

## Setup

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev -- --host
```

Build for production:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

## Environment

The frontend uses `VITE_API_URL` from Vite environment files.

Example:

```env
VITE_API_URL=http://localhost:8000/api
```

Production:

```env
VITE_API_URL=https://gym-managementmern.onrender.com/api
```

If you open the app from another device on the same network, make sure the API URL points to the machine running the backend.

## Login

Default admin credentials:

```text
Email: admin@am.com
Password: 123
```

## Notes

- The login screen is at `/login`.
- The dashboard is the default post-login route.
- If the backend changes, restart the frontend dev server after updating `.env`.
