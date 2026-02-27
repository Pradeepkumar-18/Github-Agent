# Phase 1 — Advanced Infrastructure Setup
## AI GitHub Code Intelligence Agent

> **Key Rule for Phase 1**: Frontend and Backend do NOT connect. The frontend uses local mock JSON files. The backend sets up infrastructure only — no API endpoints that the FE calls yet.

---

# PART A — BACKEND PHASE 1

## Goal
Spin up a fully working NestJS application with MongoDB, Redis, BullMQ, structured logging, config management, and health checks. No business logic yet — pure plumbing.

---

## Project Scaffold

```
backend/
├── src/
│   ├── config/
│   │   ├── config.module.ts
│   │   ├── config.service.ts
│   │   └── configuration.ts
│   ├── database/
│   │   ├── database.module.ts
│   │   └── schemas/
│   │       ├── repository.schema.ts
│   │       ├── commit.schema.ts
│   │       ├── pull-request.schema.ts
│   │       └── evaluation.schema.ts
│   ├── queue/
│   │   ├── queue.module.ts
│   │   └── queue.constants.ts
│   ├── health/
│   │   ├── health.module.ts
│   │   └── health.controller.ts
│   ├── logger/
│   │   ├── logger.module.ts
│   │   └── logger.service.ts
│   ├── app.module.ts
│   └── main.ts
├── .env
├── .env.example
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## Package Dependencies

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/mongoose": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/terminus": "^10.0.0",
    "@nestjs/bullmq": "^10.0.0",
    "mongoose": "^8.0.0",
    "bullmq": "^5.0.0",
    "ioredis": "^5.3.0",
    "winston": "^3.11.0",
    "nest-winston": "^1.9.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0",
    "helmet": "^7.1.0",
    "compression": "^1.7.4"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## Environment Configuration

### `.env.example`
```env
# ─── App ──────────────────────────────────────────────
PORT=3000
NODE_ENV=development
APP_NAME=code-intelligence-api

# ─── MongoDB ──────────────────────────────────────────
MONGODB_URI=mongodb://localhost:27017/code_intelligence

# ─── Redis ────────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ─── GitHub (Phase 2) ─────────────────────────────────
GITHUB_WEBHOOK_SECRET=placeholder
GITHUB_APP_ID=
GITHUB_PRIVATE_KEY=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# ─── AI (Phase 3) ─────────────────────────────────────
OPENAI_API_KEY=
GEMINI_API_KEY=
AI_MODEL=gpt-4o

# ─── Security ─────────────────────────────────────────
JWT_SECRET=changeme_in_production
```

---

## Configuration Module

### `src/config/configuration.ts`
```typescript
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'code-intelligence-api',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/code_intelligence',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },

  github: {
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || '',
    appId: process.env.GITHUB_APP_ID || '',
    privateKey: process.env.GITHUB_PRIVATE_KEY || '',
  },

  ai: {
    openaiKey: process.env.OPENAI_API_KEY || '',
    geminiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-4o',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret',
  },
});
```

### `src/config/config.module.ts`
```typescript
import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import configuration from './configuration';
import { ConfigService } from './config.service';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '.env.local'],
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

