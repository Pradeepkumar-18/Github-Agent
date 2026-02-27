import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Dashboard } from '../pages/Dashboard';
import { Repositories } from '../pages/Repositories';
import { RepositoryDetail } from '../pages/RepositoryDetail';
import { Commits } from '../pages/Commits';
import { CommitDetail } from '../pages/CommitDetail';
import { PullRequests } from '../pages/PullRequests';
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
            { path: 'commits/:sha', element: <CommitDetail /> },
            { path: 'pull-requests', element: <PullRequests /> },
            { path: 'settings', element: <Settings /> },
            { path: '*', element: <Navigate to="/" replace /> },
        ],
    },
]);
