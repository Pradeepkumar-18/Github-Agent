import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppLayout() {
    return (
        <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0">
                <TopBar />
                <main className="flex-1 overflow-auto px-8 py-8 lg:px-12">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
