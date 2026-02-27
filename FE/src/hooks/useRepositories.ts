import { useMemo, useState } from 'react';
import repoData from '../mock/repositories.json';
import type { Repository } from '../types';

export function useRepositories() {
    const [search, setSearch] = useState('');

    const repositories: Repository[] = useMemo(() => {
        const all = repoData.repositories as Repository[];
        if (!search) return all;
        return all.filter(
            (r) =>
                r.name.toLowerCase().includes(search.toLowerCase()) ||
                r.description.toLowerCase().includes(search.toLowerCase()) ||
                r.language.toLowerCase().includes(search.toLowerCase()),
        );
    }, [search]);

    return { repositories, search, setSearch, meta: repoData.meta };
}

export function useRepository(id: string) {
    const repo = (repoData.repositories as Repository[]).find((r) => r.id === id);
    return { repository: repo ?? null };
}
