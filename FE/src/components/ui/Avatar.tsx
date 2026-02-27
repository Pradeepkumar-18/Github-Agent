interface AvatarProps {
    src: string;
    name: string;
    size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ src, name, size = 'md' }: AvatarProps) {
    const sizes = {
        sm: 'h-6 w-6 text-[8px]',
        md: 'h-9 w-9 text-[10px]',
        lg: 'h-12 w-12 text-xs'
    };

    return (
        <div className={`${sizes[size]} rounded-xl bg-slate-100 flex-shrink-0 relative overflow-hidden ring-1 ring-slate-100 shadow-sm border-2 border-white`}>
            <img
                src={src}
                alt={name}
                className="h-full w-full object-cover transition-opacity duration-300"
                onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                style={{ opacity: 0 }}
                onError={(e) => {
                    const el = e.currentTarget;
                    el.style.display = 'none';
                    const parent = el.parentElement;
                    if (parent) {
                        const fallback = document.createElement('div');
                        fallback.className = `h-full w-full flex items-center justify-center bg-slate-50 text-slate-400 font-bold uppercase tracking-tighter`;
                        fallback.textContent = name.split(' ').map(n => n[0]).join('').slice(0, 2);
                        parent.appendChild(fallback);
                    }
                }}
            />
        </div>
    );
}
