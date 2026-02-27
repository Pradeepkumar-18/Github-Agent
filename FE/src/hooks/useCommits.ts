import { useMemo, useState } from 'react';
import commitData from '../mock/commits.json';
import type { Commit, EvalStatus } from '../types';

export function useCommits(repositoryId?: string) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<EvalStatus | 'all'>('all');

    const commits: Commit[] = useMemo(() => {
        let all = commitData.commits as Commit[];
        if (repositoryId) all = all.filter((c) => c.repositoryId === repositoryId);
        if (statusFilter !== 'all') all = all.filter((c) => c.evaluationStatus === statusFilter);
        if (search) {
            all = all.filter(
                (c) =>
                    c.message.toLowerCase().includes(search.toLowerCase()) ||
                    c.authorName.toLowerCase().includes(search.toLowerCase()) ||
                    c.shortSha.includes(search),
            );
        }
        return all.sort((a, b) => new Date(b.committedAt).getTime() - new Date(a.committedAt).getTime());
    }, [repositoryId, search, statusFilter]);

    return { commits, search, setSearch, statusFilter, setStatusFilter, meta: commitData.meta };
}

export function useCommit(sha: string) {
    const all = commitData.commits as Commit[];
    const commit = all.find((c) => c.sha === sha || c.shortSha === sha);
    return { commit: commit ?? null };
}
