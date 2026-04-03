# Phase 2 — Live GitHub & GitLab Integration

## Overview

Phase 2 replaces all mock data with real API integration. Repositories can be connected from either **GitHub** or **GitLab** using a Personal Access Token (PAT). Commits and Pull Requests (MRs) are fetched on-demand for any date range, normalized to a common format, and persisted in MongoDB.

---

## What Was Built

| Area | Changes |
|---|---|
| **Provider Abstraction** | Shared `GitProviderService` interface — both providers implement the same methods |
| **GitHub Integration** | `GithubService` — GitHub REST API v3, token auth, pagination, rate-limit detection |
| **GitLab Integration** | `GitlabService` — GitLab REST API v4, `PRIVATE-TOKEN` auth, MR mapping, pagination |
| **Repository Management** | Create, list, verify repos; store encrypted PAT; route to correct provider |
| **Commits** | Fetch by date range, upsert to MongoDB, paginated listing |
| **Pull Requests** | Fetch MRs/PRs by date range, upsert to MongoDB, state/risk filtering |
| **PAT Encryption** | AES-256-GCM encryption for all stored tokens |

---

## New Module Structure

```
be/src/
├── common/
│   ├── git-provider.interface.ts    # Shared interface (NormalizedCommit, NormalizedPullRequest)
│   └── crypto.util.ts               # AES-256-GCM encrypt/decrypt
├── github/
│   ├── github.service.ts            # GitHub REST API v3 client
│   └── github.module.ts
├── gitlab/
│   ├── gitlab.service.ts            # GitLab REST API v4 client
│   └── gitlab.module.ts
├── repositories/
│   ├── repositories.controller.ts
│   ├── repositories.service.ts      # Verifies repo, encrypts/decrypts PAT, routes provider
│   ├── repositories.module.ts
│   └── dto/
│       └── create-repository.dto.ts
├── commits/
│   ├── commits.controller.ts
│   ├── commits.service.ts           # Fetches & upserts commits
│   ├── commits.module.ts
│   └── dto/
│       └── fetch-commits.dto.ts
└── pull-requests/
    ├── pull-requests.controller.ts
    ├── pull-requests.service.ts     # Fetches & upserts PRs/MRs
    ├── pull-requests.module.ts
    └── dto/
        └── fetch-pull-requests.dto.ts
```

---

## Provider Abstraction

### Interface (`common/git-provider.interface.ts`)

Both `GithubService` and `GitlabService` implement `GitProviderService`:

```ts
interface GitProviderService {
  validateRepository(owner, repo, token): Promise<RepoMetadata>
  fetchCommitsByDateRange(owner, repo, token, since, until): Promise<NormalizedCommit[]>
  fetchPullRequestsByDateRange(owner, repo, token, since, until): Promise<NormalizedPullRequest[]>
}
```

**`NormalizedCommit`** fields: `sha`, `message`, `authorName`, `authorEmail`, `authorAvatar`, `url`, `committedAt`, `additions`, `deletions`, `changedFiles`

**`NormalizedPullRequest`** fields: `prNumber`, `title`, `body`, `authorName`, `authorAvatar`, `baseBranch`, `headBranch`, `state`, `additions`, `deletions`, `changedFiles`, `commitsCount`, `mergedAt`, `createdAt`, `reviewers`

---

## GitHub vs GitLab API Mapping

| Concept | GitHub | GitLab |
|---|---|---|
| Base URL | `https://api.github.com` | `https://gitlab.com/api/v4` |
| Auth header | `Authorization: token ghp_xxx` | `PRIVATE-TOKEN: glpat-xxx` |
| Project lookup | `GET /repos/{owner}/{repo}` | `GET /projects/{owner}%2F{repo}` |
| Commits | `GET /repos/.../commits` | `GET /projects/.../repository/commits` |
| PRs / MRs | `GET /repos/.../pulls` | `GET /projects/.../merge_requests` |
| PR state values | `open`, `closed` + `merged_at` | `opened`, `closed`, `merged` |
| Project ID field | `id` (integer) | `id` (integer) |

---

## PAT Security

All Personal Access Tokens are encrypted before storage using `AES-256-GCM`:

```ts
// crypto.util.ts
encrypt(token: string, key: string): string   // stored in DB
decrypt(ciphertext: string, key: string): string  // used at fetch time
```

- The `encryptedToken` field on `Repository` has `select: false` — it is **never returned** in API responses
- The key is set via `ENCRYPTION_KEY` environment variable (minimum 32 characters)
- `RepositoriesService.getProviderConfig()` decrypts on-demand for fetch operations only

