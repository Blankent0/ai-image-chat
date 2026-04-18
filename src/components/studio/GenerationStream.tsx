'use client';

import { useEffect, useRef } from 'react';
import { Loader2, ImageIcon } from 'lucide-react';
import type { GeneratedImage } from '@/types/studio';

interface GenerationStreamProps {
    generations: GeneratedImage[];   // newest-first from parent
    isGenerating: boolean;
}

export default function GenerationStream({ generations, isGenerating }: GenerationStreamProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const ordered = [...generations].reverse(); // display oldest-first

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [generations.length, isGenerating]);

    if (!isGenerating && generations.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-ink-mute)] px-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mb-5">
                    <ImageIcon size={22} />
                </div>
                <p className="font-serif text-lg text-[var(--color-ink-soft)] mb-2">开始创作</p>
                <p className="text-xs max-w-xs leading-relaxed">
                    在左侧上传你的 3D 渲染图并选择一个风格，<br />即可生成风格化的室内效果图
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto px-8 py-10 space-y-10">
            {ordered.map((gen, index) => (
                <article key={gen.id} className="max-w-3xl mx-auto space-y-3">
                    <div className="flex items-baseline justify-between px-1">
                        <div className="flex items-baseline gap-3">
                            <span className="font-serif text-2xl text-[var(--color-ink)] tabular-nums">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-mute)]">
                                {index === 0 ? 'Origin' : `Iteration ${index}`}
                            </span>
                        </div>
                        <span className="text-[11px] text-[var(--color-ink-mute)] font-mono tabular-nums">
                            {new Date(gen.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
                        <img
                            src={gen.url}
                            alt={`Generation ${gen.id}`}
                            className="w-full block"
                        />
                    </div>
                    {gen.adjustmentText && (
                        <p className="text-xs text-[var(--color-ink-soft)] italic px-1 leading-relaxed">
                            &ldquo;{gen.adjustmentText}&rdquo;
                        </p>
                    )}
                </article>
            ))}
            {isGenerating && (
                <div className="max-w-3xl mx-auto space-y-3">
                    <div className="flex items-baseline gap-3 px-1">
                        <span className="font-serif text-2xl text-[var(--color-ink-mute)] tabular-nums">
                            {String(ordered.length + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)] animate-pulse">
                            Rendering…
                        </span>
                    </div>
                    <div className="w-full aspect-[4/3] rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-raised)] flex items-center justify-center">
                        <Loader2 size={28} className="text-[var(--color-accent)] animate-spin" />
                    </div>
                </div>
            )}
            <div ref={bottomRef} />
        </div>
    );
}
