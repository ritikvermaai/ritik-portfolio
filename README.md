# Ritik Verma Portfolio — UI Rebuild v3.0

A complete frontend redesign of the original portfolio while retaining its existing backend API, MongoDB collections, Cloudinary uploads, Razorpay payments, visitor/rating tracking, C/C++ compiler and administrator controls.

## Project layout

- `frontend/` — React + Vite frontend (public site + admin workspace)
- `backend/` — Express/Mongoose backend and existing API contracts
- `frontend/public/assets/` — profile and portfolio images/audio
- `backend/.env` — existing environment configuration copied from the source archive

## Run

### Backend
```bash
cd backend
npm install
node server.js
```

### Frontend (development)
Open another terminal:
```bash
cd frontend
npm install
npm run dev
```

Vite proxies API calls to `http://localhost:5000`.

### Production
```bash
cd frontend
npm run build
```
Then serve `frontend/dist` from the Express server or deploy the frontend separately.

## Admin
Open `/admin` and use the same `ADMIN_PASSWORD` from the existing environment. The admin workspace includes:

Dashboard overview · Projects CRUD + multi-image upload · Gallery upload/edit/delete/download · Donations CRUD · Visitor count management · Message inbox/read/delete · Resume workspace · Website Builder · Profile image upload/delete · Site settings · Logout.

## Database compatibility

The backend keeps the original MongoDB model names and existing collection fields so the same database can be reused. No new database is required.

## Important

The archive contains an `.env` file from the original project. Keep it private and rotate any exposed production credentials before sharing the repository publicly. `frontend/public/assets/photoweb.png` is generated from the original `photoweb.jpg` so the redesign can use the requested PNG asset.

## V16 architecture upgrade
- Express 5 + Mongoose 9 backend retained for MongoDB compatibility.
- Production hardening: Helmet security headers, compression, CORS credentials, API rate limiting and stricter login throttling.
- Admin sessions use MongoDB-backed `connect-mongo` sessions when `MONGODB_URI` is available instead of the default in-memory store.
- Zod validation protects admin login and public contact payloads.
- Added `/api/health`, `/admin/api/overview`, and admin ratings moderation endpoints.
- React admin is the single control center for content, projects, gallery, donations, visitors, messages, ratings, resume, website builder, homepage and settings.
- Native browser alert/confirm/prompt calls have been replaced by animated in-app dialogs.
- Light mode received a full surface/color pass; dark cards are no longer reused as the light-theme default.

## Admin security (V31)

The admin control center now includes:
- Mongo-backed server-side sessions with HttpOnly/SameSite/Secure cookies and a 4-hour absolute session lifetime.
- Login rate limiting and session ID regeneration after successful login.
- CSRF protection for state-changing `/admin` requests via a session-bound token.
- Bcrypt password hashing. Existing `ADMIN_PASSWORD` can bootstrap the first login; after that the hash is stored in MongoDB. For a clean production setup, generate a hash with `npm run hash-password`, set `ADMIN_PASSWORD_HASH` in Render, and remove `ADMIN_PASSWORD`.
- File upload validation for JPG, PNG, WEBP and GIF with a 10 MB limit.
- Security headers through Helmet.
- Audit logs for important admin mutations, available under **System → Activity Log**.
- **Log out all sessions** under **System → Security**.

### Password migration
Run:

```bash
npm install
npm run hash-password
```

Copy the generated hash into the `ADMIN_PASSWORD_HASH` environment variable. After confirming login works, remove the plaintext `ADMIN_PASSWORD` variable.

## V33 security and mobile updates

- Login cooldown starts at 60 seconds after a wrong password and increases by 60 seconds per failed attempt, capped at 5 minutes. The cooldown is server-side and survives page refreshes.
- Admin Security now includes password change, active sessions, last/current login timestamps, failed-login count, session timeout, and logout-all.
- Mobile Admin adds a bottom navigation bar, slide-out sidebar with backdrop, touch-friendly controls, mobile-friendly charts/modals, and sticky save actions.

### Local test

```bash
npm install
npm start
```

Open `http://localhost:5173/admin/login`. Enter a wrong password once: the page should show a 60-second countdown. Wait for it to finish, enter another wrong password: the next cooldown should be 120 seconds. Further failed attempts increase it to 180, 240, and then 300 seconds maximum.


## Backend architecture (V36)

The backend now has a maintainable domain structure under `backend/`: `models/`, `controllers/`, `services/`, `routes/`, `middleware/`, `validators/`, `utils/`, and `config/`. `server.js` is now only the process bootstrap; Express composition lives in `backend/app.js`.

Domain models are isolated one-per-file. `User`, `Portfolio`, and `Resume` are compatibility aliases over the existing administrator/portfolio-content documents so the current MongoDB data is not duplicated or lost. `Theme` has its own model and automatically migrates the existing `Settings.theme` value on first read. Theme and health endpoints are fully extracted into controllers/services/routes. Authentication, audit logging, visitor registration, upload validation, database connection, and request validation also have dedicated modules. Existing API paths remain unchanged for the current frontend.
