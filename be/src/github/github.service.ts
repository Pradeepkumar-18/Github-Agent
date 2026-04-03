import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import type { GitProviderService, NormalizedCommit, NormalizedPullRequest } from '../common/git-provider.interface';

@Injectable()
export class GithubService implements GitProviderService {
    private readonly logger = new Logger(GithubService.name);
    private readonly baseUrl = 'https://api.github.com';

    private buildHeaders(token: string): Record<string, string> {
        return {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
        };
    }

    private async request<T>(url: string, token: string, method: string = 'GET', body?: any): Promise<T> {
        const options: RequestInit = {
            method,
            headers: this.buildHeaders(token),
        };

        if (body) {
            options.body = JSON.stringify(body);
            options.headers = { ...options.headers, 'Content-Type': 'application/json' };
        }

        const response = await fetch(url, options);

        if (response.status === 403) {
            const remaining = response.headers.get('x-ratelimit-remaining');
            if (remaining === '0') {
                const reset = response.headers.get('x-ratelimit-reset');
                const resetDate = reset ? new Date(Number(reset) * 1000).toISOString() : 'unknown';
                throw new HttpException(
                    `GitHub rate limit exceeded. Resets at ${resetDate}`,
                    HttpStatus.TOO_MANY_REQUESTS,
                );
            }
        }

        if (!response.ok) {
            const body = await response.text();
            this.logger.error(`GitHub API error [${response.status}] ${url}: ${body}`);
            throw new HttpException(
                `GitHub API returned ${response.status}: ${response.statusText}`,
                response.status,
            );
        }

        return response.json() as Promise<T>;
    }

