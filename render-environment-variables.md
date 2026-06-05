# Render Backend Environment Variables

Copy these into Render:

Render Dashboard -> your backend service -> Environment -> Add Environment Variable

```env
MONGODB_URL=mongodb+srv://<username>:<password>@<cluster-host>/<database>?retryWrites=true&w=majority
DATABASE_NAME=gym_management
JWT_SECRET=<create-a-new-long-random-secret>
JWT_EXPIRY_HOURS=24
FRONTEND_ORIGINS=https://mygymhub.vercel.app
```

Do not add this one to Render backend:

```env
VITE_API_URL=http://localhost:8000/api
```

`VITE_API_URL` belongs in Vercel frontend, and should point to your Render backend:

```env
VITE_API_URL=https://gym-managementmern.onrender.com/api
```

Render commands for this backend-only repo:

```bash
Build Command: npm install
Start Command: npm start
```

Keep Root Directory empty.

Important: rotate your MongoDB password and `JWT_SECRET` before production because they were visible in chat/screenshots.