### `src/config/config.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private config: NestConfigService) {}

  get port(): number {
    return this.config.get<number>('port');
  }

  get isDevelopment(): boolean {
    return this.config.get<string>('nodeEnv') === 'development';
  }

  get mongoUri(): string {
    return this.config.get<string>('mongodb.uri');
  }

  get redisConfig() {
    return this.config.get('redis');
  }

  get githubConfig() {
    return this.config.get('github');
  }

  get aiConfig() {
    return this.config.get('ai');
  }
}
```

---

## Database Module

### `src/database/database.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '../config/config.service';
import { Repository, RepositorySchema } from './schemas/repository.schema';
import { Commit, CommitSchema } from './schemas/commit.schema';
import { PullRequest, PullRequestSchema } from './schemas/pull-request.schema';
import { Evaluation, EvaluationSchema } from './schemas/evaluation.schema';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.mongoUri,
        connectionFactory: (connection) => {
          connection.on('connected', () => console.log('MongoDB connected'));
          connection.on('error', (err) => console.error('MongoDB error:', err));
          return connection;
        },
      }),
    }),
    MongooseModule.forFeature([
      { name: Repository.name, schema: RepositorySchema },
      { name: Commit.name, schema: CommitSchema },
      { name: PullRequest.name, schema: PullRequestSchema },
      { name: Evaluation.name, schema: EvaluationSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
```

---

## Mongoose Schemas

### `src/database/schemas/repository.schema.ts`
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RepositoryDocument = Repository & Document;

@Schema({ timestamps: true, collection: 'repositories' })
export class Repository {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true })
  fullName: string; // e.g. "org/repo-name"

  @Prop({ required: true, unique: true })
  githubId: number;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  language: string;

  @Prop({ default: 'main' })
  defaultBranch: string;

  @Prop({ required: true })
  url: string;

  @Prop({
    type: String,
    enum: ['active', 'archived', 'inactive'],
    default: 'active',
  })
  status: string;

  @Prop({ default: 0, min: 0, max: 100 })
  healthScore: number;

  @Prop({ default: 0 })
  totalCommits: number;

  @Prop({ default: 0 })
  openPRs: number;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const RepositorySchema = SchemaFactory.createForClass(Repository);
RepositorySchema.index({ fullName: 1 });
RepositorySchema.index({ githubId: 1 }, { unique: true });
```

### `src/database/schemas/commit.schema.ts`
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommitDocument = Commit & Document;

@Schema({ timestamps: true, collection: 'commits' })
export class Commit {
  @Prop({ required: true, unique: true })
  sha: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: '' })
  authorName: string;

  @Prop({ default: '' })
  authorEmail: string;

  @Prop({ default: '' })
  authorAvatar: string;

  @Prop({ type: Types.ObjectId, ref: 'Repository', required: true })
  repositoryId: Types.ObjectId;

  @Prop({ required: true })
  repositoryFullName: string;

  @Prop({ default: '' })
  url: string;

  @Prop({ default: 0 })
  additions: number;

  @Prop({ default: 0 })
  deletions: number;

  @Prop({ default: 0 })
  changedFiles: number;

  @Prop({
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  })
  evaluationStatus: string;

  @Prop({ type: Types.ObjectId, ref: 'Evaluation', default: null })
  evaluationId: Types.ObjectId | null;

  @Prop({ required: true })
  committedAt: Date;

  @Prop({ default: 'main' })
  branch: string;
}

export const CommitSchema = SchemaFactory.createForClass(Commit);
CommitSchema.index({ repositoryId: 1, committedAt: -1 });
CommitSchema.index({ sha: 1 }, { unique: true });
CommitSchema.index({ evaluationStatus: 1 });
```

### `src/database/schemas/pull-request.schema.ts`
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PullRequestDocument = PullRequest & Document;

@Schema({ timestamps: true, collection: 'pull_requests' })
export class PullRequest {
  @Prop({ required: true })
  prNumber: number;

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  body: string;

  @Prop({ default: '' })
  authorName: string;

  @Prop({ default: '' })
  authorAvatar: string;

  @Prop({ type: Types.ObjectId, ref: 'Repository', required: true })
  repositoryId: Types.ObjectId;

  @Prop({ required: true })
  repositoryFullName: string;

  @Prop({ default: 'main' })
  baseBranch: string;

  @Prop({ default: '' })
  headBranch: string;

  @Prop({
    type: String,
    enum: ['open', 'closed', 'merged'],
    default: 'open',
  })
  state: string;

  @Prop({
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
  })
  riskLevel: string;

  @Prop({ default: 0, min: 0, max: 100 })
  riskScore: number;

  @Prop({ default: 0 })
  additions: number;

  @Prop({ default: 0 })
  deletions: number;

  @Prop({ default: 0 })
  changedFiles: number;

  @Prop({ default: 0 })
  commitsCount: number;

  @Prop({
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  })
  evaluationStatus: string;

  @Prop({ type: Types.ObjectId, ref: 'Evaluation', default: null })
  evaluationId: Types.ObjectId | null;

  @Prop({ default: null })
  mergedAt: Date | null;

  @Prop({ required: true })
  githubCreatedAt: Date;
}

export const PullRequestSchema = SchemaFactory.createForClass(PullRequest);
PullRequestSchema.index({ repositoryId: 1, state: 1 });
PullRequestSchema.index({ repositoryId: 1, riskLevel: 1 });
PullRequestSchema.index({ prNumber: 1, repositoryId: 1 }, { unique: true });
```

### `src/database/schemas/evaluation.schema.ts`
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EvaluationDocument = Evaluation & Document;

@Schema({ timestamps: true, collection: 'evaluations' })
export class Evaluation {
  @Prop({ required: true })
  targetId: string; // sha for commit, prNumber for PR

  @Prop({
    type: String,
    enum: ['commit', 'pull_request'],
    required: true,
  })
  targetType: string;

  @Prop({ type: Types.ObjectId, ref: 'Repository', required: true })
  repositoryId: Types.ObjectId;

  @Prop({ default: '' })
  summary: string;

  @Prop({ default: 0, min: 0, max: 100 })
  qualityScore: number;

  @Prop({ default: 0, min: 0, max: 100 })
  securityScore: number;

  @Prop({ default: 0, min: 0, max: 100 })
  maintainabilityScore: number;

  @Prop({ default: 0, min: 0, max: 100 })
  overallScore: number;

  @Prop({
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
  })
  riskLevel: string;

  @Prop({ type: [String], default: [] })
  issues: string[];

  @Prop({ type: [String], default: [] })
  suggestions: string[];

  @Prop({ type: [Object], default: [] })
  fileAnalysis: Array<{
    filename: string;
    risk: string;
    notes: string;
  }>;

  @Prop({
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  })
  status: string;

  @Prop({ default: '' })
  model: string;

  @Prop({ default: 0 })
  tokensUsed: number;

  @Prop({ default: null })
  failureReason: string | null;
}

export const EvaluationSchema = SchemaFactory.createForClass(Evaluation);
EvaluationSchema.index({ targetId: 1, targetType: 1 });
EvaluationSchema.index({ repositoryId: 1, status: 1 });
```

---

## Queue Module

### `src/queue/queue.constants.ts`
```typescript
export const QUEUES = {
  COMMIT_EVALUATION: 'commit-evaluation',
  PR_EVALUATION: 'pr-evaluation',
  NOTIFICATION: 'notification',
} as const;

export const JOB_NAMES = {
  EVALUATE_COMMIT: 'evaluate-commit',
  EVALUATE_PR: 'evaluate-pr',
  POST_PR_COMMENT: 'post-pr-comment',
  SEND_ALERT: 'send-alert',
} as const;

export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: 100,
  removeOnFail: 50,
};
```

### `src/queue/queue.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '../config/config.service';
import { QUEUES } from './queue.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.redisConfig.host,
          port: config.redisConfig.port,
          password: config.redisConfig.password,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUES.COMMIT_EVALUATION },
      { name: QUEUES.PR_EVALUATION },
      { name: QUEUES.NOTIFICATION },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
```

---

## Logger Module

### `src/logger/logger.service.ts`
```typescript
import { Injectable, LoggerService } from '@nestjs/common';
import { createLogger, format, transports, Logger } from 'winston';

@Injectable()
export class AppLogger implements LoggerService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        process.env.NODE_ENV === 'production'
          ? format.json()
          : format.combine(
              format.colorize(),
              format.printf(({ timestamp, level, message, context, ...meta }) => {
                return `${timestamp} [${level}]${context ? ` [${context}]` : ''} ${message} ${
                  Object.keys(meta).length ? JSON.stringify(meta) : ''
                }`;
              }),
            ),
      ),
      transports: [
        new transports.Console(),
        ...(process.env.NODE_ENV === 'production'
          ? [
              new transports.File({ filename: 'logs/error.log', level: 'error' }),
              new transports.File({ filename: 'logs/combined.log' }),
            ]
          : []),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
```

---

## Health Module

### `src/health/health.controller.ts`
```typescript
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES } from '../queue/queue.constants';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private mongoose: MongooseHealthIndicator,
    private memory: MemoryHealthIndicator,
    @InjectQueue(QUEUES.COMMIT_EVALUATION) private commitQueue: Queue,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb'),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
    ]);
  }

  @Get('queues')
  async checkQueues() {
    const counts = await this.commitQueue.getJobCounts();
    return {
      status: 'ok',
      queues: {
        commitEvaluation: counts,
      },
    };
  }
}
```

---

## App Bootstrap

### `src/main.ts`
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { AppLogger } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Logger
  const logger = app.get(AppLogger);
  app.useLogger(logger);

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS — open for Phase 1, lock down in Phase 8
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Server running on http://localhost:${port}/api/v1`, 'Bootstrap');
  logger.log(`🏥 Health check at http://localhost:${port}/api/v1/health`, 'Bootstrap');
}

bootstrap();
```

### `src/app.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { QueueModule } from './queue/queue.module';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    DatabaseModule,
    QueueModule,
    HealthModule,
  ],
})
export class AppModule {}
```

---

## Docker

### `docker-compose.yml`
```yaml
version: '3.9'

services:
  mongodb:
    image: mongo:7.0
    container_name: code_intel_mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: code_intelligence
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7.2-alpine
    container_name: code_intel_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: code_intel_redis_ui
    environment:
      REDIS_HOSTS: local:redis:6379
    ports:
      - "8081:8081"
    depends_on:
      - redis

volumes:
  mongo_data:
  redis_data:
