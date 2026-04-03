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

export interface NormalizedFileChange {
    filename: string;
    status: 'added' | 'modified' | 'removed' | 'renamed' | 'copied';
    additions: number;
    deletions: number;
    patch?: string;
}

export const pullRequestsApi = {
    fetchFromGitHub: (payload: FetchPullRequestsPayload): Promise<FetchResult> =>
        api.post<FetchResult>('/pull-requests/fetch', payload).then((r: AxiosResponse<FetchResult>) => r.data),

    getAll: (params: { repositoryId?: string; search?: string }): Promise<PullRequest[]> =>
        api.get<PullRequest[]>('/pull-requests', { params }).then((r: AxiosResponse<PullRequest[]>) => r.data),

    getById: (id: string): Promise<PullRequest> =>
        api.get<PullRequest>(`/pull-requests/${id}`).then((r: AxiosResponse<PullRequest>) => r.data),

    getFiles: (id: string): Promise<NormalizedFileChange[]> =>
        api.get<NormalizedFileChange[]>(`/pull-requests/${id}/files`).then((r: AxiosResponse<NormalizedFileChange[]>) => r.data),

    merge: (id: string, commitMessage?: string): Promise<{ success: boolean; sha: string }> =>
        api.post<{ success: boolean; sha: string }>(`/pull-requests/${id}/merge`, { commitMessage }).then((r: AxiosResponse<{ success: boolean; sha: string }>) => r.data),


    getComments: (id: string): Promise<import('../types').PRComment[]> =>
        api.get<import('../types').PRComment[]>(`/pull-requests/${id}/comments`).then((r: AxiosResponse<import('../types').PRComment[]>) => r.data),

    postComment: (id: string, body: string): Promise<void> =>
        api.post(`/pull-requests/${id}/comments`, { body }).then(() => { }),

    close: (id: string, reason?: string): Promise<void> =>
        api.post(`/pull-requests/${id}/close`, { reason }).then(() => { }),
};




