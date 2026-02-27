# Backend Architectural Modules

The AI GitHub Code Intelligence Agent backend is built using **NestJS**, following a modular architecture. This document outlines the core infrastructure and foundational modules established in Phase 1.

## Foundational Modules

### 1. ConfigModule (`src/config`)
Manages environment variables and application-wide settings.
- **Provider**: `ConfigService`
- **Key Features**: Strong typing for configuration, support for various environments (development, production), and centralized access to external API keys (GitHub, AI).

### 2. DatabaseModule (`src/database`)
Handles the connection and interaction with **MongoDB** using Mongoose.
- **Provider**: `MongooseModule`
- **Key Features**: Connection pooling, model registration, and health monitoring.

### 3. QueueModule (`src/queue`)
Orchestrates asynchronous background tasks using **BullMQ** and **Redis**.
- **Queues**:
  - `commit-evaluation`: For processing git commit analysis.
  - `pr-evaluation`: For assessing pull requests.
  - `notification`: For outbound system alerts and comments.
- **Key Features**: Exponential backoff, job retries, and high-performance job processing.

### 4. HealthModule (`src/health`)
Provides system health status and monitoring endpoints.
- **Indicator**: `Terminus`
- **Monitored Components**:
  - MongoDB connectivity
  - Queue job counts
  - Memory consumption (Heap)

### 5. LoggerModule (`src/logger`)
Standardized logging utility wrapping **Winston**.
- **Provider**: `AppLogger`
- **Key Features**: Context-aware logging, multiple transports (console, files), and standardized formatting.

---

## Data Models (Schemas)

The following core entities are defined within `src/schemas`:

| Model | Purpose |
| :--- | :--- |
| **Repository** | Metadata for monitored git repositories (Health scores, star counts, activity). |
| **Commit** | Individual git commit data including diff stats and evaluation status. |
| **PullRequest** | PR metadata, risk levels, and assessment links. |
| **Evaluation** | AI-generated reports including scores for Security, Maintainability, and Quality. |

---

## Next Steps (Planned Modules)
In Phase 2, the following feature modules will be implemented:
- **RepositoryModule**: CRUD and management of monitored projects.
- **AnalysisModule**: Interaction with AI models and evaluation logic.
- **GithubModule**: Webhook handling and API interaction with GitLab/GitHub.