```

---

## Phase 1 Backend Verification Checklist

| Check | Command | Expected |
|---|---|---|
| Services up | `docker compose up -d` | All green |
| MongoDB | `docker exec -it code_intel_mongo mongosh` | Connected |
| Redis | `docker exec -it code_intel_redis redis-cli ping` | PONG |
| App starts | `pnpm start:dev` | No errors |
| Health | `GET /api/v1/health` | `{"status":"ok"}` |
| Queue health | `GET /api/v1/health/queues` | Queue counts visible |

---
---

# PART B — FRONTEND PHASE 1

## Goal
Build a fully working React dashboard that looks production-ready, reads exclusively from local mock JSON files, and establishes all routes and UI patterns for future phases.

---

## Design Language

```
Theme:         Dark industrial / engineering-grade
Primary:       #0FF (electric cyan) — active states, badges, graphs
Background:    #0A0E17 (near-black navy)
Surface:       #111827 (card surfaces)
Surface-2:     #1A2332 (elevated panels)
Border:        #1E2D3D (subtle separators)
Text:          #E2E8F0 (primary), #94A3B8 (muted), #475569 (disabled)
Risk-critical: #EF4444 (red)
Risk-high:     #F97316 (orange)
Risk-medium:   #EAB308 (yellow)
Risk-low:      #22C55E (green)
Score-accent:  #06B6D4 (teal for score rings)

Font:          "JetBrains Mono" for code/numbers, "Syne" for headings, "Inter" for body
```

---

## Project Structure

```
frontend/
├── src/
│   ├── mock/
│   │   ├── repositories.json
│   │   ├── commits.json
│   │   ├── pull-requests.json
│   │   ├── evaluations.json
│   │   └── analytics.json
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── AppLayout.tsx
│   │   ├── ui/
│   │   │   ├── ScoreBadge.tsx
│   │   │   ├── RiskBadge.tsx
│   │   │   ├── StatusDot.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── LoadingShimmer.tsx
│   │   └── charts/
│   │       └── MiniSparkline.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Repositories.tsx
│   │   ├── RepositoryDetail.tsx
│   │   ├── Commits.tsx
│   │   ├── CommitDetail.tsx
│   │   ├── PullRequests.tsx
│   │   └── Settings.tsx
│   ├── hooks/
│   │   ├── useRepositories.ts
│   │   ├── useCommits.ts
│   │   └── usePullRequests.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── formatters.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

---

## Mock Data Files

### `src/mock/repositories.json`
```json
{
  "repositories": [
    {
      "id": "repo-001",
      "name": "api-gateway",
      "fullName": "acme-corp/api-gateway",
      "githubId": 123456001,
      "description": "Core API gateway handling all external traffic with rate limiting and auth",
      "language": "TypeScript",
      "defaultBranch": "main",
      "url": "https://github.com/acme-corp/api-gateway",
      "status": "active",
      "healthScore": 82,
      "totalCommits": 1247,
      "openPRs": 4,
      "stars": 89,
      "lastActivityAt": "2024-12-18T14:22:00Z",
      "createdAt": "2023-01-15T09:00:00Z"
    },
    {
      "id": "repo-002",
      "name": "ml-pipeline",
      "fullName": "acme-corp/ml-pipeline",
      "githubId": 123456002,
      "description": "Machine learning training and inference pipeline for recommendation engine",
      "language": "Python",
      "defaultBranch": "main",
      "url": "https://github.com/acme-corp/ml-pipeline",
      "status": "active",
      "healthScore": 61,
      "totalCommits": 634,
      "openPRs": 7,
      "stars": 45,
      "lastActivityAt": "2024-12-17T18:05:00Z",
      "createdAt": "2023-06-10T12:00:00Z"
    },
    {
      "id": "repo-003",
      "name": "frontend-dashboard",
      "fullName": "acme-corp/frontend-dashboard",
      "githubId": 123456003,
      "description": "React-based internal dashboard for analytics and monitoring",
      "language": "TypeScript",
      "defaultBranch": "develop",
      "url": "https://github.com/acme-corp/frontend-dashboard",
      "status": "active",
      "healthScore": 91,
      "totalCommits": 892,
      "openPRs": 2,
      "stars": 12,
      "lastActivityAt": "2024-12-18T11:33:00Z",
      "createdAt": "2023-03-22T08:30:00Z"
    },
    {
      "id": "repo-004",
      "name": "auth-service",
      "fullName": "acme-corp/auth-service",
      "githubId": 123456004,
      "description": "OAuth2 and JWT authentication microservice",
      "language": "Go",
      "defaultBranch": "main",
      "url": "https://github.com/acme-corp/auth-service",
      "status": "active",
      "healthScore": 74,
      "totalCommits": 421,
      "openPRs": 1,
      "stars": 34,
      "lastActivityAt": "2024-12-16T09:00:00Z",
      "createdAt": "2023-08-01T14:00:00Z"
    },
    {
      "id": "repo-005",
      "name": "legacy-monolith",
      "fullName": "acme-corp/legacy-monolith",
      "githubId": 123456005,
      "description": "Legacy PHP application — migration in progress",
      "language": "PHP",
      "defaultBranch": "master",
      "url": "https://github.com/acme-corp/legacy-monolith",
      "status": "inactive",
      "healthScore": 23,
      "totalCommits": 8821,
      "openPRs": 11,
      "stars": 3,
      "lastActivityAt": "2024-12-10T15:00:00Z",
      "createdAt": "2019-04-05T00:00:00Z"
    }
  ],
  "meta": {
    "total": 5,
    "active": 4,
    "inactive": 1
  }
}
```

