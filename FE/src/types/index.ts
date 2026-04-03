export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type EvalStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type PRState = 'open' | 'closed' | 'merged';
export type RepoStatus = 'active' | 'inactive' | 'archived';

export interface Repository {
    id: string;
    _id?: string;                       // Mongoose returns _id
    name: string;
    fullName: string;
    githubId: number;                   // also used for GitLab project ID
    provider: 'github' | 'gitlab';      // NEW in Phase 2
    owner: string;                      // NEW in Phase 2
    repo: string;                       // NEW in Phase 2
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
    _id?: string;
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

export interface PRComment {
    authorName: string;
    authorAvatar: string;
    body: string;
    createdAt: string;
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
