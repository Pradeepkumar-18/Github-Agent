import { useState, useEffect, useCallback } from 'react';
import { pullRequestsApi } from '../api/pullRequests.api';
import type { FetchPullRequestsPayload } from '../api/pullRequests.api';
import type { PullRequest, RiskLevel, PRState } from '../types';

export function usePullRequests(repositoryId?: string) {
    const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [stateFilter, setStateFilter] = useState<PRState | 'all'>('all');
    const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
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
            const data = await pullRequestsApi.getAll({ repositoryId, search: debouncedSearch });
            setPullRequests(data);
        } catch (err: any) {
            setError(err.message ?? 'Failed to load pull requests');
        } finally {
            setLoading(false);
        }
    }, [repositoryId, debouncedSearch]);

    useEffect(() => { load(); }, [load]);

    const fetchFromGitHub = async (payload: FetchPullRequestsPayload) => {
        setFetchLoading(true);
        setError(null);
        try {
            const result = await pullRequestsApi.fetchFromGitHub(payload);
            await load();
            return result;
        } catch (err: any) {
            setError(err.message ?? 'Failed to fetch PRs from GitHub');
            throw err;
        } finally {
            setFetchLoading(false);
        }
    };

    const filtered = pullRequests.filter((p) => {
        if (stateFilter !== 'all' && p.state !== stateFilter) return false;
        if (riskFilter !== 'all' && p.riskLevel !== riskFilter) return false;
        return true;
    });

    return {
        pullRequests: filtered,
        search,
        setSearch,
        stateFilter,
        setStateFilter,
        riskFilter,
        setRiskFilter,
        loading,
        fetchLoading,
        error,
        refetch: load,
        fetchFromGitHub,
    };
}
