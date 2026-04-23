'use client';

import type { FunctionModule } from '@/types/studio';

interface FunctionSelectorProps {
    modules: FunctionModule[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    disabled?: boolean;
}

export default function FunctionSelector({ modules, selectedId, onSelect, disabled }: FunctionSelectorProps) {
    return (
        <div className="max-h-[440px] overflow-y-auto pr-1 -mr-1">
            <div className="grid grid-cols-2 gap-2">
            {modules.map(mod => {
                const isSelected = mod.id === selectedId;
                const base =
                    'group relative aspect-[4/5] rounded-xl border transition-all flex items-end overflow-hidden text-left';
                const state = isSelected
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] shadow-[0_0_0_3px_rgba(201,123,75,0.1)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border-strong)]';
                const interactivity = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

                return (
                    <button
                        key={mod.id}
                        onClick={() => !disabled && onSelect(mod.id)}
                        disabled={disabled}
                        title={mod.description}
                        className={`${base} ${state} ${interactivity}`}
                    >
                        {mod.thumbnail ? (
                            <>
                                <img src={mod.thumbnail} alt={mod.name} className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                            </>
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-surface-raised)] to-[var(--color-surface-hover)]" />
                        )}
                        <div className="relative z-10 p-2 w-full">
                            <p
                                className={`text-[11px] font-medium tracking-wide leading-tight ${
                                    isSelected ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink)]'
                                }`}
                            >
                                {mod.name}
                            </p>
                            <p className="text-[9px] text-[var(--color-ink-mute)] mt-0.5 leading-snug line-clamp-2">
                                {mod.description}
                            </p>
                        </div>
                        {isSelected && (
                            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                        )}
                    </button>
                );
            })}
            </div>
        </div>
    );
}
