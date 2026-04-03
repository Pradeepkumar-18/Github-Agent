import { api } from './api';
import type { AxiosResponse } from 'axios';
import type { Commit } from '../types';

export interface FetchCommitsPayload {
    repositoryId: string;
    since: string;
    until: string;
}

export interface CommitsListResponse {
    data: Commit[];
    total: number;
    page: number;
    limit: number;
}

export interface FetchResult {
    fetched: number;
    upserted: number;
    skipped: number;
}

export const commitsApi = {
    fetchFromGitHub: (payload: FetchCommitsPayload): Promise<FetchResult> =>
        api.post<FetchResult>('/commits/fetch', payload).then((r: AxiosResponse<FetchResult>) => r.data),

    getAll: (params: { repositoryId?: string; page?: number; limit?: number; search?: string }): Promise<CommitsListResponse> =>
        api.get<CommitsListResponse>('/commits', { params }).then((r: AxiosResponse<CommitsListResponse>) => r.data),

    getBySha: (sha: string): Promise<Commit> =>
        api.get<Commit>(`/commits/${sha}`).then((r: AxiosResponse<Commit>) => r.data),
};