---

## API Endpoints

### Repositories

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/repositories` | Add a repository (verify + store encrypted PAT) |
| `GET` | `/api/v1/repositories` | List all connected repositories |
| `GET` | `/api/v1/repositories/:id` | Get a single repository by ID |

**POST `/api/v1/repositories` — Request body:**
```json
{
  "owner": "Pradeepkumar-18",
  "repo": "pradeep-portfolio",
  "token": "ghp_xxxx",
  "provider": "github"
}
```
> `provider` is optional and defaults to `"github"`. Use `"gitlab"` for GitLab repos.

---

### Commits

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/commits/fetch` | Trigger GitHub/GitLab fetch for a date range |
| `GET` | `/api/v1/commits` | List stored commits (paginated) |
| `GET` | `/api/v1/commits/:sha` | Get a single commit by SHA |

**POST `/api/v1/commits/fetch` — Request body:**
```json
{
  "repositoryId": "67abc123...",
  "since": "2025-01-01T00:00:00.000Z",
  "until": "2026-02-28T23:59:59.000Z"
}
```

**GET `/api/v1/commits` — Query parameters:**
| Param | Type | Default |
|---|---|---|
| `repositoryId` | string | (all repos) |
| `page` | number | 1 |
| `limit` | number | 20 |

---

### Pull Requests

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/pull-requests/fetch` | Trigger GitHub/GitLab fetch for a date range |
| `GET` | `/api/v1/pull-requests` | List stored PRs/MRs |
| `GET` | `/api/v1/pull-requests/:prNumber` | Get a single PR/MR |

**POST `/api/v1/pull-requests/fetch` — Request body:**
```json
{
  "repositoryId": "67abc123...",
  "since": "2025-01-01T00:00:00.000Z",
  "until": "2026-02-28T23:59:59.000Z"
}
```

---

## Data Flow

```
UI (Add Repo)
  → POST /repositories
    → Verify repo exists via GitHub/GitLab API
    → Encrypt PAT with AES-256-GCM
    → Store in MongoDB

UI (Fetch Commits)
  → POST /commits/fetch
    → RepositoriesService.getProviderConfig(repoId)
      → Decrypt PAT
      → Determine provider (github | gitlab)
    → GithubService or GitlabService.fetchCommitsByDateRange()
      → Paginate GitHub/GitLab API
      → Map to NormalizedCommit[]
    → Upsert into MongoDB commits collection
    → Return { fetched, upserted, skipped }
```

---

## Environment Variables (Phase 2 Additions)

```env
# Existing (Phase 1)
PORT=3000
MONGODB_URI=mongodb://localhost:27017/code_intelligence

# New in Phase 2
ENCRYPTION_KEY=your_32_char_minimum_key_here!!
```

> Generate a secure key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Error Handling

| Scenario | HTTP Status | Details |
|---|---|---|
| Invalid PAT / repo not found | 400 | `"Could not verify repo with provided token"` |
| GitHub rate limit hit | 429 | Includes reset timestamp |
| GitLab rate limit hit | 429 | Includes retry-after seconds |
| Repository not found in DB | 404 | Standard NestJS NotFoundException |
| Missing encryption key | 500 | `"ENCRYPTION_KEY not configured"` |

---

## Schema Changes (from Phase 1)

### Repository

```diff
+ provider: 'github' | 'gitlab'    // defaults to 'github'
+ owner: string                     // GitHub username or GitLab namespace  
+ repo: string                      // Repository slug
+ encryptedToken: string | null     // AES-256-GCM encrypted PAT (select: false)
```

Unique index added: `{ owner, repo, provider }`

---

## Provider Token Formats

| Provider | PAT Format | Required Scope |
|---|---|---|
| **GitHub** | `ghp_xxxxxxxxxxxx` | `repo` |
| **GitLab** | `glpat-xxxxxxxxxxxx` | `api` |

---

## Known Limitations (Phase 2)

- GitLab commits do not return **additions/deletions** at the list level — only available via individual commit diff API (avoided to reduce API calls)
- GitLab MRs do not expose **additions/deletions** directly — `changes_count` is available as a string
- `changedFiles` for commits defaults to `0` for GitLab (requires separate diffs call)
- All commits are stored with `evaluationStatus: 'pending'` — AI evaluation is Phase 3

---

*Last updated: February 2026 — Phase 2 Live Integration*
