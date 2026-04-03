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

---

## Repositories

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/repositories` | `{ owner, repo, token }` | Register repo, validate with GitHub, encrypt PAT |
| `GET` | `/repositories` | — | List all configured repositories (no tokens) |
| `GET` | `/repositories/:id` | — | Get a single repository by Mongo `_id` |

---

## Commits

| Method | Path | Body / Query | Description |
|---|---|---|---|
| `POST` | `/commits/fetch` | `{ repositoryId, since, until }` | Fetch from GitHub + upsert to MongoDB |
| `GET` | `/commits` | `?repositoryId=&page=1&limit=20&search=` | Paginated commit list (optional search) |
| `GET` | `/commits/:sha` | — | Single commit by SHA (prefix match) |

---

## Pull Requests

| Method | Path | Body / Query | Description |
|---|---|---|---|
| `POST` | `/pull-requests/fetch` | `{ repositoryId, since, until }` | Fetch from GitHub + upsert to MongoDB |
| `GET` | `/pull-requests` | `?repositoryId=&search=` | List all PRs for a repository (optional search) |
| `GET` | `/pull-requests/:number` | — | Single PR by GitHub PR number |

---

## Planned (Phase 3+)

### Evaluations (`/evaluations`)
- `GET /commits/:sha` — AI evaluation for a commit
- `GET /pull-requests/:number` — Risk assessment for a PR

### Settings (`/settings`)
- `PATCH /capabilities` — Toggle AI capabilities