### `src/mock/commits.json`
```json
{
  "commits": [
    {
      "id": "commit-001",
      "sha": "a4f8c2d1e9b3f7a0c5d8e2f1b4c7d0a3e6f9c2d5",
      "shortSha": "a4f8c2d",
      "message": "feat: add rate limiting middleware with Redis sliding window",
      "authorName": "Sarah Chen",
      "authorEmail": "s.chen@acme-corp.com",
      "authorAvatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      "repositoryId": "repo-001",
      "repositoryFullName": "acme-corp/api-gateway",
      "url": "https://github.com/acme-corp/api-gateway/commit/a4f8c2d",
      "additions": 312,
      "deletions": 48,
      "changedFiles": 7,
      "evaluationStatus": "completed",
      "evaluationId": "eval-001",
      "branch": "main",
      "committedAt": "2024-12-18T14:22:00Z"
    },
    {
      "id": "commit-002",
      "sha": "b7d9e4a2f1c8b5e3d0a7f4c1b8e5d2a9f6c3b0e7",
      "shortSha": "b7d9e4a",
      "message": "fix: resolve memory leak in connection pool manager",
      "authorName": "Marcus Lee",
      "authorEmail": "m.lee@acme-corp.com",
      "authorAvatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=marcus",
      "repositoryId": "repo-001",
      "repositoryFullName": "acme-corp/api-gateway",
      "url": "https://github.com/acme-corp/api-gateway/commit/b7d9e4a",
      "additions": 89,
      "deletions": 124,
      "changedFiles": 3,
      "evaluationStatus": "completed",
      "evaluationId": "eval-002",
      "branch": "main",
      "committedAt": "2024-12-18T11:05:00Z"
    },
    {
      "id": "commit-003",
      "sha": "c1e3f8d5b2a9e6d3c0f7a4b1e8c5f2a9d6b3e0c7",
      "shortSha": "c1e3f8d",
      "message": "chore: update model training hyperparameters for v2 run",
      "authorName": "Priya Patel",
      "authorEmail": "p.patel@acme-corp.com",
      "authorAvatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
      "repositoryId": "repo-002",
      "repositoryFullName": "acme-corp/ml-pipeline",
      "url": "https://github.com/acme-corp/ml-pipeline/commit/c1e3f8d",
      "additions": 45,
      "deletions": 38,
      "changedFiles": 4,
      "evaluationStatus": "pending",
      "evaluationId": null,
      "branch": "main",
      "committedAt": "2024-12-17T18:05:00Z"
    },
    {
      "id": "commit-004",
      "sha": "d4a7f2e9c6b3d0a7e4c1b8f5d2a9c6b3f0e7d4a1",
      "shortSha": "d4a7f2e",
      "message": "BREAKING: remove deprecated v1 endpoints without migration",
      "authorName": "Jake Wilson",
      "authorEmail": "j.wilson@acme-corp.com",
      "authorAvatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=jake",
      "repositoryId": "repo-002",
      "repositoryFullName": "acme-corp/ml-pipeline",
      "url": "https://github.com/acme-corp/ml-pipeline/commit/d4a7f2e",
      "additions": 0,
      "deletions": 891,
      "changedFiles": 18,
      "evaluationStatus": "completed",
      "evaluationId": "eval-003",
      "branch": "main",
      "committedAt": "2024-12-17T09:44:00Z"
    },
    {
      "id": "commit-005",
      "sha": "e8b1d4f7c2a5e8b1d4f7c2a5e8b1d4f7c2a5e8b1",
      "shortSha": "e8b1d4f",
      "message": "refactor: extract auth logic into composable hooks",
      "authorName": "Aisha Okafor",
      "authorEmail": "a.okafor@acme-corp.com",
      "authorAvatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=aisha",
      "repositoryId": "repo-003",
      "repositoryFullName": "acme-corp/frontend-dashboard",
      "url": "https://github.com/acme-corp/frontend-dashboard/commit/e8b1d4f",
      "additions": 234,
      "deletions": 312,
      "changedFiles": 14,
      "evaluationStatus": "completed",
      "evaluationId": "eval-004",
      "branch": "develop",
      "committedAt": "2024-12-18T11:33:00Z"
    },
    {
      "id": "commit-006",
      "sha": "f2c9e6a3d0b7f4c1a8e5b2f9d6c3b0a7e4c1f8b5",
      "shortSha": "f2c9e6a",
      "message": "security: patch SQL injection vulnerability in user search",
      "authorName": "Sarah Chen",
      "authorEmail": "s.chen@acme-corp.com",
      "authorAvatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      "repositoryId": "repo-005",
      "repositoryFullName": "acme-corp/legacy-monolith",
      "url": "https://github.com/acme-corp/legacy-monolith/commit/f2c9e6a",
      "additions": 22,
      "deletions": 15,
      "changedFiles": 2,
      "evaluationStatus": "failed",
      "evaluationId": null,
      "branch": "master",
      "committedAt": "2024-12-16T16:20:00Z"
    }
  ],
  "meta": {
    "total": 6,
    "byStatus": {
      "completed": 4,
      "pending": 1,
      "failed": 1
    }
  }
}
```

### `src/mock/pull-requests.json`
```json
{
  "pullRequests": [
    {
      "id": "pr-001",
      "prNumber": 247,
      "title": "feat: implement distributed tracing with OpenTelemetry",
      "body": "This PR adds full OpenTelemetry integration across all service boundaries. Includes span propagation, custom metrics, and Jaeger exporter configuration.",
      "authorName": "Sarah Chen",
      "authorAvatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      "repositoryId": "repo-001",
      "repositoryFullName": "acme-corp/api-gateway",
      "baseBranch": "main",
      "headBranch": "feat/otel-tracing",
      "state": "open",
      "riskLevel": "medium",
      "riskScore": 52,
      "additions": 1204,
      "deletions": 89,
      "changedFiles": 31,
      "commitsCount": 8,
      "evaluationStatus": "completed",
      "evaluationId": "eval-005",
      "mergedAt": null,
      "githubCreatedAt": "2024-12-16T10:00:00Z",
      "reviewers": ["Marcus Lee", "Jake Wilson"]
    },
    {
      "id": "pr-002",
      "prNumber": 93,
      "title": "BREAKING: replace entire data pipeline with streaming architecture",
      "body": "Major architectural overhaul replacing batch processing with Kafka streams. This will require all downstream consumers to update their integration.",
      "authorName": "Jake Wilson",
      "authorAvatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=jake",
      "repositoryId": "repo-002",
      "repositoryFullName": "acme-corp/ml-pipeline",
      "baseBranch": "main",
      "headBranch": "feat/kafka-streaming",
      "state": "open",
      "riskLevel": "critical",
      "riskScore": 91,
      "additions": 4821,
      "deletions": 2341,
      "changedFiles": 87,
      "commitsCount": 23,
      "evaluationStatus": "completed",
      "evaluationId": "eval-006",
      "mergedAt": null,
      "githubCreatedAt": "2024-12-14T09:00:00Z",
      "reviewers": ["Priya Patel"]
    },
    {
      "id": "pr-003",
      "prNumber": 156,
      "title": "fix: correct timezone handling in date picker component",
      "body": "Fixes timezone offset issue when users in non-UTC zones create events. Added comprehensive timezone tests.",
      "authorName": "Aisha Okafor",
      "authorAvatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=aisha",
      "repositoryId": "repo-003",
      "repositoryFullName": "acme-corp/frontend-dashboard",
      "baseBranch": "develop",
      "headBranch": "fix/timezone-datepicker",
      "state": "open",
      "riskLevel": "low",
      "riskScore": 14,
      "additions": 67,
      "deletions": 41,
      "changedFiles": 5,
      "commitsCount": 2,
      "evaluationStatus": "completed",
      "evaluationId": "eval-007",
      "mergedAt": null,
      "githubCreatedAt": "2024-12-18T08:00:00Z",
      "reviewers": ["Sarah Chen"]
    },
    {
      "id": "pr-004",
      "prNumber": 78,
      "title": "refactor: migrate JWT validation to centralized auth middleware",
      "body": "Centralizes all JWT validation logic to eliminate duplication across 12 route handlers.",
      "authorName": "Marcus Lee",
      "authorAvatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=marcus",
      "repositoryId": "repo-004",
      "repositoryFullName": "acme-corp/auth-service",
      "baseBranch": "main",
      "headBranch": "refactor/centralize-jwt",
      "state": "merged",
      "riskLevel": "high",
      "riskScore": 68,
      "additions": 891,
      "deletions": 634,
      "changedFiles": 22,
      "commitsCount": 6,
      "evaluationStatus": "completed",
      "evaluationId": "eval-008",
      "mergedAt": "2024-12-15T16:30:00Z",
      "githubCreatedAt": "2024-12-12T11:00:00Z",
      "reviewers": ["Sarah Chen", "Priya Patel"]
    },
    {
      "id": "pr-005",
      "prNumber": 248,
      "title": "docs: update API reference for v2 endpoints",
      "body": "Updates all documentation strings and README sections for the new v2 API.",
      "authorName": "Priya Patel",
      "authorAvatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
      "repositoryId": "repo-001",
      "repositoryFullName": "acme-corp/api-gateway",
      "baseBranch": "main",
      "headBranch": "docs/v2-api-reference",
      "state": "open",
      "riskLevel": "low",
      "riskScore": 8,
      "additions": 234,
      "deletions": 91,
      "changedFiles": 9,
      "commitsCount": 3,
      "evaluationStatus": "pending",
      "evaluationId": null,
      "mergedAt": null,
      "githubCreatedAt": "2024-12-18T13:00:00Z",
      "reviewers": []
    }
  ],
  "meta": {
    "total": 5,
    "byState": {
      "open": 4,
      "merged": 1,
      "closed": 0
    },
    "byRisk": {
      "critical": 1,
      "high": 1,
      "medium": 1,
      "low": 2
    }
  }
}
```

