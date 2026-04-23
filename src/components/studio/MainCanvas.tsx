'use client';

import { useEffect, useState } from 'react';
import { Loader2, ImageIcon, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { GeneratedImage } from '@/types/studio';

interface MainCanvasProps {
    selectedGen: GeneratedImage | null;
    isGenerating: boolean;
    hasAnyGeneration: boolean;
}

type ViewMode = { kind: 'fit' } | { kind: 'zoom'; pct: number };

const ZOOM_MIN = 25;
const ZOOM_MAX = 400;
const ZOOM_STEP = 25;

export default function MainCanvas({ selectedGen, isGenerating, hasAnyGeneration }: MainCanvasProps) {
    const [view, setView] = useState<ViewMode>({ kind: 'fit' });
    const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

    useEffect(() => {
        setView({ kind: 'fit' });
        setNatural(null);
    }, [selectedGen?.id]);

    const zoomIn = () => {
        setView(prev =>
            prev.kind === 'fit'
                ? { kind: 'zoom', pct: 100 }
                : { kind: 'zoom', pct: Math.min(ZOOM_MAX, prev.pct + ZOOM_STEP) },
        );
    };
    const zoomOut = () => {
        setView(prev =>
            prev.kind === 'fit'
                ? { kind: 'zoom', pct: 75 }
                : { kind: 'zoom', pct: Math.max(ZOOM_MIN, prev.pct - ZOOM_STEP) },
        );
    };
    const resetView = () => setView({ kind: 'fit' });

    if (selectedGen) {
        const isFit = view.kind === 'fit';
        const label = isFit ? 'Fit' : `${view.pct}%`;
        const zoomInDisabled = view.kind === 'zoom' && view.pct >= ZOOM_MAX;
        const zoomOutDisabled = view.kind === 'zoom' && view.pct <= ZOOM_MIN;

        return (
            <div className="w-full h-full relative">
                {/* Zoom controls */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-0.5 bg-[var(--color-surface)]/90 backdrop-blur border border-[var(--color-border)] rounded-lg p-1 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]">
                    <button
                        onClick={zoomOut}
                        disabled={zoomOutDisabled}
                        title="缩小"
                        className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                    >
                        <ZoomOut size={14} />
                    </button>
                    <button
                        onClick={resetView}
                        title="适应窗口"
                        className="min-w-[52px] h-7 px-2 flex items-center justify-center gap-1 rounded-md text-[11px] tabular-nums text-[var(--color-ink-soft)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-raised)] transition-colors"
                    >
                        {isFit && <Maximize2 size={11} />}
                        <span>{label}</span>
                    </button>
                    <button
                        onClick={zoomIn}
                        disabled={zoomInDisabled}
                        title="放大"
                        className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                    >
                        <ZoomIn size={14} />
                    </button>
                </div>

                {isFit ? (
                    // Fit mode: flex column, image container gets explicit remaining height
                    <div className="w-full h-full flex flex-col p-10 gap-4">
                        <div className="flex-1 min-h-0 w-full relative rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)]">
                            <img
                                key={selectedGen.url}
                                src={selectedGen.url}
                                alt="Current render"
                                className="block w-full h-full object-contain"
                                onLoad={(e) => {
                                    const el = e.currentTarget;
                                    setNatural({ w: el.naturalWidth, h: el.naturalHeight });
                                }}
                            />
                            {isGenerating && (
                                <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center gap-2.5">
                                    <Loader2 size={20} className="text-[var(--color-accent)] animate-spin" />
                                    <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
                                        Rendering next iteration
                                    </span>
                                </div>
                            )}
                        </div>
                        {selectedGen.adjustmentText && (
                            <p className="flex-shrink-0 text-xs text-[var(--color-ink-soft)] italic max-w-[640px] text-center px-4 leading-relaxed mx-auto">
                                &ldquo;{selectedGen.adjustmentText}&rdquo;
                            </p>
                        )}
                    </div>
                ) : (
                    // Zoom mode: scroll container, image at natural × pct pixels
                    <div className="w-full h-full overflow-auto">
                        <div className="flex flex-col items-center gap-4 p-10 min-w-full min-h-full">
                            <div
                                className="relative rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)] flex-shrink-0"
                                style={
                                    natural
                                        ? {
                                            width: `${natural.w * (view.pct / 100)}px`,
                                            height: `${natural.h * (view.pct / 100)}px`,
                                        }
                                        : undefined
                                }
                            >
                                <img
                                    key={selectedGen.url}
                                    src={selectedGen.url}
                                    alt="Current render"
                                    className="block w-full h-full object-contain"
                                    onLoad={(e) => {
                                        const el = e.currentTarget;
                                        setNatural({ w: el.naturalWidth, h: el.naturalHeight });
                                    }}
                                />
                                {isGenerating && (
                                    <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center gap-2.5">
                                        <Loader2 size={20} className="text-[var(--color-accent)] animate-spin" />
                                        <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
                                            Rendering next iteration
                                        </span>
                                    </div>
                                )}
                            </div>
                            {selectedGen.adjustmentText && (
                                <p className="text-xs text-[var(--color-ink-soft)] italic max-w-[640px] text-center px-4 leading-relaxed">
                                    &ldquo;{selectedGen.adjustmentText}&rdquo;
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (isGenerating && !hasAnyGeneration) {
        return (
            <div className="w-full h-full flex items-center justify-center p-10">
                <div className="w-full max-w-[720px] aspect-[4/3] rounded-xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-raised)] flex flex-col items-center justify-center gap-3">
                    <Loader2 size={32} className="text-[var(--color-accent)] animate-spin" />
                    <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-ink-mute)]">
                        Rendering your first image
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex items-center justify-center p-10">
            <div className="text-center text-[var(--color-ink-mute)] max-w-sm">
                <div className="w-20 h-20 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mb-6 mx-auto">
                    <ImageIcon size={28} />
                </div>
                <p className="font-serif text-xl text-[var(--color-ink-soft)] mb-2">等待你的第一张图</p>
                <p className="text-xs leading-relaxed">
                    在左侧对话中上传图片并选择功能模块，生成结果会显示在这里
                </p>
            </div>
        </div>
    );
}
