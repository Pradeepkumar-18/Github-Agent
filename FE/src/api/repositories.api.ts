import { api } from './api';
import type { AxiosResponse } from 'axios';
import type { Repository } from '../types';

export interface CreateRepositoryPayload {
    owner: string;
    repo: string;
    token: string;
    provider?: 'github' | 'gitlab';
}

export const repositoriesApi = {
    getAll: (): Promise<Repository[]> =>
        api.get<Repository[]>('/repositories').then((r: AxiosResponse<Repository[]>) => r.data),

    getById: (id: string): Promise<Repository> =>
        api.get<Repository>(`/repositories/${id}`).then((r: AxiosResponse<Repository>) => r.data),

    create: (payload: CreateRepositoryPayload): Promise<Repository> =>
        api.post<Repository>('/repositories', payload).then((r: AxiosResponse<Repository>) => r.data),
};
