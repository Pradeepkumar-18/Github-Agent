import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    children: React.ReactNode;
    confirmLabel?: string;
    confirmVariant?: 'danger' | 'primary';
    isLoading?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    children,
    confirmLabel = 'Confirm',
    confirmVariant = 'primary',
    isLoading = false,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 min-h-screen">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Body */}
            <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${confirmVariant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
                                {title}
                            </h2>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="text-sm text-slate-500 leading-relaxed font-medium mb-8">
                        {children}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        {onConfirm && (
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={`flex-1 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-lg active:scale-95 disabled:opacity-50
                                    ${confirmVariant === 'danger' 
                                        ? 'bg-red-500 hover:bg-red-600 shadow-red-100 hover:shadow-red-200' 
                                        : 'bg-slate-900 hover:bg-black shadow-slate-100 hover:shadow-slate-200'}
                                `}
                            >
                                {isLoading ? 'Processing...' : confirmLabel}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
