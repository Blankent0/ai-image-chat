'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { CanvasSession } from '@/types/canvas';

function formatTime(t: number): string {
    const d = new Date(t);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function deriveName(s: CanvasSession): string {
    const firstGen = s.nodes.find(n => n.parentId !== null && n.prompt);
    if (firstGen?.prompt) return firstGen.prompt.slice(0, 22);
    if (s.nodes.length > 0) return s.name || '未命名工作';
    return s.name || '空白工作';
}

interface Props {
    sessions: CanvasSession[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onNew: () => void;
    onDelete: (id: string) => void;
}

export default function SessionSidebar({ sessions, activeId, onSelect, onNew, onDelete }: Props) {
    return (
        <aside className="w-[260px] flex-shrink-0 h-full flex flex-col bg-[var(--color-surface)]/95 backdrop-blur border-r border-[var(--color-border)]">
            <div className="p-3">
                <button
                    onClick={onNew}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/25 text-xs transition-colors"
                >
                    <Plus size={14} />
                    新建工作
                </button>
            </div>

            <div className="px-4 pb-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-mute)]">
                    工作记录
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-4">
                {sessions.length === 0 ? (
                    <div className="text-center text-[var(--color-ink-mute)] text-xs py-10 px-4">
                        还没有工作记录
                    </div>
                ) : (
                    sessions.map(s => (
                        <div
                            key={s.id}
                            onClick={() => onSelect(s.id)}
                            className={`group flex items-start gap-2 px-3 py-2.5 rounded-lg mb-1 cursor-pointer transition-colors ${
                                activeId === s.id
                                    ? 'bg-[var(--color-surface-raised)] text-[var(--color-ink)]'
                                    : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-raised)]/60 hover:text-[var(--color-ink)]'
                            }`}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate mb-0.5">{deriveName(s)}</div>
                                <div className="text-[10px] text-[var(--color-ink-mute)]">
                                    {formatTime(s.updatedAt)} · {s.nodes.length} 张图
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('删除这条工作记录？')) onDelete(s.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-[var(--color-ink-mute)] hover:text-red-400 transition-opacity p-0.5"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
}