### `src/mock/evaluations.json`
```json
{
  "evaluations": [
    {
      "id": "eval-001",
      "targetId": "a4f8c2d1e9b3f7a0c5d8e2f1b4c7d0a3e6f9c2d5",
      "targetType": "commit",
      "repositoryId": "repo-001",
      "summary": "Well-structured implementation of Redis sliding window rate limiting. The approach correctly handles concurrent requests and provides accurate rate tracking. Minor concern around edge case when Redis is unreachable — a fallback strategy should be defined to prevent service degradation.",
      "qualityScore": 84,
      "securityScore": 91,
      "maintainabilityScore": 78,
      "overallScore": 84,
      "riskLevel": "low",
      "issues": [
        "No fallback behavior when Redis is unavailable",
        "Missing unit tests for edge case: requests at exact window boundary"
      ],
      "suggestions": [
        "Add circuit breaker pattern for Redis connectivity failures",
        "Consider extracting window size and limit to environment config",
        "Add metrics emission for rate limit hits"
      ],
      "fileAnalysis": [
        { "filename": "src/middleware/rate-limiter.ts", "risk": "low", "notes": "Core logic is clean and well-typed" },
        { "filename": "src/config/redis.config.ts", "risk": "low", "notes": "Hardcoded timeout values should be configurable" },
        { "filename": "tests/rate-limiter.spec.ts", "risk": "medium", "notes": "Missing boundary condition tests" }
      ],
      "status": "completed",
      "model": "gpt-4o",
      "tokensUsed": 2841
    },
    {
      "id": "eval-002",
      "targetId": "b7d9e4a2f1c8b5e3d0a7f4c1b8e5d2a9f6c3b0e7",
      "targetType": "commit",
      "repositoryId": "repo-001",
      "summary": "Effective fix for the connection pool memory leak. The root cause (missing connection release on error path) has been correctly identified and patched. The fix is minimal and targeted — good engineering discipline.",
      "qualityScore": 91,
      "securityScore": 88,
      "maintainabilityScore": 85,
      "overallScore": 88,
      "riskLevel": "low",
      "issues": [],
      "suggestions": [
        "Add integration test that simulates the error path to prevent regression"
      ],
      "fileAnalysis": [
        { "filename": "src/db/connection-pool.ts", "risk": "low", "notes": "Fix is correct and minimal" }
      ],
      "status": "completed",
      "model": "gpt-4o",
      "tokensUsed": 1204
    },
    {
      "id": "eval-003",
      "targetId": "d4a7f2e9c6b3d0a7e4c1b8f5d2a9c6b3f0e7d4a1",
      "targetType": "commit",
      "repositoryId": "repo-002",
      "summary": "HIGH RISK: This commit removes 891 lines of v1 endpoint code without a deprecation period or migration guide. Downstream services that depend on v1 endpoints will break immediately upon deployment. This change should be reverted and re-planned with proper versioning strategy.",
      "qualityScore": 12,
      "securityScore": 40,
      "maintainabilityScore": 8,
      "overallScore": 18,
      "riskLevel": "critical",
      "issues": [
        "No deprecation notice given to consumers of v1 endpoints",
        "No migration documentation provided",
        "Breaking change introduced without version bump",
        "18 files deleted without corresponding updates to consumers",
        "No rollback plan documented"
      ],
      "suggestions": [
        "Revert this commit immediately",
        "Create a proper deprecation timeline: announce → 30-day warning → remove",
        "Provide migration guide for all v1 consumers",
        "Use API versioning strategy instead of deletion"
      ],
      "fileAnalysis": [
        { "filename": "api/v1/*", "risk": "critical", "notes": "All v1 routes deleted without warning" }
      ],
      "status": "completed",
      "model": "gpt-4o",
      "tokensUsed": 3821
    },
    {
      "id": "eval-005",
      "targetId": "247",
      "targetType": "pull_request",
      "repositoryId": "repo-001",
      "summary": "Solid OpenTelemetry integration with proper span propagation across service boundaries. The implementation follows OTel best practices. Medium risk due to the number of files changed and the cross-cutting nature of the change — careful staged rollout recommended.",
      "qualityScore": 78,
      "securityScore": 82,
      "maintainabilityScore": 74,
      "overallScore": 78,
      "riskLevel": "medium",
      "issues": [
        "Jaeger exporter credentials are hardcoded in one file",
        "Missing sampling rate configuration — defaults to 100% which will impact performance",
        "No documentation on how to run Jaeger locally for development"
      ],
      "suggestions": [
        "Move Jaeger credentials to environment variables",
        "Add configurable sampling rate (recommend 10% in prod)",
        "Add local development setup instructions to README"
      ],
      "fileAnalysis": [
        { "filename": "src/telemetry/tracer.ts", "risk": "medium", "notes": "Hardcoded exporter config" },
        { "filename": "src/middleware/tracing.middleware.ts", "risk": "low", "notes": "Well implemented" }
      ],
      "status": "completed",
      "model": "gpt-4o",
      "tokensUsed": 5241
    },
    {
      "id": "eval-006",
      "targetId": "93",
      "targetType": "pull_request",
      "repositoryId": "repo-002",
      "summary": "CRITICAL: This PR represents a complete architectural replacement of the batch data pipeline with Kafka streaming. While the streaming approach is architecturally sound, this PR requires a phased migration strategy. 87 files changed, 4821 additions — this is too large to safely review or merge as a single unit.",
      "qualityScore": 54,
      "securityScore": 48,
      "maintainabilityScore": 41,
      "overallScore": 48,
      "riskLevel": "critical",
      "issues": [
        "PR size is too large — exceeds safe review threshold by 10x",
        "No feature flag or parallel-run strategy included",
        "Kafka consumer group configuration missing error handling",
        "No load testing results provided for streaming throughput",
        "Dead letter queue (DLQ) not implemented for failed messages",
        "Schema registry integration incomplete"
      ],
      "suggestions": [
        "Split into at least 5 smaller PRs with a dependency graph",
        "Implement parallel-run mode with feature flag before cutover",
        "Add DLQ for failed Kafka messages",
        "Provide load test results showing equivalent or better throughput",
        "Complete schema registry integration before merge"
      ],
      "fileAnalysis": [
        { "filename": "src/kafka/producer.ts", "risk": "high", "notes": "Missing error handling on produce" },
        { "filename": "src/kafka/consumer.ts", "risk": "critical", "notes": "No DLQ, no retry logic" }
      ],
      "status": "completed",
      "model": "gpt-4o",
      "tokensUsed": 8934
    }
  ]
}
```

