# V36 Backend Architecture

```text
server.js
  └─ backend/app.js
       ├─ config/          environment + MongoDB connection
       ├─ models/          one domain model per file
       ├─ middleware/      authentication + upload validation
       ├─ validators/      Zod request schemas
       ├─ routes/           extracted HTTP route registration
       ├─ controllers/     HTTP request/response handlers
       ├─ services/        business logic
       └─ utils/           small reusable helpers
```

## Data compatibility

Existing MongoDB collection names and API URLs remain intact. `User`, `Portfolio`, and `Resume` are logical compatibility aliases over the current administrator/portfolio-content documents rather than duplicate collections. `Theme` is a dedicated model and synchronizes with the existing `Settings.theme` value during the transition.
