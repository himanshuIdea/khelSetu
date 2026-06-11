# Khel Setu Microservices

API-first backend with one service per bounded context. The Next.js web app never talks to the database directly — it calls the API gateway.

## Architecture

```
Next.js (web)  →  API Gateway :4000  →  Microservices  →  PostgreSQL
                      │
                      ├── academy-service      :4001
                      ├── people-service       :4002
                      ├── operations-service   :4003
                      ├── competitions-service :4004
                      ├── inventory-service    :4005
                      └── payroll-service      :4006
```

## Run locally

```bash
# 1. Copy keys from .env.local (reference) into .env and set DATABASE_URL
#    Use the Supabase *pooler* URI (port 6543), not the direct db.* host.
#    Direct host is IPv6-only and may fail with ENOTFOUND on some networks.
# 2. First-time setup
pnpm db:setup

# 3. Start web + all microservices (single command)
pnpm dev
```

`pnpm dev` starts Next.js and every microservice. Use `pnpm dev:web` for frontend only.

## API base URL

All routes are under `http://localhost:4000/api/v1/`.

Examples:
- `GET /api/v1/academies/{academyId}/meta` — `academyId` is the UUID from the database
- `GET /api/v1/academies/{academyId}/players`
- `GET /api/v1/academies/{id}/dashboard/stats`

## Future extraction

Each folder under `services/` can be deployed independently. Point `ACADEMY_SERVICE_URL`, etc. at remote hosts and the gateway will proxy accordingly.
