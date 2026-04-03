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
 * Normalized file change shape for code diffs.
 */
export interface NormalizedFileChange {
    filename: string;
    status: 'added' | 'modified' | 'removed' | 'renamed' | 'copied';
    additions: number;
    deletions: number;
    patch?: string; // The diff content
}

/**
 * Normalized pull request comment shape.
 */
export interface NormalizedPRComment {
    authorName: string;
    authorAvatar: string;
    body: string;
    createdAt: string;
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

    /**
     * Fetch the list of files changed in a specific PR/MR.
     */
    fetchPullRequestFiles(
        owner: string,
        repo: string,
        token: string,
        prNumber: number,
    ): Promise<NormalizedFileChange[]>;

    /**
     * Merge the PR/MR in the Git provider.
     */
    mergePullRequest(
        owner: string,
        repo: string,
        token: string,
        prNumber: number,
        commitMessage?: string,
    ): Promise<{ sha: string; merged: boolean }>;

    /**
     * Fetch all comments for a specific PR/MR.
     */
    fetchPullRequestComments(
        owner: string,
        repo: string,
        token: string,
        prNumber: number,
    ): Promise<NormalizedPRComment[]>;

    /**
     * Add a comment to the PR/MR thread.
     */
    addComment(
        owner: string,
        repo: string,
        token: string,
        prNumber: number,
        body: string,
    ): Promise<void>;

    /**
     * Close the PR/MR without merging.
     */
    closePullRequest(
        owner: string,
        repo: string,
        token: string,
        prNumber: number,
    ): Promise<void>;
}



