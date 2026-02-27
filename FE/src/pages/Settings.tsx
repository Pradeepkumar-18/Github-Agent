import { Shield, Database, Bell, Lock, AlertCircle, Sparkles } from 'lucide-react';

export function Settings() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-blue-600 rounded-3xl p-10 text-white shadow-xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 h-64 w-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 p-8 opacity-20">
                    <Sparkles className="h-32 w-32" />
                </div>
                <h1 className="text-3xl font-black mb-2 tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>System Settings</h1>
                <p className="text-blue-100 font-medium max-w-lg">Manage your GitHub integrations, AI parameters, and security protocols for the Code Intelligence Agent.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    { icon: Shield, title: 'GitHub Integration', desc: 'Secure OAuth and personal access tokens manager.', badge: 'Production Ready' },
                    { icon: Database, title: 'AI Configuration', desc: 'Fine-tune LLM parameters and context window settings.', badge: 'Enterprise Only' },
                    { icon: Bell, title: 'Notification Hub', desc: 'Channels for webhooks, slack, and security alerts.', badge: 'Active' },
                    { icon: Lock, title: 'Identity & Access', desc: 'RBAC controls and audit logging dashboard.', badge: 'Restricted' },
                ].map(card => (
                    <div key={card.title} className="p-1 gap-4 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center transition-all hover:shadow-lg group">
                        <div className="h-20 w-20 flex-shrink-0 flex items-center justify-center bg-slate-50 rounded-2xl ml-4 transition-colors group-hover:bg-blue-50">
                            <card.icon className="h-8 w-8 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <div className="flex-1 pr-6 py-4">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-sm font-bold text-slate-800">{card.title}</h3>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 group-hover:text-blue-400 transition-colors">{card.badge}</span>
                            </div>
                            <p className="text-[11px] font-medium text-slate-400 leading-relaxed">{card.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-800 tracking-tight">Phase 1 Restriction</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Read-only demonstration</p>
                    </div>
                </div>

                <p className="text-sm font-medium text-slate-600 max-w-2xl leading-relaxed mb-8">
                    Settings are currently locked in the Phase 1 demonstration. Real-time configuration persistence will be enabled in Phase 2 during backend API integration.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden relative">
                        <div className="h-full bg-blue-500 w-[65%] rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Migration Progress: 65%</span>
                </div>
            </div>
        </div>
    );
}
