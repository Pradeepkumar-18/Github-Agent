/**
 * Normalized commit shape returned by both GitHub and GitLab providers.
 * Both provider services map their raw API responses to this format.
 */
export interface NormalizedCommit {
    sha: string;
    message: string;
    authorName: string;
    authorEmail: string;
    authorAvatar: string;
    url: string;
    committedAt: string; // ISO 8601
    additions: number;
    deletions: number;
    changedFiles: number;
}

/**
 * Normalized pull request / merge request shape.
 */
export interface NormalizedPullRequest {
    prNumber: number;       // GitHub PR number or GitLab MR iid
    title: string;
    body: string;
    authorName: string;
    authorAvatar: string;
    baseBranch: string;
    headBranch: string;
    state: 'open' | 'closed' | 'merged';
    additions: number;
    deletions: number;
    changedFiles: number;
    commitsCount: number;
    mergedAt: string | null;
    createdAt: string;
    reviewers: string[];
}

/**
 * Common interface that both GithubService and GitlabService implement.
 */
export interface GitProviderService {
    /**
     * Verify the token and return basic repo metadata.
     */
    validateRepository(owner: string, repo: string, token: string): Promise<{
        githubId: number;
        name: string;
        fullName: string;
        description: string;
        language: string;
        defaultBranch: string;
        url: string;
    }>;

    fetchCommitsByDateRange(
        owner: string,
        repo: string,
        token: string,
        since: string,
        until: string,
    ): Promise<NormalizedCommit[]>;

    fetchPullRequestsByDateRange(
        owner: string,
        repo: string,
        token: string,
        since: string,
        until: string,
    ): Promise<NormalizedPullRequest[]>;
}
