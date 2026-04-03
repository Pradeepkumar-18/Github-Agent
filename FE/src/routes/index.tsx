import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Dashboard } from '../pages/Dashboard';
import { Repositories } from '../pages/Repositories';
import { RepositoryDetail } from '../pages/RepositoryDetail';
import { Commits } from '../pages/Commits';
import { CommitList } from '../pages/CommitList';
import { CommitDetail } from '../pages/CommitDetail';

import { PullRequests } from '../pages/PullRequests';
import { PullRequestList } from '../pages/PullRequestList';
import { PullRequestDetail } from '../pages/PullRequestDetail';
import { Settings } from '../pages/Settings';


export const router = createBrowserRouter([
    {
        path: '/',
        element: <AppLayout />,
        children: [
            { index: true, element: <Dashboard /> },
            { path: 'repositories', element: <Repositories /> },
            { path: 'repositories/:id', element: <RepositoryDetail /> },
            { path: 'commits', element: <Commits /> },
            { path: 'commits/repository/:repoId', element: <CommitList /> },
            { path: 'commits/detail/:sha', element: <CommitDetail /> },
            { path: 'pull-requests', element: <PullRequests /> },

            { path: 'pull-requests/repository/:repoId', element: <PullRequestList /> },
            { path: 'pull-requests/detail/:id', element: <PullRequestDetail /> },
            { path: 'settings', element: <Settings /> },
            { path: '*', element: <Navigate to="/" replace /> },

        ],
    },
]);
