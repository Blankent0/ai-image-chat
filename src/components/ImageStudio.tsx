'use client';

import { useState } from 'react';
import { Sparkles, RotateCcw, Loader2 } from 'lucide-react';
import type { GeneratedImage, SourceImage } from '@/types/studio';
import { STYLE_PRESETS, getStyleById } from '@/constants/stylePresets';
import SourceUploader from './studio/SourceUploader';
import StyleSelector from './studio/StyleSelector';
import GenerationStream from './studio/GenerationStream';
import Toast from './studio/Toast';

export default function ImageStudio() {
    const [sourceImage, setSourceImage] = useState<SourceImage | null>(null);
    const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
    const [generations, setGenerations] = useState<GeneratedImage[]>([]);
    const [adjustmentInput, setAdjustmentInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const hasGenerations = generations.length > 0;
    const controlsLocked = hasGenerations || isGenerating;
    const latestImageUrl = generations[0]?.url;

    const canSubmit = (() => {
        if (isGenerating) return false;
        if (!hasGenerations) {
            return Boolean(sourceImage && selectedStyleId);
        }
        return adjustmentInput.trim().length > 0;
    })();

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setIsGenerating(true);
        setErrorMsg(null);

        try {
            let body: Record<string, unknown>;
            let adjustmentText: string | undefined;

            if (!hasGenerations) {
                const preset = getStyleById(selectedStyleId);
                body = {
                    sourceImage: sourceImage!.dataUrl,
                    stylePrompt: preset?.promptFragment || '',
                    userPrompt: adjustmentInput.trim() || undefined,
                };
                adjustmentText = adjustmentInput.trim() || undefined;
            } else {
                body = {
                    referenceImageUrl: latestImageUrl,
                    adjustmentPrompt: adjustmentInput.trim(),
                };
                adjustmentText = adjustmentInput.trim();
            }

            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || `请求失败 (${response.status})`);
            }

            const data = await response.json();
            const newGen: GeneratedImage = {
                id: `${Date.now()}`,
                url: data.imageUrl,
                prompt: data.metadata?.prompt || '',
                adjustmentText,
                createdAt: Date.now(),
            };
            setGenerations(prev => [newGen, ...prev]);
            setAdjustmentInput('');
        } catch (err: any) {
            setErrorMsg(err.message || '生成失败，请重试');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleReset = () => {
        if (isGenerating) return;
        setSourceImage(null);
        setSelectedStyleId(null);
        setGenerations([]);
        setAdjustmentInput('');
        setErrorMsg(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const placeholder = hasGenerations
        ? '描述这一次的调整（例如：把墙面换成暖灰色微水泥）'
        : '可选：补充提示词（风格、材质、氛围…）';

    return (
        <div className="flex flex-col h-full bg-[var(--color-surface)] rounded-[20px] border border-[var(--color-border)] overflow-hidden shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]">
            {/* 顶部标题栏 */}
            <header className="flex items-center justify-between px-8 py-5 border-b border-[var(--color-border)] flex-shrink-0">
                <div className="flex items-baseline gap-3">
                    <h1 className="font-serif text-[22px] font-semibold text-[var(--color-ink)] tracking-wide">Atelier</h1>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-mute)]">Interior Studio · AI</span>
                </div>
                {hasGenerations && (
                    <button
                        onClick={handleReset}
                        disabled={isGenerating}
                        className="flex items-center gap-1.5 text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-40"
                    >
                        <RotateCcw size={12} />
                        重新开始
                    </button>
                )}
            </header>

            {/* 中间行：左侧控制 1/4 + 右侧图片流 */}
            <div className="flex-1 min-h-0 flex">
                <aside className="w-1/4 min-w-[260px] max-w-[340px] flex-shrink-0 border-r border-[var(--color-border)] flex flex-col overflow-y-auto bg-[var(--color-surface)]">
                    <div className="p-6 space-y-8">
                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-mute)]">
                                    01 · 原始模型图
                                </label>
                            </div>
                            <SourceUploader
                                sourceImage={sourceImage}
                                onSelect={setSourceImage}
                                onClear={() => setSourceImage(null)}
                                disabled={controlsLocked}
                            />
                        </section>

                        <section className="space-y-3">
                            <label className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-mute)]">
                                02 · 风格选择
                            </label>
                            <StyleSelector
                                presets={STYLE_PRESETS}
                                selectedId={selectedStyleId}
                                onSelect={setSelectedStyleId}
                                disabled={controlsLocked}
                            />
                        </section>
                    </div>
                </aside>

                <main className="flex-1 min-w-0 flex flex-col bg-[var(--color-canvas)]">
                    <GenerationStream generations={generations} isGenerating={isGenerating} />
                </main>
            </div>

            {/* 底部全宽对话框 */}
            <div className="border-t border-[var(--color-border)] px-6 py-4 flex items-end gap-3 bg-[var(--color-surface)] flex-shrink-0">
                <textarea
                    value={adjustmentInput}
                    onChange={(e) => setAdjustmentInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    rows={2}
                    disabled={isGenerating}
                    className="flex-1 text-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-5 py-3 text-[var(--color-ink)] placeholder:text-[var(--color-ink-mute)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-soft)] resize-none disabled:opacity-60 transition-colors"
                />
                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="flex-shrink-0 h-[52px] px-6 flex items-center justify-center gap-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[#1A1510] text-sm font-semibold rounded-2xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed tracking-wide"
                >
                    {isGenerating ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Sparkles size={16} />
                    )}
                    {isGenerating ? '生成中' : hasGenerations ? '调整' : '生成'}
                </button>
            </div>

            {errorMsg && <Toast message={errorMsg} onDismiss={() => setErrorMsg(null)} />}
        </div>
    );
}
