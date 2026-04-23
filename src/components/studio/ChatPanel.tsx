'use client';

import type { ReactNode } from 'react';
import type { GeneratedImage, SourceImage } from '@/types/studio';
import { FUNCTION_MODULES, getFunctionById } from '@/constants/functionModules';
import SourceUploader from './SourceUploader';
import FunctionSelector from './FunctionSelector';

interface ChatPanelProps {
    sourceImage: SourceImage | null;
    selectedFunctionId: string | null;
    generations: GeneratedImage[];
    isGenerating: boolean;
    selectedGenerationId: string | null;
    controlsLocked: boolean;
    onSelectSource: (img: SourceImage) => void;
    onClearSource: () => void;
    onSelectFunction: (id: string) => void;
    onSelectGeneration: (id: string) => void;
}

export default function ChatPanel({
    sourceImage,
    selectedFunctionId,
    generations,
    isGenerating,
    selectedGenerationId,
    controlsLocked,
    onSelectSource,
    onClearSource,
    onSelectFunction,
    onSelectGeneration,
}: ChatPanelProps) {
    const selectedFunction = getFunctionById(selectedFunctionId);
    const ordered = [...generations].reverse(); // oldest first in chat
    const firstRoundDone = generations.length > 0;

    return (
        <div className="px-4 py-5 space-y-4">
            <AIBubble>
                <p className="font-serif text-[15px] text-[var(--color-ink)] mb-1.5">欢迎来到 Atelier</p>
                <p className="text-[12px] text-[var(--color-ink-soft)] leading-relaxed">
                    上传一张图片，选择一个功能模块，可补充提示词后生成。之后可以继续对话迭代调整。
                </p>
            </AIBubble>

            <AIBubble label="步骤 1 · 上传图片">
                <SourceUploader
                    sourceImage={sourceImage}
                    onSelect={onSelectSource}
                    onClear={onClearSource}
                    disabled={controlsLocked}
                />
            </AIBubble>

            {sourceImage && (
                <UserBubble>已上传 <span className="font-mono text-[12px] text-[var(--color-ink-soft)]">{sourceImage.name}</span></UserBubble>
            )}

            {sourceImage && (
                <AIBubble label="步骤 2 · 选择功能模块">
                    <FunctionSelector
                        modules={FUNCTION_MODULES}
                        selectedId={selectedFunctionId}
                        onSelect={onSelectFunction}
                        disabled={controlsLocked}
                    />
                </AIBubble>
            )}

            {selectedFunction && (
                <UserBubble>选择了「{selectedFunction.name}」</UserBubble>
            )}

            {selectedFunction && !firstRoundDone && !isGenerating && (
                <AIBubble>
                    <p className="text-[12px] text-[var(--color-ink-soft)] leading-relaxed">
                        准备就绪。你可以在下方输入补充提示词（可选），或直接点「生成」。
                    </p>
                </AIBubble>
            )}

            {ordered.map((gen, idx) => {
                const isSelected = gen.id === selectedGenerationId;
                return (
                    <div key={gen.id} className="space-y-3">
                        {gen.adjustmentText && (
                            <UserBubble>{gen.adjustmentText}</UserBubble>
                        )}
                        <AIBubble>
                            <button
                                onClick={() => onSelectGeneration(gen.id)}
                                className={`block w-full rounded-lg overflow-hidden border-2 transition-all ${
                                    isSelected
                                        ? 'border-[var(--color-accent)] shadow-[0_0_0_3px_rgba(201,123,75,0.15)]'
                                        : 'border-transparent hover:border-[var(--color-border-strong)]'
                                }`}
                                title={isSelected ? '当前查看' : '点击查看大图'}
                            >
                                <img
                                    src={gen.url}
                                    alt={`Generation ${idx + 1}`}
                                    className="w-full block"
                                />
                            </button>
                            <div className="flex items-center justify-between pt-0.5">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-mute)]">
                                    {idx === 0 ? 'Origin' : `Iteration ${idx}`}
                                </span>
                                {isSelected && (
                                    <span className="text-[9px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
                                        · 当前
                                    </span>
                                )}
                            </div>
                        </AIBubble>
                    </div>
                );
            })}

            {isGenerating && (
                <AIBubble>
                    <div className="flex items-center gap-1.5 py-1">
                        <span className="typing-dot inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" style={{ animationDelay: '0ms' }} />
                        <span className="typing-dot inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" style={{ animationDelay: '150ms' }} />
                        <span className="typing-dot inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" style={{ animationDelay: '300ms' }} />
                        <span className="text-[11px] text-[var(--color-ink-mute)] ml-2 uppercase tracking-[0.15em]">Rendering…</span>
                    </div>
                </AIBubble>
            )}
        </div>
    );
}

function AIBubble({ children, label }: { children: ReactNode; label?: string }) {
    return (
        <div className="space-y-1.5">
            {label && (
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-mute)] pl-[38px]">
                    {label}
                </p>
            )}
            <div className="flex gap-2.5">
                <Avatar />
                <div className="flex-1 min-w-0 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl rounded-tl-[4px] px-3.5 py-3 space-y-2">
                    {children}
                </div>
            </div>
        </div>
    );
}

function UserBubble({ children }: { children: ReactNode }) {
    return (
        <div className="flex justify-end pl-8">
            <div className="bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/25 text-[var(--color-ink)] text-[13px] rounded-2xl rounded-tr-[4px] px-3.5 py-2 leading-relaxed">
                {children}
            </div>
        </div>
    );
}

function Avatar() {
    return (
        <div className="w-7 h-7 flex-shrink-0 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-[11px] font-serif font-semibold text-[#1A1510] shadow-[0_2px_6px_rgba(201,123,75,0.3)]">
            A
        </div>
    );
}
