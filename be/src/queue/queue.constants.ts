export const QUEUES = {
    COMMIT_EVALUATION: 'commit-evaluation',
    PR_EVALUATION: 'pr-evaluation',
    NOTIFICATION: 'notification',
} as const;

export const JOB_NAMES = {
    EVALUATE_COMMIT: 'evaluate-commit',
    EVALUATE_PR: 'evaluate-pr',
    POST_PR_COMMENT: 'post-pr-comment',
    SEND_ALERT: 'send-alert',
} as const;

export const DEFAULT_JOB_OPTIONS = {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
};