    async validateRepository(owner: string, repo: string, token: string) {
        const ghRepo = await this.request<any>(`${this.baseUrl}/repos/${owner}/${repo}`, token);
        return {
            githubId: ghRepo.id as number,
            name: ghRepo.name as string,
            fullName: ghRepo.full_name as string,
            description: (ghRepo.description ?? '') as string,
            language: (ghRepo.language ?? '') as string,
            defaultBranch: (ghRepo.default_branch ?? 'main') as string,
            url: ghRepo.html_url as string,
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

        while (true) {
            const url = `${this.baseUrl}/repos/${owner}/${repo}/commits?since=${since}&until=${until}&per_page=${perPage}&page=${page}`;
            const batch = await this.request<any[]>(url, token);
            if (!batch.length) break;

            for (const c of batch) {
                // Fetch detail for stats
                let additions = 0, deletions = 0, changedFiles = 0;
                try {
                    const detail = await this.request<any>(`${this.baseUrl}/repos/${owner}/${repo}/commits/${c.sha}`, token);
                    additions = detail.stats?.additions ?? 0;
                    deletions = detail.stats?.deletions ?? 0;
                    changedFiles = detail.files?.length ?? 0;
                } catch { /* non-critical */ }

                allCommits.push({
                    sha: c.sha,
                    message: c.commit.message,
                    authorName: c.commit.author.name,
                    authorEmail: c.commit.author.email,
                    authorAvatar: c.author?.avatar_url ?? '',
                    url: c.html_url,
                    committedAt: c.commit.author.date,
                    additions,
                    deletions,
                    changedFiles,
                });
            }

            if (batch.length < perPage) break;
            page++;
        }

        this.logger.log(`GitHub: fetched ${allCommits.length} commits from ${owner}/${repo}`);
        return allCommits;
    }

    async fetchPullRequestsByDateRange(
        owner: string,
        repo: string,
        token: string,
        since: string,
        until: string,
    ): Promise<NormalizedPullRequest[]> {
        const allPRs: NormalizedPullRequest[] = [];
        let page = 1;
        const perPage = 100;
        const sinceDate = new Date(since).getTime();
        const untilDate = new Date(until).getTime();

        while (true) {
            const url = `${this.baseUrl}/repos/${owner}/${repo}/pulls?state=all&sort=created&direction=desc&per_page=${perPage}&page=${page}`;
            const batch = await this.request<any[]>(url, token);
            if (!batch.length) break;

            for (const pr of batch) {
                const created = new Date(pr.created_at).getTime();
                if (created < sinceDate || created > untilDate) continue;

                // Fetch detail for additions/deletions
                let additions = 0, deletions = 0, changedFiles = 0, commitsCount = 0;
                try {
                    const detail = await this.request<any>(
                        `${this.baseUrl}/repos/${owner}/${repo}/pulls/${pr.number}`, token
                    );
                    additions = detail.additions ?? 0;
                    deletions = detail.deletions ?? 0;
                    changedFiles = detail.changed_files ?? 0;
                    commitsCount = detail.commits ?? 0;
                } catch { /* non-critical */ }

                const state: 'open' | 'closed' | 'merged' =
                    pr.merged_at ? 'merged' : pr.state === 'closed' ? 'closed' : 'open';

                allPRs.push({
                    prNumber: pr.number,
                    title: pr.title,
                    body: pr.body ?? '',
                    authorName: pr.user.login,
                    authorAvatar: pr.user.avatar_url,
                    baseBranch: pr.base.ref,
                    headBranch: pr.head.ref,
                    state,
                    additions,
                    deletions,
                    changedFiles,
                    commitsCount,
                    mergedAt: pr.merged_at ?? null,
                    createdAt: pr.created_at,
                    reviewers: (pr.requested_reviewers ?? []).map((r: any) => r.login as string),
                });
            }

            const oldestInBatch = new Date(batch[batch.length - 1].created_at).getTime();
            if (oldestInBatch < sinceDate || batch.length < perPage) break;
            page++;
        }

        this.logger.log(`GitHub: fetched ${allPRs.length} PRs from ${owner}/${repo}`);
        return allPRs;
    }

    async fetchPullRequestFiles(
        owner: string,
        repo: string,
        token: string,
        prNumber: number,
    ): Promise<import('../common/git-provider.interface').NormalizedFileChange[]> {
        const url = `${this.baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100`;
        const files = await this.request<any[]>(url, token);

        return files.map(f => ({
            filename: f.filename,
            status: f.status as any,
            additions: f.additions,
            deletions: f.deletions,
            patch: f.patch,
        }));
    }

    async mergePullRequest(
        owner: string,
        repo: string,
        token: string,
        prNumber: number,
        commitMessage?: string,
    ): Promise<{ sha: string; merged: boolean }> {
        const url = `${this.baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}/merge`;
        const body = commitMessage ? { commit_message: commitMessage } : {};
        const result = await this.request<any>(url, token, 'PUT', body);

        return {
            sha: result.sha,
            merged: result.merged,
        };
    }

    async fetchPullRequestComments(
        owner: string,
        repo: string,
        token: string,
        prNumber: number,
    ): Promise<import('../common/git-provider.interface').NormalizedPRComment[]> {
        // GitHub PR comments are technically issue comments
        const url = `${this.baseUrl}/repos/${owner}/${repo}/issues/${prNumber}/comments`;
        const comments = await this.request<any[]>(url, token);

        return comments.map(c => ({
            authorName: c.user.login,
            authorAvatar: c.user.avatar_url,
            body: c.body,
            createdAt: c.created_at,
        }));
    }

    async addComment(
        owner: string,
        repo: string,
        token: string,
        prNumber: number,
        body: string,
    ): Promise<void> {
        const url = `${this.baseUrl}/repos/${owner}/${repo}/issues/${prNumber}/comments`;
        await this.request<any>(url, token, 'POST', { body });
    }

    async closePullRequest(
        owner: string,
        repo: string,
        token: string,
        prNumber: number,
    ): Promise<void> {
        const url = `${this.baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}`;
        await this.request<any>(url, token, 'PATCH', { state: 'closed' });
    }
}