### `src/mock/analytics.json`
```json
{
  "kpis": {
    "totalRepositories": 5,
    "activeRepositories": 4,
    "totalCommitsThisWeek": 47,
    "openPullRequests": 4,
    "criticalRiskItems": 2,
    "averageHealthScore": 66,
    "evaluationsCompleted": 24,
    "averageQualityScore": 71
  },
  "commitActivity": [
    { "date": "2024-12-12", "commits": 8, "prs": 1 },
    { "date": "2024-12-13", "commits": 12, "prs": 2 },
    { "date": "2024-12-14", "commits": 6, "prs": 1 },
    { "date": "2024-12-15", "commits": 15, "prs": 3 },
    { "date": "2024-12-16", "commits": 9, "prs": 2 },
    { "date": "2024-12-17", "commits": 11, "prs": 1 },
    { "date": "2024-12-18", "commits": 14, "prs": 2 }
  ],
  "riskDistribution": [
    { "level": "critical", "count": 2, "color": "#EF4444" },
    { "level": "high", "count": 3, "color": "#F97316" },
    { "level": "medium", "count": 7, "color": "#EAB308" },
    { "level": "low", "count": 12, "color": "#22C55E" }
  ],
  "developerLeaderboard": [
    {
      "name": "Sarah Chen",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      "commits": 18,
      "averageScore": 87,
      "riskLevel": "low"
    },
    {
      "name": "Aisha Okafor",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=aisha",
      "commits": 14,
      "averageScore": 82,
      "riskLevel": "low"
    },
    {
      "name": "Marcus Lee",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=marcus",
      "commits": 11,
      "averageScore": 74,
      "riskLevel": "medium"
    },
    {
      "name": "Priya Patel",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
      "commits": 9,
      "averageScore": 69,
      "riskLevel": "medium"
    },
    {
      "name": "Jake Wilson",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=jake",
      "commits": 7,
      "averageScore": 31,
      "riskLevel": "critical"
    }
  ],
  "healthScoreTrend": [
    { "date": "2024-12-12", "score": 71 },
    { "date": "2024-12-13", "score": 68 },
    { "date": "2024-12-14", "score": 65 },
    { "date": "2024-12-15", "score": 70 },
    { "date": "2024-12-16", "score": 63 },
    { "date": "2024-12-17", "score": 64 },
    { "date": "2024-12-18", "score": 66 }
  ]
}
```

---

## TypeScript Types

### `src/types/index.ts`
```typescript
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type EvalStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type PRState = 'open' | 'closed' | 'merged';
export type RepoStatus = 'active' | 'inactive' | 'archived';

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  githubId: number;
  description: string;
  language: string;
  defaultBranch: string;
  url: string;
  status: RepoStatus;
  healthScore: number;
  totalCommits: number;
  openPRs: number;
  stars: number;
  lastActivityAt: string;
  createdAt: string;
}

export interface Commit {
  id: string;
  sha: string;
  shortSha: string;
  message: string;
  authorName: string;
  authorEmail: string;
  authorAvatar: string;
  repositoryId: string;
  repositoryFullName: string;
  url: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  evaluationStatus: EvalStatus;
  evaluationId: string | null;
  branch: string;
  committedAt: string;
}

export interface PullRequest {
  id: string;
  prNumber: number;
  title: string;
  body: string;
  authorName: string;
  authorAvatar: string;
  repositoryId: string;
  repositoryFullName: string;
  baseBranch: string;
  headBranch: string;
  state: PRState;
  riskLevel: RiskLevel;
  riskScore: number;
  additions: number;
  deletions: number;
  changedFiles: number;
  commitsCount: number;
  evaluationStatus: EvalStatus;
  evaluationId: string | null;
  mergedAt: string | null;
  githubCreatedAt: string;
  reviewers: string[];
}

export interface FileAnalysis {
  filename: string;
  risk: RiskLevel;
  notes: string;
}

export interface Evaluation {
  id: string;
  targetId: string;
  targetType: 'commit' | 'pull_request';
  repositoryId: string;
  summary: string;
  qualityScore: number;
  securityScore: number;
  maintainabilityScore: number;
  overallScore: number;
  riskLevel: RiskLevel;
  issues: string[];
  suggestions: string[];
  fileAnalysis: FileAnalysis[];
  status: EvalStatus;
  model: string;
  tokensUsed: number;
}
```

---

## Hooks (Mock Data Layer)

### `src/hooks/useRepositories.ts`
```typescript
import { useMemo, useState } from 'react';
import repoData from '../mock/repositories.json';
import { Repository } from '../types';

export function useRepositories() {
  const [search, setSearch] = useState('');

  const repositories: Repository[] = useMemo(() => {
    const all = repoData.repositories as Repository[];
    if (!search) return all;
    return all.filter(
      (r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.language.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search]);

  return { repositories, search, setSearch, meta: repoData.meta };
}

export function useRepository(id: string) {
  const repo = (repoData.repositories as Repository[]).find((r) => r.id === id);
  return { repository: repo ?? null };
}
```

### `src/hooks/useCommits.ts`
```typescript
import { useMemo, useState } from 'react';
import commitData from '../mock/commits.json';
import { Commit } from '../types';

export function useCommits(repositoryId?: string) {
  const [search, setSearch] = useState('');

  const commits: Commit[] = useMemo(() => {
    let all = commitData.commits as Commit[];
    if (repositoryId) all = all.filter((c) => c.repositoryId === repositoryId);
    if (search) {
      all = all.filter(
        (c) =>
          c.message.toLowerCase().includes(search.toLowerCase()) ||
          c.authorName.toLowerCase().includes(search.toLowerCase()) ||
          c.shortSha.includes(search),
      );
    }
    return all.sort((a, b) => new Date(b.committedAt).getTime() - new Date(a.committedAt).getTime());
  }, [repositoryId, search]);

  return { commits, search, setSearch, meta: commitData.meta };
}
```

