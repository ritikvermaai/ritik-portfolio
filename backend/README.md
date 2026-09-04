# Backend architecture

The backend is organized by responsibility:

- `app.js` — Express application composition and compatibility endpoints.
- `config/` — environment and database configuration.
- `models/` — one Mongoose model per domain collection.
- `controllers/` — request/response controllers for extracted domains.
- `services/` — business logic such as authentication, themes, visitors and audit logging.
- `routes/` — route registration.
- `middleware/` — request security and authorization middleware.
- `validators/` — Zod request schemas.
- `utils/` — reusable helpers.

Existing endpoint URLs and Mongo collection names are intentionally preserved. This lets the refactor remain backward compatible with the current frontend and existing database.
