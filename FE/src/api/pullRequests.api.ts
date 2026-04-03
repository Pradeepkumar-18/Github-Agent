import { api } from './api';
import type { AxiosResponse } from 'axios';
import type { PullRequest } from '../types';

export interface FetchPullRequestsPayload {
    repositoryId: string;
    since: string;
    until: string;
}

export interface FetchResult {
    fetched: number;
    upserted: number;
    skipped: number;
}

export const pullRequestsApi = {
    fetchFromGitHub: (payload: FetchPullRequestsPayload): Promise<FetchResult> =>
        api.post<FetchResult>('/pull-requests/fetch', payload).then((r: AxiosResponse<FetchResult>) => r.data),

    getAll: (params: { repositoryId?: string; search?: string }): Promise<PullRequest[]> =>
        api.get<PullRequest[]>('/pull-requests', { params }).then((r: AxiosResponse<PullRequest[]>) => r.data),

    getByNumber: (prNumber: number): Promise<PullRequest> =>
        api.get<PullRequest>(`/pull-requests/${prNumber}`).then((r: AxiosResponse<PullRequest>) => r.data),
};
