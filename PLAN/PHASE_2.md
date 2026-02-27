# Phase 2 --- Real GitHub Integration (No Mock Data)

## AI GitHub Code Intelligence Agent

------------------------------------------------------------------------

## 🎯 Objective

Transition from Phase 1 infrastructure to a fully connected system
using:

-   Real GitHub repositories
-   Personal Access Token (PAT) authentication
-   On-demand commit fetching by time range
-   On-demand pull request fetching by time range
-   MongoDB persistence
-   Fully connected React frontend
-   No mock data
-   No webhooks
-   No GitHub App (for now)

This phase converts the system from UI prototype to live
GitHub-integrated platform.

------------------------------------------------------------------------

# 🏗 Architecture Overview

React UI\
↓\
NestJS API\
↓\
GitHub REST API (via PAT)\
↓\
MongoDB\
↓\
React UI

This is a pull-based model triggered manually from the UI.

------------------------------------------------------------------------

# 🔐 Authentication Strategy

-   Use GitHub Personal Access Token (PAT)
-   Store encrypted in database
-   Never expose token to frontend
-   Use minimal scope (`repo` read-only recommended)

------------------------------------------------------------------------

# 🧱 Backend Implementation

## 1️⃣ Repository Module

### Schema Updates

Add the following fields to the `Repository` schema:

``` ts
owner: string;
repo: string;
encryptedToken: string; // select: false
```

### Endpoints

POST /api/v1/repositories\
GET /api/v1/repositories\
GET /api/v1/repositories/:id

------------------------------------------------------------------------

## 2️⃣ GitHub Service

Create:

src/github/github.service.ts

### Responsibilities

-   Fetch commits by date range
-   Fetch commit details (diff)
-   Fetch PRs by date range
-   Fetch PR details
-   Fetch PR files

### GitHub API Used

Commits by date\
GET /repos/{owner}/{repo}/commits?since=ISO_DATE&until=ISO_DATE

Single commit detail\
GET /repos/{owner}/{repo}/commits/{sha}

Pull requests\
GET /repos/{owner}/{repo}/pulls?state=all

PR detail\
GET /repos/{owner}/{repo}/pulls/{number}\
GET /repos/{owner}/{repo}/pulls/{number}/files

------------------------------------------------------------------------

## 3️⃣ Commits Module

### Fetch Commits by Date Range

POST /api/v1/commits/fetch

Request Body:

{ "repositoryId": "mongo-id", "since": "2024-12-01T00:00:00Z", "until":
"2024-12-18T23:59:59Z" }

### List Commits (Paginated)

GET /api/v1/commits?repositoryId=...&page=1&limit=20

### Commit Detail

GET /api/v1/commits/:sha

------------------------------------------------------------------------

## 4️⃣ Pull Requests Module

### Fetch PRs by Date Range

POST /api/v1/pull-requests/fetch

Request Body:

{ "repositoryId": "mongo-id", "since": "2024-12-01T00:00:00Z", "until":
"2024-12-18T23:59:59Z" }

### List PRs

GET /api/v1/pull-requests?repositoryId=...

### PR Detail

GET /api/v1/pull-requests/:number

------------------------------------------------------------------------

# 🔒 Security Rules

-   Encrypt PAT before storing
-   Use select:false in schema
-   Never return PAT in API response
-   Never log PAT
-   Handle GitHub rate limits

------------------------------------------------------------------------

# 🔄 Redis Usage

Not required in Phase 2.

Queue infrastructure remains ready for Phase 3 (AI evaluation).

------------------------------------------------------------------------

# 📈 What Phase 2 Achieves

After completing Phase 2:

-   Repositories can be configured
-   Commits can be fetched by time range
-   PRs can be fetched by time range
-   Commit detail shows real GitHub diff
-   PR detail shows real stats
-   MongoDB stores real GitHub data
-   UI fully connected to backend
-   Mock data fully removed

------------------------------------------------------------------------

# ✅ Phase 2 Completion Checklist

## Backend

-   [ ] Repository config endpoints implemented
-   [ ] GitHub service created
-   [ ] Commit fetch endpoint working
-   [ ] PR fetch endpoint working
-   [ ] Pagination implemented
-   [ ] Token encryption added

## Frontend

-   [ ] Mock hooks removed
-   [ ] Repo configuration UI added
-   [ ] Date range fetch for commits
-   [ ] Date range fetch for PRs
-   [ ] Error handling added
-   [ ] Loading states implemented

------------------------------------------------------------------------

# 🚀 End Result

You now have a Live GitHub Integrated Platform ready for Phase 3 --- AI
Evaluation Engine.
