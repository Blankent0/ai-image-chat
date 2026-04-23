'use client';

import type { GeneratedImage } from '@/types/studio';

interface HistoryStripProps {
    generations: GeneratedImage[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export default function HistoryStrip({ generations, selectedId, onSelect }: HistoryStripProps) {
    if (generations.length === 0) return null;

    const ordered = [...generations].reverse(); // oldest -> newest (left -> right)

    return (
        <div className="border-t border-[var(--color-border)] bg-[#0A0908] px-6 py-3 flex-shrink-0">
            <div className="flex items-center gap-3 overflow-x-auto">
                <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-ink-mute)] flex-shrink-0 pr-1">
                    History
                </span>
                {ordered.map((gen, idx) => {
                    const isSelected = gen.id === selectedId;
                    const label = idx === 0 ? 'Origin' : `Iter ${idx}`;
                    return (
                        <button
                            key={gen.id}
                            onClick={() => onSelect(gen.id)}
                            className={`relative flex-shrink-0 w-[84px] h-[64px] rounded overflow-hidden transition-all ${
                                isSelected
                                    ? 'ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[#0A0908]'
                                    : 'opacity-55 hover:opacity-100'
                            }`}
                            title={label}
                        >
                            <img
                                src={gen.url}
                                alt={label}
                                className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0 left-0 right-0 text-[9px] font-mono tabular-nums px-1 py-[2px] bg-black/65 text-[var(--color-ink-soft)] uppercase tracking-wider">
                                {String(idx + 1).padStart(2, '0')}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
