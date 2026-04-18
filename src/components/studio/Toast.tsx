'use client';

import { useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ToastProps {
    message: string;
    onDismiss: () => void;
    durationMs?: number;
}

export default function Toast({ message, onDismiss, durationMs = 4000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onDismiss, durationMs);
        return () => clearTimeout(timer);
    }, [onDismiss, durationMs]);

    return (
        <div className="fixed top-6 right-6 z-50 bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] text-[var(--color-ink)] rounded-xl px-4 py-3 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)] flex items-center gap-3 max-w-sm">
            <AlertCircle size={16} className="text-[var(--color-danger)] flex-shrink-0" />
            <span className="text-sm flex-1 leading-relaxed">{message}</span>
            <button
                onClick={onDismiss}
                className="text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] transition-colors"
            >
                <X size={14} />
            </button>
        </div>
    );
}