### `src/hooks/usePullRequests.ts`
```typescript
import { useMemo, useState } from 'react';
import prData from '../mock/pull-requests.json';
import { PullRequest, RiskLevel, PRState } from '../types';

export function usePullRequests(repositoryId?: string) {
  const [stateFilter, setStateFilter] = useState<PRState | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');

  const pullRequests: PullRequest[] = useMemo(() => {
    let all = prData.pullRequests as PullRequest[];
    if (repositoryId) all = all.filter((p) => p.repositoryId === repositoryId);
    if (stateFilter !== 'all') all = all.filter((p) => p.state === stateFilter);
    if (riskFilter !== 'all') all = all.filter((p) => p.riskLevel === riskFilter);
    return all.sort((a, b) => b.riskScore - a.riskScore);
  }, [repositoryId, stateFilter, riskFilter]);

  return { pullRequests, stateFilter, setStateFilter, riskFilter, setRiskFilter, meta: prData.meta };
}
```

---

## Page Designs

---

### Page 1 — Dashboard (`/`)

**Layout**: Full-width dark dashboard with sidebar nav

**Sections (top to bottom)**:

1. **Top Stats Bar** — 4 KPI cards in a row
   - "5 Repositories" with small repo icon
   - "47 Commits this week" with git commit icon
   - "4 Open PRs" with PR icon
   - "2 Critical Risks 🔴" — this card has a subtle red glow border to demand attention

2. **Middle Section** — 2-column grid (60/40 split)
   - LEFT: "Commit Activity" — area chart showing last 7 days, dual lines for commits and PRs, electric cyan fill
   - RIGHT: "Risk Distribution" — donut/ring chart showing critical/high/medium/low counts with legend

3. **Bottom Section** — 2-column grid (50/50)
   - LEFT: "Recent Commits" — table showing last 5 commits with author avatar, short sha, message truncated, repo badge, eval status dot
   - RIGHT: "Developer Leaderboard" — ranked list with avatar, name, commit count, avg score badge, risk indicator

