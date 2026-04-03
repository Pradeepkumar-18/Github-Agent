import { useState, useEffect, useCallback } from 'react';
import { repositoriesApi } from '../api/repositories.api';
import type { CreateRepositoryPayload } from '../api/repositories.api';
import type { Repository } from '../types';

export function useRepositories() {
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await repositoriesApi.getAll();
            setRepositories(data);
        } catch (err: any) {
            setError(err.message ?? 'Failed to load repositories');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = repositories.filter((r) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            r.name.toLowerCase().includes(q) ||
            r.fullName.toLowerCase().includes(q) ||
            (r.description ?? '').toLowerCase().includes(q) ||
            (r.language ?? '').toLowerCase().includes(q)
        );
    });

    const createRepository = async (payload: CreateRepositoryPayload) => {
        const created = await repositoriesApi.create(payload);
        setRepositories((prev) => [created, ...prev]);
        return created;
    };

    return { repositories: filtered, search, setSearch, loading, error, refetch: load, createRepository };
}

export function useRepository(id: string) {
    const [repository, setRepository] = useState<Repository | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(null);
        repositoriesApi.getById(id)
            .then(setRepository)
            .catch((err: any) => setError(err.message ?? 'Failed to load repository'))
            .finally(() => setLoading(false));
    }, [id]);

    return { repository, loading, error };
}
