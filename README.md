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

Dashboard stats · Projects CRUD + multi-image upload · Gallery upload/edit/delete/download · Donations CRUD · Visitor count management · Message inbox/read/delete · Resume workspace · Website Builder · Homepage HTML editor · Profile image upload/delete · Site settings · Logout.

## Database compatibility

The backend keeps the original MongoDB model names and existing collection fields so the same database can be reused. No new database is required.

## Important

The archive contains an `.env` file from the original project. Keep it private and rotate any exposed production credentials before sharing the repository publicly. `frontend/public/assets/photoweb.png` is generated from the original `photoweb.jpg` so the redesign can use the requested PNG asset.
