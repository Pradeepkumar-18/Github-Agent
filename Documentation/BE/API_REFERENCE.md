# Backend API Reference

This document lists the available API endpoints for the AI GitHub Code Intelligence Agent.

**Base URL**: `http://localhost:3000/api/v1`

---

## Health & Monitoring

Endpoints for checking system status and infrastructure health.

### 1. Global Health Status
Check the status of core dependencies (Database, Memory).

- **Method**: `GET`
- **Endpoint**: `/health`
- **Success Response**:
  ```json
  {
    "status": "ok",
    "info": {
      "mongodb": { "status": "up" },
      "memory_heap": { "status": "up" }
    },
    "error": {},
    "details": {
      "mongodb": { "status": "up" },
      "memory_heap": { "status": "up" }
    }
  }
  ```

### 2. Queue Metrics
Retrieve current job counts for background evaluation queues.

- **Method**: `GET`
- **Endpoint**: `/health/queues`
- **Success Response**:
  ```json
  {
    "status": "ok",
    "queues": {
      "commitEvaluation": {
        "waiting": 0,
        "active": 0,
        "completed": 10,
        "failed": 0,
        "delayed": 0
      }
    }
  }
  ```

---

## Planned API Groups (Phase 2+)

The following endpoint categories are scheduled for implementation:

### Repositories (`/repositories`)
- `GET /`: List monitored repositories.
- `GET /:id`: Detailed repository stats.
- `POST /`: Add a new repository to monitor.

### Evaluations (`/evaluations`)
- `GET /commits/:sha`: Get AI evaluation for a specific commit.
- `GET /pull-requests/:id`: Get risk assessment for a PR.

### Settings (`/settings`)
- `PATCH /capabilities`: Toggle system AI capabilities.
