# Shift Scheduler

Full-stack shift scheduling app for IT support teams.

## Prerequisites
- Docker
- Docker Compose
- MongoDB already running (outside Docker)

## Environment setup
1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```
2. Update variables in `.env`:
   - `MONGO_URI` (MongoDB is running outside Docker)
   - `JWT_SECRET` (any long random string)
   - `ADMIN_USERNAME` / `ADMIN_PASSWORD` (admin login)

## Build and run
```bash
docker compose up --build
```

The view-only calendar will be available at http://localhost:3000/apps/schedule/
The admin page will be available at http://localhost:3000/apps/schedule/admin
The API will be available at http://localhost:5000/api (health check: http://localhost:5000/health)

## Stop
```bash
docker compose down
```
