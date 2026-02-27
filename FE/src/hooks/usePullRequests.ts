import { useMemo, useState } from 'react';
import prData from '../mock/pull-requests.json';
import type { PullRequest, RiskLevel, PRState } from '../types';

export function usePullRequests(repositoryId?: string) {
    const [stateFilter, setStateFilter] = useState<PRState | 'all'>('all');
    const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');

    const pullRequests: PullRequest[] = useMemo(() => {
        let all = prData.pullRequests as PullRequest[];
        if (repositoryId) all = all.filter((p) => p.repositoryId === repositoryId);
        if (stateFilter !== 'all') all = all.filter((p) => p.state === stateFilter);
        if (riskFilter !== 'all') all = all.filter((p) => p.riskLevel === riskFilter);
        return all.sort((a, b) => b.riskScore - a.riskScore);
    }, [repositoryId, stateFilter, riskFilter]);

    return { pullRequests, stateFilter, setStateFilter, riskFilter, setRiskFilter, meta: prData.meta };
}
