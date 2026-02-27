import { NavLink } from 'react-router-dom';
import { LayoutDashboard, GitBranch, GitCommit, GitPullRequest, Settings, Hexagon } from 'lucide-react';

const NAV_ITEMS = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/repositories', icon: GitBranch, label: 'Repositories' },
    { to: '/commits', icon: GitCommit, label: 'Commits' },
    { to: '/pull-requests', icon: GitPullRequest, label: 'Pull Requests' },
];

export function Sidebar() {
    return (
        <aside
            className="flex flex-col h-full w-64 flex-shrink-0 shadow-sm z-10"
            style={{ backgroundColor: '#FFFFFF', borderRight: '1px solid #E2E8F0' }}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-6" style={{ borderBottom: '1px solid #F1F5F9' }}>
                <Hexagon className="h-8 w-8 flex-shrink-0" style={{ color: '#2563EB' }} strokeWidth={2} />
                <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif', color: '#0F172A' }}>
                    CodeIntel
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1.5">
                <p className="px-3 mb-4 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#94A3B8' }}>
                    Platform
                </p>
                {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                ? 'bg-blue-50/50 shadow-sm'
                                : 'text-slate-500 hover:bg-slate-50'
                            }`
                        }
                        style={({ isActive }) => ({
                            color: isActive ? '#2563EB' : undefined,
                        })}
                    >
                        <Icon className={`h-4.5 w-4.5 flex-shrink-0 transition-colors`} />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom: Settings + Mock Mode badge */}
            <div className="px-4 pb-6 mt-auto">
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'
                        }`
                    }
                    style={({ isActive }) => ({
                        color: isActive ? '#2563EB' : undefined,
                    })}
                >
                    <Settings className="h-4.5 w-4.5" />
                    Settings
                </NavLink>

                <div className="mt-6 rounded-xl p-4 bg-amber-50/50 border border-amber-100">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#B45309' }}>
                            Preview Mode
                        </p>
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: '#92400E' }}>Using mock datasets for Phase 1 demonstration.</p>
                </div>
            </div>
        </aside>
    );
}
