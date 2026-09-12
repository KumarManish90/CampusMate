# CampusMate

CampusMate is a campus community app for discovering students, stories, events, clubs, posts, reels, matches, and conversations. The public experience uses a dark cinematic visual direction; the signed-in product is a responsive React application backed by a production-oriented Express API.

## Stack

- Frontend: React 18, Vite, Axios, Socket.IO client, Lucide icons
- Backend: Node.js, Express, MongoDB/Mongoose, Socket.IO, JWT
- Media: Cloudinary in production; local filesystem in development
- Email: Resend in production; console OTP in development
- Hosting: Vercel-compatible frontend and Render-compatible backend

## Repository layout

```text
frontend/   React application
backend/    REST API and Socket.IO server
render.yaml Render backend blueprint
```

## Local development

### Backend

```bash
cd backend
npm ci
cp .env.example .env
npm run dev
```

At minimum, set a reachable `MONGODB_URI` and a random `JWT_SECRET` with 32 or more characters. Development defaults to local media storage and prints email OTPs in the backend console.

### Frontend

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

For local development, change `VITE_API_URL` to `http://localhost:5000/api` and `VITE_SOCKET_URL` to `http://localhost:5000`.

## Validation

Run these before deployment:

```bash
cd backend
npm test
npm audit --omit=dev

cd ../frontend
npm test
npm run build
npm audit --omit=dev
```

## Production configuration

### Backend / Render

The included `render.yaml` installs locked production dependencies with `npm ci --omit=dev`, exposes `/api/health`, and disables demo login. Configure these secret values in Render:

| Variable | Purpose |
|---|---|
| `CLIENT_URL` | Exact Vercel origin allowed by CORS; comma-separate additional trusted origins |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Random secret of at least 32 characters |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RESEND_API_KEY` | Resend API key for verification emails |
| `EMAIL_FROM` | Verified sender, for example `CampusMate <verify@your-domain.com>` |

Production startup deliberately fails when CORS, MongoDB, JWT, Cloudinary, or email delivery is missing. Render's local filesystem is ephemeral, so `MEDIA_STORAGE_MODE=cloudinary` is required.

### Frontend / Vercel

Set:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
VITE_SOCKET_URL=https://your-render-service.onrender.com
VITE_ENABLE_DEMO_MODE=false
```

Use `frontend` as the Vercel root directory, `npm run build` as the build command, and `dist` as the output directory. `frontend/vercel.json` provides the SPA fallback for direct navigation.

## Production behavior

- Demo login and offline demo fallback are disabled unless explicitly enabled outside production.
- Post and reel creation uploads real media and persists content through the API.
- Stories, feeds, profiles, search results, hashtag pages, comments, likes, saves, shares, and views enforce content visibility.
- `public` content is available without a session; `campus` requires a signed-in user; `college`, `connections`, and `private` are scoped to the viewer.
- OTP codes are hashed in MongoDB, expire after 10 minutes, and are delivered through Resend in production.
- Authentication routes have a tighter rate limit than the general API.
- Admin moderation deletes related media and dependent records.

## Main API areas

| Area | Routes |
|---|---|
| Authentication | `/api/auth/register`, `/login`, `/me`, `/send-otp`, `/verify-otp` |
| Students | `/api/users`, `/api/users/:id`, follow and profile media routes |
| Feed | `/api/feed`, `/api/posts/*`, `/api/reels/*`, `/api/stories/*` |
| Discovery | `/api/discover`, `/api/swipes`, `/api/matches`, `/api/connections` |
| Messaging | `/api/messages` plus authenticated Socket.IO events |
| Campus | `/api/clubs`, `/api/events`, `/api/search`, `/api/hashtags/*` |
| Safety | `/api/reports`, `/api/admin/*` |

## Deployment checklist

- Use a dedicated production MongoDB database and restrict Atlas network access appropriately.
- Verify the Resend sender domain before the first real signup.
- Configure Cloudinary upload limits and account alerts.
- Set `CLIENT_URL` to the final HTTPS frontend origin.
- Do not run the demo seed script against production.
- Create the first admin deliberately in the database; never expose admin creation as a public route.
- Test register → OTP → profile → post/reel upload → match → message on the deployed origins.
- Enable uptime and error monitoring before inviting students.

## Demo data

Development-only demo accounts and generated media can be created with `npm run seed` from `backend`. Keep `ENABLE_DEMO_LOGIN=false` in production and never represent seeded accounts as real students.
