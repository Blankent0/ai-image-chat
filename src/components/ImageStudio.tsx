'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, RotateCcw, Loader2, Send } from 'lucide-react';
import type { GeneratedImage, SourceImage } from '@/types/studio';
import { getFunctionById } from '@/constants/functionModules';
import ChatPanel from './studio/ChatPanel';
import MainCanvas from './studio/MainCanvas';
import HistoryStrip from './studio/HistoryStrip';
import Toast from './studio/Toast';

export default function ImageStudio() {
    const [sourceImage, setSourceImage] = useState<SourceImage | null>(null);
    const [selectedFunctionId, setSelectedFunctionId] = useState<string | null>(null);
    const [generations, setGenerations] = useState<GeneratedImage[]>([]);
    const [adjustmentInput, setAdjustmentInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null);

    const chatScrollRef = useRef<HTMLDivElement>(null);

    const hasGenerations = generations.length > 0;
    const controlsLocked = hasGenerations || isGenerating;
    const selectedGen =
        generations.find(g => g.id === selectedGenerationId) ?? generations[0] ?? null;

    const canSubmit = (() => {
        if (isGenerating) return false;
        if (!hasGenerations) {
            return Boolean(sourceImage && selectedFunctionId);
        }
        return adjustmentInput.trim().length > 0;
    })();

    useEffect(() => {
        const el = chatScrollRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, [generations.length, isGenerating, sourceImage, selectedFunctionId]);

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setIsGenerating(true);
        setErrorMsg(null);

        try {
            let body: Record<string, unknown>;
            let adjustmentText: string | undefined;

            if (!hasGenerations) {
                const mod = getFunctionById(selectedFunctionId);
                body = {
                    sourceImage: sourceImage!.dataUrl,
                    functionPrompt: mod?.defaultPrompt || '',
                    userPrompt: adjustmentInput.trim() || undefined,
                };
                adjustmentText = adjustmentInput.trim() || undefined;
            } else {
                const referenceUrl = selectedGen?.url ?? generations[0].url;
                body = {
                    referenceImageUrl: referenceUrl,
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
            setSelectedGenerationId(newGen.id);
            setAdjustmentInput('');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : '生成失败，请重试';
            setErrorMsg(message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleReset = () => {
        if (isGenerating) return;
        setSourceImage(null);
        setSelectedFunctionId(null);
        setGenerations([]);
        setSelectedGenerationId(null);
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
        : '可选：补充提示词（材质、氛围…）';

    const submitLabel = isGenerating ? '生成中' : hasGenerations ? '调整' : '生成';

    return (
        <div className="flex h-full bg-[var(--color-chat-panel)] rounded-[20px] overflow-hidden border border-[var(--color-border)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
            {/* LEFT: Chat panel */}
            <aside className="w-[380px] flex-shrink-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-chat-panel)]">
                <header className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] flex-shrink-0">
                    <div>
                        <h1 className="font-serif text-[18px] text-[var(--color-ink)] leading-none mb-1">Atelier</h1>
                        <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-ink-mute)]">
                            Interior Studio · AI
                        </span>
                    </div>
                    {hasGenerations && (
                        <button
                            onClick={handleReset}
                            disabled={isGenerating}
                            className="flex items-center gap-1.5 text-[11px] text-[var(--color-ink-soft)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-40"
                        >
                            <RotateCcw size={12} />
                            重新开始
                        </button>
                    )}
                </header>

                <div ref={chatScrollRef} className="flex-1 overflow-y-auto">
                    <ChatPanel
                        sourceImage={sourceImage}
                        selectedFunctionId={selectedFunctionId}
                        generations={generations}
                        isGenerating={isGenerating}
                        selectedGenerationId={selectedGen?.id ?? null}
                        controlsLocked={controlsLocked}
                        onSelectSource={setSourceImage}
                        onClearSource={() => setSourceImage(null)}
                        onSelectFunction={setSelectedFunctionId}
                        onSelectGeneration={setSelectedGenerationId}
                    />
                </div>

                <div className="border-t border-[var(--color-border)] px-3.5 py-3 flex items-end gap-2 flex-shrink-0 bg-[var(--color-chat-panel)]">
                    <textarea
                        value={adjustmentInput}
                        onChange={(e) => setAdjustmentInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        rows={2}
                        disabled={isGenerating}
                        className="flex-1 min-w-0 text-[13px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[var(--color-ink)] placeholder:text-[var(--color-ink-mute)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-soft)] resize-none disabled:opacity-60 transition-colors leading-relaxed"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        title={submitLabel}
                        className="flex-shrink-0 h-[46px] w-[46px] flex items-center justify-center bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[#1A1510] rounded-xl transition-colors disabled:opacity-35 disabled:cursor-not-allowed shadow-[0_4px_12px_-2px_rgba(201,123,75,0.4)]"
                    >
                        {isGenerating ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : hasGenerations ? (
                            <Send size={15} />
                        ) : (
                            <Sparkles size={16} />
                        )}
                    </button>
                </div>
            </aside>

            {/* RIGHT: Main canvas + history strip */}
            <main className="flex-1 min-w-0 flex flex-col bg-[var(--color-canvas)] studio-grain">
                <div className="flex-1 min-h-0 relative">
                    <MainCanvas
                        selectedGen={selectedGen}
                        isGenerating={isGenerating}
                        hasAnyGeneration={hasGenerations}
                    />
                </div>
                <HistoryStrip
                    generations={generations}
                    selectedId={selectedGen?.id ?? null}
                    onSelect={setSelectedGenerationId}
                />
            </main>

            {errorMsg && <Toast message={errorMsg} onDismiss={() => setErrorMsg(null)} />}
        </div>
    );
}
