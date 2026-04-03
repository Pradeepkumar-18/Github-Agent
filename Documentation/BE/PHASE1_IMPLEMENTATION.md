# Phase 1 — Backend Foundation

## Overview

Phase 1 established the core NestJS backend infrastructure for the AI GitHub Code Intelligence Agent. It sets up the server, database connection, configuration system, structured logging, health monitoring, and a Redis-backed job queue (reserved for Phase 3 AI evaluation).

---

## Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| NestJS | ^10 | Web framework |
| TypeScript | ^5 | Language |
| Mongoose | ^8 | MongoDB ODM |
| BullMQ | ^5 | Job queue (Phase 3) |
| Terminus | ^10 | Health checks |
| Winston | ^3 | Structured logging |
| class-validator | ^0.14 | DTO validation |
| class-transformer | ^0.5 | Payload transformation |

---

## Project Structure

```
be/src/
├── main.ts                    # Bootstrap — CORS, prefix, Swagger
├── app.module.ts              # Root module — wires all feature modules
├── config/
│   ├── configuration.ts       # Environment variable mapping
│   ├── config.module.ts       # Global ConfigModule wrapper
│   └── config.service.ts      # Typed config accessors
├── database/
│   ├── database.module.ts     # MongooseModule.forRootAsync
│   └── schemas/
│       ├── repository.schema.ts
│       ├── commit.schema.ts
│       ├── pull-request.schema.ts
│       └── evaluation.schema.ts
├── health/
│   ├── health.module.ts       # Terminus health module
│   └── health.controller.ts  # GET /api/v1/health
├── logger/
│   ├── logger.module.ts       # Winston logger module
│   └── logger.service.ts      # Structured log service
└── queue/
    ├── queue.module.ts        # BullMQ — requires Redis (Phase 3)
    └── queue.constants.ts     # Queue name constants
```

---

## Module Descriptions

### ConfigModule (`src/config/`)

Loads and validates environment variables. Provides a typed `ConfigService` used by all other modules.

**Key accessors:**
```ts
configService.port             // number
configService.mongoUri         // string
configService.redisHost        // string
configService.redisPort        // number
configService.encryptionKey    // string (added in Phase 2)
```

