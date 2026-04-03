import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import type { GitProviderService, NormalizedCommit, NormalizedPullRequest } from '../common/git-provider.interface';

@Injectable()
export class GitlabService implements GitProviderService {
    private readonly logger = new Logger(GitlabService.name);
    private readonly baseUrl = 'https://gitlab.com/api/v4';

    private buildHeaders(token: string): Record<string, string> {
        return {
            'PRIVATE-TOKEN': token,
            'Content-Type': 'application/json',
        };
    }

    /** Encode "owner/repo" as "owner%2Frepo" for GitLab project paths */
    private encodePath(owner: string, repo: string): string {
        return encodeURIComponent(`${owner}/${repo}`);
    }

    private async request<T>(url: string, token: string): Promise<T> {
        const response = await fetch(url, { headers: this.buildHeaders(token) });

        if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after') ?? 'unknown';
            throw new HttpException(
                `GitLab rate limit exceeded. Retry after ${retryAfter}s`,
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        if (!response.ok) {
            const body = await response.text();
            this.logger.error(`GitLab API error [${response.status}] ${url}: ${body}`);
            throw new HttpException(
                `GitLab API returned ${response.status}: ${response.statusText}`,
                response.status,
            );
        }

        return response.json() as Promise<T>;
    }

    async validateRepository(owner: string, repo: string, token: string) {
        const path = this.encodePath(owner, repo);
        const project = await this.request<any>(`${this.baseUrl}/projects/${path}`, token);
        return {
            githubId: project.id as number,         // using GitLab project ID
            name: project.name as string,
            fullName: project.path_with_namespace as string,
            description: (project.description ?? '') as string,
            language: '' as string,                 // GitLab doesn't expose main language easily
            defaultBranch: (project.default_branch ?? 'main') as string,
            url: project.web_url as string,
        };
    }

    async fetchCommitsByDateRange(
        owner: string,
        repo: string,
        token: string,
        since: string,
        until: string,
    ): Promise<NormalizedCommit[]> {
        const allCommits: NormalizedCommit[] = [];
        let page = 1;
        const perPage = 100;
        const path = this.encodePath(owner, repo);

        while (true) {
            const url = `${this.baseUrl}/projects/${path}/repository/commits?since=${since}&until=${until}&per_page=${perPage}&page=${page}&with_stats=true`;
            const batch = await this.request<any[]>(url, token);
            if (!batch.length) break;

            for (const c of batch) {
                allCommits.push({
                    sha: c.id,                          // GitLab uses 'id' for commit SHA
                    message: c.title,
                    authorName: c.author_name,
                    authorEmail: c.author_email,
                    authorAvatar: '',                   // GitLab requires separate user lookup
                    url: c.web_url,
                    committedAt: c.authored_date,
                    additions: c.stats?.additions ?? 0,
                    deletions: c.stats?.deletions ?? 0,
                    changedFiles: 0,                    // not in commit list; available via diffs endpoint
                });
            }

            if (batch.length < perPage) break;
            page++;
        }

        this.logger.log(`GitLab: fetched ${allCommits.length} commits from ${owner}/${repo}`);
        return allCommits;
    }

    async fetchPullRequestsByDateRange(
        owner: string,
        repo: string,
        token: string,
        since: string,
        until: string,
    ): Promise<NormalizedPullRequest[]> {
        const allMRs: NormalizedPullRequest[] = [];
        let page = 1;
        const perPage = 100;
        const path = this.encodePath(owner, repo);
        const sinceDate = new Date(since).getTime();
        const untilDate = new Date(until).getTime();

        while (true) {
            // GitLab MR states: opened, closed, merged, all
            const url = `${this.baseUrl}/projects/${path}/merge_requests?state=all&order_by=created_at&sort=desc&per_page=${perPage}&page=${page}&created_after=${since}&created_before=${until}`;
            const batch = await this.request<any[]>(url, token);
            if (!batch.length) break;

            for (const mr of batch) {
                const created = new Date(mr.created_at).getTime();
                if (created < sinceDate || created > untilDate) continue;

                // Fetch MR details for changes count
                let additions = 0, deletions = 0, changedFiles = 0, commitsCount = 0;
                try {
                    const detail = await this.request<any>(
                        `${this.baseUrl}/projects/${path}/merge_requests/${mr.iid}?include_rebase_in_progress=false`, token
                    );
                    // GitLab doesn't provide additions/deletions in MR detail directly.
                    // changes_count is available as a string.
                    changedFiles = parseInt(detail.changes_count ?? '0', 10) || 0;
                    commitsCount = detail.commits_count ?? 0;
                } catch { /* non-critical */ }

                // Map GitLab states: 'opened' → 'open', 'closed' → 'closed', 'merged' → 'merged'
                const rawState: string = mr.state;
                const state: 'open' | 'closed' | 'merged' =
                    rawState === 'merged' ? 'merged' :
                        rawState === 'closed' ? 'closed' : 'open';

                allMRs.push({
                    prNumber: mr.iid,                   // GitLab uses iid (internal project ID)
                    title: mr.title,
                    body: mr.description ?? '',
                    authorName: mr.author?.username ?? '',
                    authorAvatar: mr.author?.avatar_url ?? '',
                    baseBranch: mr.target_branch,
                    headBranch: mr.source_branch,
                    state,
                    additions,
                    deletions,
                    changedFiles,
                    commitsCount,
                    mergedAt: mr.merged_at ?? null,
                    createdAt: mr.created_at,
                    reviewers: (mr.reviewers ?? []).map((r: any) => r.username as string),
                });
            }

            if (batch.length < perPage) break;
            page++;
        }

        this.logger.log(`GitLab: fetched ${allMRs.length} MRs from ${owner}/${repo}`);
        return allMRs;
    }
}
