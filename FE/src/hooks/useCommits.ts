import { useState, useEffect, useCallback } from 'react';
import { commitsApi } from '../api/commits.api';
import type { FetchCommitsPayload } from '../api/commits.api';
import type { Commit, EvalStatus } from '../types';

export function useCommits(repositoryId?: string, page = 1, limit = 20) {
    const [commits, setCommits] = useState<Commit[]>([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<EvalStatus | 'all'>('all');
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await commitsApi.getAll({ repositoryId, page, limit, search: debouncedSearch });
            setCommits(res.data);
            setTotal(res.total);
        } catch (err: any) {
            setError(err.message ?? 'Failed to load commits');
        } finally {
            setLoading(false);
        }
    }, [repositoryId, page, limit, debouncedSearch]);

    useEffect(() => { load(); }, [load]);

    const fetchFromGitHub = async (payload: FetchCommitsPayload) => {
        setFetchLoading(true);
        setError(null);
        try {
            const result = await commitsApi.fetchFromGitHub(payload);
            await load(); // Reload list after fetch
            return result;
        } catch (err: any) {
            setError(err.message ?? 'Failed to fetch commits from GitHub');
            throw err;
        } finally {
            setFetchLoading(false);
        }
    };

    const filtered = commits.filter((c) => {
        if (statusFilter !== 'all' && c.evaluationStatus !== statusFilter) return false;
        return true;
    });

    return {
        commits: filtered,
        total,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        loading,
        fetchLoading,
        error,
        refetch: load,
        fetchFromGitHub,
    };
}

export function useCommit(sha: string) {
    const [commit, setCommit] = useState<Commit | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!sha) return;
        setLoading(true);
        setError(null);
        commitsApi.getBySha(sha)
            .then(setCommit)
            .catch((err: any) => setError(err.message ?? 'Failed to load commit'))
            .finally(() => setLoading(false));
    }, [sha]);

    return { commit, loading, error };
}
