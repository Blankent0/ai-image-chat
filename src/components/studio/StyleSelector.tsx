'use client';

import type { StylePreset } from '@/types/studio';

interface StyleSelectorProps {
    presets: StylePreset[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    disabled?: boolean;
}

export default function StyleSelector({ presets, selectedId, onSelect, disabled }: StyleSelectorProps) {
    return (
        <div className="grid grid-cols-2 gap-2.5">
            {presets.map(preset => {
                const isSelected = preset.id === selectedId;
                const base = 'group relative aspect-[4/5] rounded-xl border transition-all flex items-end overflow-hidden text-left';
                const state = isSelected
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] shadow-[0_0_0_3px_rgba(201,165,111,0.08)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border-strong)]';
                const interactivity = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

                return (
                    <button
                        key={preset.id}
                        onClick={() => !disabled && onSelect(preset.id)}
                        disabled={disabled}
                        className={`${base} ${state} ${interactivity}`}
                    >
                        {preset.thumbnail ? (
                            <>
                                <img src={preset.thumbnail} alt={preset.name} className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                            </>
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-surface-raised)] to-[var(--color-surface-hover)]" />
                        )}
                        <div className="relative z-10 p-2.5 w-full">
                            <p className={`text-[11px] font-medium tracking-wide ${isSelected ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink)]'}`}>
                                {preset.name}
                            </p>
                        </div>
                        {isSelected && (
                            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
