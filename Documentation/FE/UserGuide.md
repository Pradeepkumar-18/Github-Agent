# AI GitHub Code Intelligence Agent — User Guide

> **Audience:** Developers and engineering leads using the dashboard to monitor repository health, commits, and pull requests.

---

## Navigation

The sidebar contains **6 main tabs**. Each is described in detail below.

| Tab | Icon | Purpose |
|---|---|---|
| [Dashboard](#1-dashboard) | 📊 | Overview KPIs, charts, and recent activity |
| [Repositories](#2-repositories) | 📁 | Manage and connect GitHub / GitLab projects |
| [Commits](#3-commits) | 🔀 | Browse, search, and fetch commit history |
| [Pull Requests](#4-pull-requests) | 🔃 | Monitor, filter, and fetch merge requests |
| [Evaluations](#5-evaluations--detail-views) | 🔍 | AI-powered code analysis per commit or PR |
| [Settings](#6-settings) | ⚙️ | App configuration and preferences |

---

## 1. Dashboard

The command center for your engineering operations. All data shown here is drawn live from your connected repositories.

### KPI Cards (top row)
| Card | What it shows |
|---|---|
| **Repositories** | Total connected repos + count that are "active" |
| **Commits This Week** | Commits across all repos in the last 7 days |
| **Open Pull Requests** | Currently open PRs / MRs |
| **Critical Risks** | High-severity issues flagged by AI evaluation |

> **Note:** The Dashboard currently uses pre-seeded analytics data for charts while live AI evaluation (Phase 3) is pending.

### Chart: Engineering Velocity
- **Blue area** = commits over time
- **Purple area** = pull requests over time
- Hover over any point for exact values

### Chart: Risk Distribution
- Donut chart showing the ratio of **Low / Medium / High / Critical** risk items across all evaluated commits and PRs

### Recent Security Checks
- Shows the last 5 commits and their AI evaluation status
- Click any row to jump to the full commit detail

### Top Contributors
- Ranked by number of contributions
- Displays each developer's average quality score and risk indicator dot

---

## 2. Repositories

Connect and manage your GitHub and GitLab projects.

### Browsing Repositories

- Each card shows: **repo name**, **full name**, **description**, **health score bar**, commit count, open PR count, language badge, provider badge (🐙 GitHub / 🦊 GitLab), and last activity time.
- **Health Score** — a 0–100 percentage showing overall code quality. Color changes: 🟢 green (>75), 🟡 yellow (>50), 🔴 red (<50).

### Searching

Type in the search bar to filter repos by **name** or **language** in real time.

### Status Filter

Use the **All / Active / Inactive** toggle to narrow the list.

### Adding a Repository

1. Click the **"Add Repo"** button (top right)
2. Select your provider using the toggle:
   - **🐙 GitHub** (default) — button turns blue
   - **🦊 GitLab** — button turns orange
3. Fill in the form:
   | Field | Description | Example |
   |---|---|---|
   | **Owner** | GitHub username, org, or GitLab namespace | `octocat` / `my-group` |
   | **Repository Name** | Short repo name (no prefix) | `hello-world` |
   | **Personal Access Token** | PAT from your provider (encrypted on save) | `ghp_...` / `glpat-...` |
4. Click **"Add Repository"**

**GitHub PAT:** Settings → Developer settings → Personal access tokens → Tokens (classic) → scope: `repo`  
**GitLab PAT:** User Settings → Access Tokens → scope: `api`

> 🔒 Tokens are encrypted with AES-256-GCM on the server and never returned in any API response.

### Clicking a Repo

Navigate to the **Repository Detail** page, which shows full metadata and links to its commits and PRs.

---

## 3. Commits

Browse all commits stored for your connected repositories, or trigger a fresh GitHub/GitLab fetch.

### What You See

Each commit row shows:
- **Short SHA** (clickable)
- **Author avatar + name**
- **Commit message** (truncated)
- **Date**
- **Evaluation status** dot: 🟢 Completed · 🟡 Pending/Processing · 🔴 Failed
- **Additions / Deletions / Files changed**

### Fetching Commits from GitHub / GitLab

> By default the list only shows commits already stored in MongoDB. To import fresh data:

1. Select a **Repository** from the dropdown
2. Set a **Since** date (start of range)
3. Set an **Until** date (end of range)
4. Click **"Fetch from GitHub"** or **"Fetch from GitLab"**

The backend will paginate through the provider API, collect all commits in that window, and upsert them into the database. The table refreshes automatically.

### Filtering

- **Search** by SHA, author name, or commit message
- **Filter by status**: All / Pending / Processing / Completed / Failed

### Pagination

Use the page controls at the bottom to page through large result sets (20 commits per page by default).

### Viewing a Commit Detail

Click any commit row to open the **Commit Detail** page, which shows the full diff stats and, once Phase 3 is live, the AI evaluation report.

---

## 4. Pull Requests

Monitor pull requests (GitHub) and merge requests (GitLab) for all connected repositories.

### What You See

Each PR card shows:
- **PR number** and **title**
- **Author** and **date created**
- **State badge**: `open` / `closed` / `merged`
- **Risk level badge**: `low` / `medium` / `high` / `critical`
- **Additions, deletions, files changed**
- **Reviewers** (if any)

### Fetching PRs from GitHub / GitLab

Same workflow as Commits:

1. Select a **Repository**
2. Set **Since** and **Until** dates
3. Click **"Fetch from GitHub"** / **"Fetch from GitLab"**

> GitLab fetches **Merge Requests** — they behave identically and show under the same view.

### Filtering

- **State filter**: All / Open / Closed / Merged
- **Risk filter**: All / Low / Medium / High / Critical

### Viewing a PR Detail

Click any PR row to open the **PR Detail** page, which shows the full analysis report once Phase 3 AI evaluation is active.

---

## 5. Evaluations / Detail Views

> ⚠️ **Phase 3 feature** — AI evaluation is not yet active. Detail pages are visible but evaluation scores will show as "pending" until Phase 3 is deployed.

### Commit Detail Page

Accessed by clicking any commit. Shows:
- Full commit metadata (SHA, author, date, branch)
- Diff stats (additions / deletions / files)
- **AI Evaluation report** *(Phase 3)*:
  - Quality Score, Security Score, Maintainability Score, Overall Score
  - Issues found
  - Suggestions for improvement
  - Per-file risk breakdown

### PR / MR Detail Page

Accessed by clicking any pull request. Shows:
- PR metadata (number, title, author, branches, state)
- Code change summary
- **AI Risk Assessment** *(Phase 3)*:
  - Risk Level classification
  - Summary of findings
  - Reviewer recommendations

---

## 6. Settings

Configure global application preferences.

> Settings page is reserved for Phase 3 configuration, including:
> - Selecting the AI model (OpenAI GPT / Google Gemini)
> - Toggling which types of evaluations to run
> - Managing notification preferences

---

## Glossary

| Term | Meaning |
|---|---|
| **Health Score** | Weighted average of security, quality, and maintainability across a repo (0–100) |
| **Engineering Velocity** | Combined rate of commits + PRs over time — a measure of team throughput |
| **Risk Level: Critical** | Immediate action required; potential security breach or system failure |
| **Risk Level: High** | Should be addressed before next release |
| **Risk Level: Medium** | Moderate improvements needed; watch for future degradation |
| **Risk Level: Low** | Minor suggestions; generally follows best practices |
| **Evaluation Status: Pending** | Queued for AI analysis |
| **Evaluation Status: Processing** | AI analysis currently running |
| **Evaluation Status: Completed** | Analysis finished, results available |
| **Evaluation Status: Failed** | Analysis encountered an error — retry or check logs |
| **PAT** | Personal Access Token — a scoped API credential from GitHub or GitLab |
| **MR** | Merge Request — GitLab equivalent of a GitHub Pull Request |

---

*Last updated: February 2026 — Phase 2 (Live GitHub/GitLab Integration)*
