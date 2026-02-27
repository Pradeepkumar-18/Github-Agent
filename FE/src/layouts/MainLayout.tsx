import { Outlet } from "react-router-dom";

export default function MainLayout() {
    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar Placeholder */}
            <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-border font-bold text-lg">
                    AI GitHub Agent
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <div className="p-2 rounded-md bg-secondary text-secondary-foreground cursor-pointer">
                        Dashboard
                    </div>
                    <div className="p-2 rounded-md hover:bg-secondary/50 text-muted-foreground cursor-pointer">
                        Repositories
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header Placeholder */}
                <header className="h-16 border-b border-border bg-card flex items-center px-6 md:hidden font-bold">
                    AI GitHub Agent
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
