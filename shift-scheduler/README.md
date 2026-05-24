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
2. Update `MONGO_URI` in `.env` to point to your MongoDB instance.

## Build and run
```bash
docker compose up --build
```

The client will be available at http://localhost:3000
The API will be available at http://localhost:5000

## Stop
```bash
docker compose down
```