**Environment variables:**
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/code_intelligence
REDIS_HOST=localhost
REDIS_PORT=6379
ENCRYPTION_KEY=<32-char minimum key>
```

---

### DatabaseModule (`src/database/`)

Connects to MongoDB using Mongoose. Configured asynchronously via `ConfigService`.

```ts
MongooseModule.forRootAsync({
  useFactory: (config) => ({ uri: config.mongoUri }),
  inject: [ConfigService],
})
```

All schemas are registered per feature module using `MongooseModule.forFeature([...])`.

---

### Database Schemas

#### Repository (`schemas/repository.schema.ts`)
| Field | Type | Notes |
|---|---|---|
| `name` | String | Short repo name |
| `fullName` | String | `owner/repo` format, unique |
| `githubId` | Number | GitHub or GitLab project ID, unique |
| `provider` | `'github' \| 'gitlab'` | Added in Phase 2 |
| `owner` | String | GitHub username / GitLab namespace |
| `repo` | String | Repo slug |
| `encryptedToken` | `String \| null` | AES-256-GCM encrypted PAT, hidden from API |
| `description` | String | |
| `language` | String | Primary language |
| `defaultBranch` | String | |
| `url` | String | Web URL |
| `status` | `'active' \| 'archived' \| 'inactive'` | |
| `healthScore` | Number | 0–100 |
| `totalCommits` | Number | Incremented on fetch |
| `openPRs` | Number | Updated on fetch |

Indexes: `fullName` (unique), `githubId` (unique), `{owner, repo}` (unique)

---

#### Commit (`schemas/commit.schema.ts`)
| Field | Type | Notes |
|---|---|---|
| `sha` | String | Full commit SHA, unique |
| `message` | String | |
| `authorName` | String | |
| `authorEmail` | String | |
| `authorAvatar` | String | URL |
| `repositoryId` | ObjectId | Ref: Repository |
| `repositoryFullName` | String | Denormalized for display |
| `url` | String | GitHub/GitLab commit URL |
| `additions` | Number | |
| `deletions` | Number | |
| `changedFiles` | Number | |
| `evaluationStatus` | `'pending' \| 'processing' \| 'completed' \| 'failed'` | |
| `evaluationId` | `ObjectId \| null` | Ref: Evaluation (Phase 3) |
| `committedAt` | Date | |
| `branch` | String | |

Indexes: `{repositoryId, committedAt}`, `sha` (unique), `evaluationStatus`

---

#### PullRequest (`schemas/pull-request.schema.ts`)
| Field | Type | Notes |
|---|---|---|
| `prNumber` | Number | GitHub PR number / GitLab MR iid |
| `title` | String | |
| `body` | String | Description |
| `authorName` | String | |
| `authorAvatar` | String | |
| `repositoryId` | ObjectId | Ref: Repository |
| `repositoryFullName` | String | Denormalized |
| `baseBranch` | String | Target branch |
| `headBranch` | String | Source branch |
| `state` | `'open' \| 'closed' \| 'merged'` | |
| `riskLevel` | `'low' \| 'medium' \| 'high' \| 'critical'` | Set by AI (Phase 3) |
| `riskScore` | Number | 0–100 |
| `additions` | Number | |
| `deletions` | Number | |
| `changedFiles` | Number | |
| `commitsCount` | Number | |
| `evaluationStatus` | enum | |
| `evaluationId` | `ObjectId \| null` | |
| `mergedAt` | `Date \| null` | |
| `githubCreatedAt` | Date | |
| `reviewers` | String[] | Usernames |

Indexes: `{repositoryId, state}`, `{repositoryId, riskLevel}`, `{prNumber, repositoryId}` (unique)

---

#### Evaluation (`schemas/evaluation.schema.ts`)
| Field | Type | Notes |
|---|---|---|
| `targetId` | String | commit SHA or PR number |
| `targetType` | `'commit' \| 'pull_request'` | |
| `repositoryId` | ObjectId | |
| `summary` | String | AI-generated summary |
| `qualityScore` | Number | 0–100 |
| `securityScore` | Number | 0–100 |
| `maintainabilityScore` | Number | 0–100 |
| `overallScore` | Number | 0–100 |
| `riskLevel` | enum | |
| `issues` | String[] | Detected problems |
| `suggestions` | String[] | Improvement advice |
| `fileAnalysis` | Object[] | Per-file risk breakdown |
| `status` | enum | pending → processing → completed/failed |
| `model` | String | AI model used |
| `tokensUsed` | Number | |
| `failureReason` | `String \| null` | |

---

### HealthModule (`src/health/`)

Exposes `GET /api/v1/health` via `@nestjs/terminus`.

**Checks performed:**
- MongoDB ping (`mongoose.pingCheck`)
- Memory heap (`memory.checkHeap`, limit: 300 MB)

> **Note:** The `/health/queues` endpoint and Redis health check are disabled until Phase 3 (BullMQ not required in Phase 2).

---

### LoggerModule (`src/logger/`)

Winston-based structured logger. Available for injection as `LoggerService` throughout the application.

---

### QueueModule (`src/queue/`) — Phase 3

BullMQ queue module pre-configured for `COMMIT_EVALUATION` and `PR_EVALUATION` queues.

> **Status: Commented out in `app.module.ts` — requires Redis. Will be enabled in Phase 3.**

---

## Server Bootstrap (`main.ts`)

```ts
app.enableCors({ origin: process.env.FE_URL ?? 'http://localhost:5173' });
app.setGlobalPrefix('api/v1');
// ValidationPipe — currently disabled for development
```

Base URL: `http://localhost:3000/api/v1`

---

## Running the Backend

```bash
# Install dependencies
cd be
npm install

# Start development server (with hot reload)
npm run start:dev

# Build for production
npm run build

# Start production build
npm run start:prod
```

---

*Last updated: February 2026 — Phase 1 Foundation*
