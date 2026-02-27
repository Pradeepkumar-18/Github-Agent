import evaluationData from '../mock/evaluations.json';
import type { Evaluation } from '../types';

export function useEvaluation(id: string | null) {
    if (!id) return { evaluation: null };
    const evaluation = (evaluationData.evaluations as Evaluation[]).find((e) => e.id === id);
    return { evaluation: evaluation ?? null };
}
