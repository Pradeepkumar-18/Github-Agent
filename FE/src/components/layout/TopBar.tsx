import { Bell, Search } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
    '/': 'Analytics Overview',
    '/repositories': 'Repository Explorer',
    '/commits': 'Code Velocity',
    '/pull-requests': 'Risk Assessment',
    '/settings': 'System Settings',
};

/** Convert a URL segment to a readable label */
function humanize(segment: string): string {
    // SHA hash (long hex string) — truncate
    if (/^[0-9a-f]{7,}$/i.test(segment)) return segment.slice(0, 7).toUpperCase();
    // Replace hyphens/underscores, capitalize each word
    return segment
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function TopBar() {
    const { pathname } = useLocation();
    const segments = pathname.split('/').filter(Boolean);
    const base = '/' + (segments[0] ?? '');
    const title = PAGE_TITLES[base] ?? 'Detailed View';

    // Build breadcrumb items with their full path
    const crumbs = segments.map((seg, idx) => ({
        label: humanize(seg),
        path: '/' + segments.slice(0, idx + 1).join('/'),
        isLast: idx === segments.length - 1,
    }));

    return (
        <header
            className="flex items-center px-8 h-20 flex-shrink-0 z-0"
            style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #F1F5F9' }}
        >
            {/* Title / Breadcrumb */}
            <div className="flex-1">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: '#94A3B8' }}>
                    <Link to="/" className="hover:text-blue-500 transition-colors">CodeIntel</Link>
                    {crumbs.map((crumb) => (
                        <span key={crumb.path} className="flex items-center gap-1.5">
                            <span className="opacity-30">/</span>
                            {crumb.isLast ? (
                                <span className="text-blue-600">{crumb.label}</span>
                            ) : (
                                <Link to={crumb.path} className="hover:text-blue-500 transition-colors">{crumb.label}</Link>
                            )}
                        </span>
                    ))}
                </div>
                <h1 className="text-xl font-bold tracking-tight" style={{ color: '#0F172A', fontFamily: 'Syne, sans-serif' }}>
                    {title}
                </h1>
            </div>


            {/* Center Search Placeholder (Premium touch) */}
            <div className="hidden lg:flex flex-1 max-w-md mx-8 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Global search across code intelligence..."
                    className="w-full bg-slate-50 border-none rounded-2xl py-2.5 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                />
            </div>

            {/* Right side */}
            <div className="flex items-center gap-5">
                <button className="relative p-2.5 rounded-xl transition-all hover:bg-slate-50 text-slate-500">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full border-2 border-white" style={{ backgroundColor: '#EF4444' }} />
                </button>

                <div className="h-10 w-px bg-slate-100 mx-1" />

                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold leading-none" style={{ color: '#0F172A' }}>Lead Engineer</p>
                        <p className="text-[11px] font-medium mt-1" style={{ color: '#64748B' }}>System Admin</p>
                    </div>
                    <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 transition-transform hover:scale-105 cursor-pointer overflow-hidden"
                        style={{ backgroundColor: '#F8FAFC' }}
                    >
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" alt="User" />
                    </div>
                </div>
            </div>
        </header>
    );
}