**Design notes**:
- KPI cards: dark surface with cyan number, muted label, thin top border in cyan
- Charts use recharts library
- All tables have hover row highlight (#1A2332)
- "Critical Risks" KPI pulses with a slow red animation

---

### Page 2 — Repositories (`/repositories`)

**Layout**: Full-width table/grid view

**Header area**:
- Title "Repositories" with count badge
- Search input with magnifier icon (searches by name, language, description)
- Status filter tabs: All | Active | Inactive

**Content**: Card grid (3 columns on desktop, 1 on mobile)

Each repository card contains:
- **Header row**: repo name (bold, JetBrains Mono), language badge (colored by language), status dot
- **Description**: 2-line truncated description in muted gray
- **Health Score bar**: Full-width progress bar with score number. Color transitions: green (80+), yellow (60-79), orange (40-59), red (<40)
- **Stats row**: `⬆ 1,247 commits` · `↗ 4 open PRs` · `⭐ 89`
- **Footer**: Last activity relative time ("2 hours ago") · External GitHub link icon

**Design notes**:
- Cards have a left border (4px) colored by health score
- Inactive repos have 50% opacity with an "ARCHIVED" overlay tag
- Health score bar animates in on load

---

### Page 3 — Repository Detail (`/repositories/:id`)

**Layout**: Side-panel detail page

**Header**:
- Breadcrumb: Repositories > api-gateway
- Repo name large, language badge, external GitHub link
- Health score as a large circular gauge (SVG ring, animated fill)
- 4 mini stat badges: Commits, Open PRs, Stars, Branch

**Tabs** (below header): `Commits` | `Pull Requests` | `Activity`

**Commits tab**:
- List of commits (most recent first)
- Each row: short SHA (monospace cyan), commit message, author avatar + name, time ago, eval status badge, additions/deletions diff numbers (green/red)

**Pull Requests tab**:
- List of PRs for this repo only
- Each row: PR number (#247), title, risk badge (colored), state badge, author, changed files count, created time

**Activity tab** (Phase 1 placeholder):
- Empty state with "Activity chart coming in Phase 6" message with chart icon

**Design notes**:
- Circular health gauge uses SVG stroke-dashoffset animation
- Active tab has cyan underline
- Sticky repo header on scroll

---

### Page 4 — Commits (`/commits`)

**Layout**: Full-page table

**Header**:
- Title + count
- Search bar (filter by message, author, SHA)
- Repo filter dropdown
- Eval status filter: All | Completed | Pending | Failed

**Table columns**:
| SHA | Repository | Author | Message | Changed | Eval Status | Time |
|---|---|---|---|---|---|---|
| `a4f8c2d` (cyan mono) | badge | avatar + name | truncated message | +312 / -48 | status pill | "2h ago" |

**Row interactions**:
- Click row → navigate to `/commits/:sha`
- Hover → row highlight

**Eval status pills**:
- ✅ Completed — green dot + "Completed"
- ⏳ Pending — yellow pulsing dot + "Pending"
- ❌ Failed — red dot + "Failed"
- 🔄 Processing — spinning cyan dot + "Processing"

---

### Page 5 — Commit Detail (`/commits/:sha`)

**Layout**: Split panel

**LEFT panel (40%)**:
- SHA in large monospace
- Author card (avatar, name, email)
- Repository link badge
- Branch badge
- Timestamp
- File diff stats: `+312 additions` (green), `-48 deletions` (red), `7 files changed`

**RIGHT panel (60%)** — AI Evaluation:
- Section title "AI Evaluation" with model badge ("gpt-4o")
- **If evaluation completed**: Show full evaluation breakdown
  - Overall Score: Large circular gauge
  - 3 score bars: Quality / Security / Maintainability
  - Risk badge
  - Summary text block
  - "Issues Found" list with red ✕ icons
  - "Suggestions" list with cyan → icons
  - "File Analysis" accordion/table
- **If pending**: Skeleton loader with "Evaluation queued..." message
- **If failed**: Error state with retry placeholder button

---

### Page 6 — Pull Requests (`/pull-requests`)

**Layout**: Filterable list view

**Header**:
- Title + open PR count
- Filter row: State (All/Open/Merged/Closed) | Risk Level (All/Critical/High/Medium/Low) | Repo dropdown
- Sort: By risk score (default) | By date | By size

**PR List**: Card-based list (not table)

Each PR card:
- **Left accent bar**: 8px wide, colored by risk level (red/orange/yellow/green)
- **Header row**: PR number + title (bold), risk badge, state badge
- **Meta row**: repo · branch arrow (`main ← feat/otel`) · author avatar + name · "2 days ago"
- **Stats row**: `+1,204 / -89` additions/deletions · `31 files` · `8 commits`
- **Footer** (if eval completed): Score bar mini preview with "Score: 78"

**Critical risk PRs** appear in a separate "⚠ Needs Attention" section at the top.

---

### Page 7 — Settings (`/settings`)

**Phase 1 placeholder page**

**Layout**: Centered content with sections

**Sections**:
1. **GitHub Integration** — "Connect your GitHub account in Phase 2" with GitHub icon and disabled "Connect GitHub" button styled button
2. **AI Configuration** — placeholder fields for API key and model selection (disabled)
3. **Notification Rules** — "Configure automation rules in Phase 5" placeholder
4. **Danger Zone** — placeholder section with future delete/reset options

**Design notes**:
- Disabled sections have a lock icon overlay
- Clean form-like layout, even though inputs are non-functional
- Shows the future shape of the settings system

---

## Layout Components

### Sidebar Design

**Width**: 260px (collapsible to 72px icon-only mode)

**Structure (top to bottom)**:
```
┌─────────────────────────────┐
│  ⬡ CodeIntel               │  ← Logo + name
├─────────────────────────────┤
│  Navigation                 │
│  ○ Dashboard         /      │
│  ○ Repositories    /repos   │
│  ○ Commits        /commits  │
│  ○ Pull Requests    /prs    │
├─────────────────────────────┤
│  (spacer)                   │
├─────────────────────────────┤
│  ○ Settings       /settings │
│                             │
│  [MOCK DATA MODE badge]     │
│  "Phase 1 — No API"         │
└─────────────────────────────┘
```

**Active nav item**: Cyan left border + slightly lighter background + cyan text
**Inactive**: Muted gray text, hover shows subtle background

**"MOCK DATA" badge** at bottom of sidebar: amber/yellow pill that shows engineers this is Phase 1 — disappears in Phase 2 when real API is connected.

---

### TopBar Design

**Height**: 64px
**Background**: Slightly lighter than sidebar (#111827)

**Left**: Breadcrumb / current page title
**Center**: Empty in Phase 1 (search goes here in Phase 7)
**Right**: 
- Notification bell (placeholder, badge shows "2" for critical items)
- Avatar placeholder
- "Mock Mode" indicator chip in amber

---

## Utility: Formatters

### `src/utils/formatters.ts`
```typescript
import { formatDistanceToNow, format } from 'date-fns';

export function timeAgo(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy HH:mm');
}

export function truncateCommitMessage(msg: string, length = 72): string {
  if (msg.length <= length) return msg;
  return msg.slice(0, length) + '…';
}

export function formatDiff(additions: number, deletions: number): string {
  return `+${additions.toLocaleString()} / -${deletions.toLocaleString()}`;
}

export function scoreColor(score: number): string {
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#EAB308';
  if (score >= 40) return '#F97316';
  return '#EF4444';
}

export function riskColor(level: string): string {
  const map: Record<string, string> = {
    low: '#22C55E',
    medium: '#EAB308',
    high: '#F97316',
    critical: '#EF4444',
  };
  return map[level] ?? '#94A3B8';
}

export function languageColor(lang: string): string {
  const map: Record<string, string> = {
    TypeScript: '#3178C6',
    JavaScript: '#F7DF1E',
    Python: '#3776AB',
    Go: '#00ADD8',
    PHP: '#777BB4',
    Rust: '#CE422B',
    Java: '#ED8B00',
  };
  return map[lang] ?? '#64748B';
}
```

---

## Routing Setup

### `src/App.tsx`
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Repositories } from './pages/Repositories';
import { RepositoryDetail } from './pages/RepositoryDetail';
import { Commits } from './pages/Commits';
import { CommitDetail } from './pages/CommitDetail';
import { PullRequests } from './pages/PullRequests';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="repositories" element={<Repositories />} />
          <Route path="repositories/:id" element={<RepositoryDetail />} />
          <Route path="commits" element={<Commits />} />
          <Route path="commits/:sha" element={<CommitDetail />} />
          <Route path="pull-requests" element={<PullRequests />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Package Dependencies (Frontend)

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.27.0",
    "@tanstack/react-query": "^5.62.0",
    "recharts": "^2.13.0",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.460.0",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "typescript": "^5.6.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0"
  }
}
```

---

## Tailwind Config

### `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0A0E17',
          surface: '#111827',
          elevated: '#1A2332',
        },
        border: {
          subtle: '#1E2D3D',
          default: '#2D3E52',
        },
        accent: {
          cyan: '#00FFFF',
          'cyan-dim': '#06B6D4',
        },
        risk: {
          critical: '#EF4444',
          high: '#F97316',
          medium: '#EAB308',
          low: '#22C55E',
        },
        text: {
          primary: '#E2E8F0',
          muted: '#94A3B8',
          disabled: '#475569',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        body: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

---

## Phase 1 Completion Checklist

### Backend ✓
- [ ] NestJS app bootstraps without errors
- [ ] MongoDB connection established
- [ ] Redis connection established
- [ ] All 4 schemas defined (Repository, Commit, PullRequest, Evaluation)
- [ ] BullMQ queues registered (3 queues)
- [ ] `GET /api/v1/health` returns `{"status":"ok"}`
- [ ] `GET /api/v1/health/queues` returns queue counts
- [ ] Docker Compose starts all services cleanly
- [ ] Logging outputs structured JSON in production mode

### Frontend ✓
- [ ] Vite + React app starts on port 5173
- [ ] All 5 mock JSON files created and populated
- [ ] Sidebar navigation works for all 7 routes
- [ ] Dashboard renders KPI cards from analytics.json
- [ ] Repositories page lists all repos from repositories.json
- [ ] Repository detail page shows tabs and commit list
- [ ] Commits page shows filterable table
- [ ] Commit detail shows evaluation data from evaluations.json
- [ ] Pull Requests page shows risk-sorted list
- [ ] Settings page renders as placeholder
- [ ] "MOCK DATA MODE" indicator visible in sidebar
- [ ] Dark theme applied consistently
- [ ] Responsive layout works on mobile

### Integration Gate (Phase 2 Ready)
- [ ] Mock hook interfaces match the schema field names exactly
- [ ] All TypeScript types align with Mongoose schema fields
- [ ] Hook return signatures are documented (Phase 2 swaps JSON import for API call)
- [ ] Backend health endpoint is reachable from browser

---

## Phase 2 Transition Note

When Phase 2 begins, the **only change** needed in the frontend hooks is:

```typescript
// Phase 1 (mock)
import repoData from '../mock/repositories.json';
const repositories = repoData.repositories as Repository[];

// Phase 2 (real API) — same hook interface, different data source
const { data } = useQuery({
  queryKey: ['repositories'],
  queryFn: () => fetch('/api/v1/repositories').then(r => r.json()),
});
const repositories = data?.repositories ?? [];
```

The pages, types, and components require **zero changes** — only the data source in the hooks changes.
