'use client';

import { useCallback, useEffect, useState } from 'react';
import { listSessions, saveSession, deleteSession } from '@/lib/canvasStorage';
import type { CanvasSession } from '@/types/canvas';

const ACTIVE_KEY = 'canvas_active_session_id';

export function useCanvasSessions() {
    const [sessions, setSessions] = useState<CanvasSession[]>([]);
    const [activeId, setActiveIdState] = useState<string | null>(null);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const all = await listSessions();
                if (cancelled) return;
                all.sort((a, b) => b.updatedAt - a.updatedAt);
                setSessions(all);
                const stored = localStorage.getItem(ACTIVE_KEY);
                setActiveIdState(stored && all.some(s => s.id === stored) ? stored : null);
            } catch (e) {
                console.error('Failed to load canvas sessions', e);
            } finally {
                if (!cancelled) setHydrated(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const upsert = useCallback(async (session: CanvasSession) => {
        try {
            await saveSession(session);
            setSessions(prev => {
                const others = prev.filter(s => s.id !== session.id);
                return [session, ...others].sort((a, b) => b.updatedAt - a.updatedAt);
            });
        } catch (e) {
            console.error('Failed to save canvas session', e);
        }
    }, []);

    const remove = useCallback(async (id: string) => {
        try {
            await deleteSession(id);
            setSessions(prev => prev.filter(s => s.id !== id));
        } catch (e) {
            console.error('Failed to delete canvas session', e);
        }
    }, []);

    const setActive = useCallback((id: string | null) => {
        setActiveIdState(id);
        if (typeof window === 'undefined') return;
        if (id) localStorage.setItem(ACTIVE_KEY, id);
        else localStorage.removeItem(ACTIVE_KEY);
    }, []);

    return { sessions, activeId, hydrated, upsert, remove, setActive };
}
