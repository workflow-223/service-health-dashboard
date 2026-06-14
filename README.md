# Service Health Dashboard

Real-time monitoring dashboard that tracks web service uptime with automated health checks, live WebSocket updates, and response time charts.

## Architecture

- **Frontend**: React 18 + Chart.js + react-chartjs-2
- **Backend**: Node.js/Express + SQLite (sql.js) + WebSocket (ws)
- **Infrastructure**: Docker Compose with nginx reverse proxy

## Live Demo

Frontend (UI only, no backend): https://workflow-223.github.io/service-health-dashboard/

## CI/CD

This project uses GitHub Actions for continuous integration:
- Backend linting (semistandard)
- Frontend build verification
- Docker Compose build validation

## Local Setup

```bash
docker compose up --build
```
