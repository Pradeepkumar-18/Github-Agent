# Phase 2 — Live GitHub & GitLab Integration

## Overview

Phase 2 replaces all mock data with real API integration. Repositories can be connected from either **GitHub** or **GitLab** using a Personal Access Token (PAT). Commits and Pull Requests (MRs) are fetched on-demand for any date range, normalized to a common format, and persisted in MongoDB.

---

## What Was Built

| **Pull Requests** | Fetch MRs/PRs by date range, upsert to MongoDB, state/risk filtering |
| **PAT Encryption** | AES-256-GCM encryption for all stored tokens |
| **Verify & Merge** | Write-back action to formally merge PRs/MRs from the dashboard |
| **Discussion Threads** | Fetch existing team comments and post new architectural decisions |
| **Decline & Close** | Formal PR termination workflow with automated closing rationales |
| **Premium UI** | Syntax highlighting (Prism.js), Markdown rendering, and custom Modals/Toasts |


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

interface GitProviderService {
  validateRepository(owner, repo, token): Promise<RepoMetadata>
  fetchCommitsByDateRange(owner, repo, token, since, until): Promise<NormalizedCommit[]>
  fetchPullRequestsByDateRange(owner, repo, token, since, until): Promise<NormalizedPullRequest[]>
  fetchPullRequestFiles(owner, repo, token, prNumber): Promise<NormalizedFileChange[]>
  mergePullRequest(owner, repo, token, prNumber, message?): Promise<{sha, merged}>
  fetchPullRequestComments(owner, repo, token, prNumber): Promise<NormalizedPRComment[]>
  addComment(owner, repo, token, prNumber, body): Promise<void>
  closePullRequest(owner, repo, token, prNumber): Promise<void>
}
```

**`NormalizedPRComment`** fields: `authorName`, `authorAvatar`, `body`, `createdAt`


**`NormalizedCommit`** fields: `sha`, `message`, `authorName`, `authorEmail`, `authorAvatar`, `url`, `committedAt`, `additions`, `deletions`, `changedFiles`

**`NormalizedPullRequest`** fields: `prNumber`, `title`, `body`, `authorName`, `authorAvatar`, `baseBranch`, `headBranch`, `state`, `additions`, `deletions`, `changedFiles`, `commitsCount`, `mergedAt`, `createdAt`, `reviewers`

**`NormalizedFileChange`** fields: `filename`, `status`, `additions`, `deletions`, `patch` (diff string)

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

| `POST` | `/api/v1/pull-requests/fetch` | Trigger GitHub/GitLab fetch for a date range |
| `GET` | `/api/v1/pull-requests` | List stored PRs/MRs |
| `GET` | `/api/v1/pull-requests/:id` | Get a single PR/MR by unique MongoDB ID |
| `POST` | `/api/v1/pull-requests/:id/merge` | Formally merge the PR on the provider |
| `POST` | `/api/v1/pull-requests/:id/close` | Formally close the PR (optionally with a reason) |
| `GET` | `/api/v1/pull-requests/:id/comments` | Fetch live discussion thread from provider |
| `POST` | `/api/v1/pull-requests/:id/comments` | Post a new comment to the PR thread |
| `GET` | `/api/v1/pull-requests/:id/files` | Get the list of changed files and their diffs (patches) |


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

## UI Features (Actionable Integration)

### 🎨 Premium Aesthetics
- **Syntax Highlighting**: Uses `Prism.js` with "Tomorrow Night" theme for code diffs. Supports TS, JS, PY, GO, JSON.
- **Rich Markdown**: PR descriptions and discussion threads rendered with `react-markdown` and `Tailwind Typography`.
- **Reusable Component Layer**:
    - `Modal.tsx`: High-fidelity confirmation dialogs with glassmorphism backdrops.
    - `Toast.tsx`: Non-blocking success/error notifications.
    - `PRDiscussion.tsx`: Threaded conversation viewer for architectural review.

### ⚡ Architectural Actions
- **ID-Based Routing**: All URLs use unique MongoDB object IDs (e.g., `/pull-requests/67abc...`) instead of numeric PR numbers. This prevents collisions across multiple repositories.
- **Decline Workflow**: Closing a PR via the dashboard requires (or encourages) a "Closing Reason," which is automatically posted as a final comment on the PR.
- **Optimistic Sync**: When a PR is merged or closed, the local database state is updated immediately to reflect the new reality without requiring a full re-fetch.

---

## Known Limitations (Phase 2+)

- GitLab commits still do not return **additions/deletions** at the list level.
- AI automated risk scoring is still pending (scheduled for **Phase 3**).
- Webhooks are not yet implemented; state changes made outside the dashboard require a "Fetch" to synchronize.

---

*Last updated: April 2026 — Phase 2 Actionable Integration*

