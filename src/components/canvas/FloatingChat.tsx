'use client';

import { Cpu, Image as ImageIcon, Loader2, Maximize2, Ratio, Sparkles, Trash2, Upload } from 'lucide-react';
import type { AspectRatio, CanvasNode, ModelId, Resolution } from '@/types/canvas';
import { FUNCTION_MODULES, getFunctionById } from '@/constants/functionModules';
import {
    ASPECT_RATIOS,
    MODELS,
    RESOLUTIONS,
    aspectLabel,
    computePlaceholderSize,
    modelLabel,
} from '@/lib/canvasSize';

interface Props {
    node: CanvasNode;
    parent: CanvasNode | null;
    canReplaceSource: boolean;
    isGenerating: boolean;
    onPatch: (patch: Partial<CanvasNode>) => void;
    onGenerate: () => void;
    onDelete: () => void;
    onReplaceSource: () => void;
}

const SECTION_LABEL =
    'text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-mute)]';

function Wrapper({ children }: { children: React.ReactNode }) {
    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[680px] max-w-[calc(100vw-32px)] bg-[var(--color-surface)]/95 backdrop-blur border border-[var(--color-border)] rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)] overflow-hidden">
            {children}
        </div>
    );
}

function Pill({
    children,
    icon,
}: {
    children: React.ReactNode;
    icon?: React.ReactNode;
}) {
    return (
        <span className="inline-flex items-center gap-1 px-2.5 h-6 rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[11px] text-[var(--color-ink-soft)]">
            {icon}
            {children}
        </span>
    );
}

export default function FloatingChat({
    node,
    parent,
    canReplaceSource,
    isGenerating,
    onPatch,
    onGenerate,
    onDelete,
    onReplaceSource,
}: Props) {
    const isReady = node.status === 'ready';
    const isSource = parent === null;
    const isGeneratingNode = node.status === 'generating';
    const isFirstRoundFlow = parent !== null && parent.parentId === null;

    // Variant C: source image
    if (isReady && isSource) {
        return (
            <Wrapper>
                <div className="flex items-center gap-2 px-4 py-3">
                    <Pill icon={<ImageIcon size={11} />}>
                        源图 · {Math.round(node.width)}×{Math.round(node.height)}
                    </Pill>
                    <span className="text-[11px] text-[var(--color-ink-mute)]">
                        拖动右侧 + 号生成新图
                    </span>
                    <div className="flex-1" />
                    {canReplaceSource && (
                        <button
                            onClick={onReplaceSource}
                            className="inline-flex items-center gap-1 px-2.5 h-8 rounded-md text-[11px] text-[var(--color-ink-soft)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-raised)] transition-colors"
                        >
                            <Upload size={12} />
                            替换图片
                        </button>
                    )}
                    <button
                        onClick={onDelete}
                        title="删除"
                        className="w-8 h-8 inline-flex items-center justify-center rounded-md text-[var(--color-ink-mute)] hover:text-red-400 hover:bg-[var(--color-surface-raised)] transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </Wrapper>
        );
    }

    // Variant D: generated ready node
    if (isReady && !isSource) {
        const fn = getFunctionById(node.functionId);
        return (
            <Wrapper>
                <div className="px-4 pt-3 pb-2 flex flex-wrap items-center gap-1.5">
                    <span className={`${SECTION_LABEL} mr-1`}>生成参数</span>
                    {fn && <Pill>{fn.name}</Pill>}
                    <Pill icon={<Cpu size={11} />}>{modelLabel(node.model)}</Pill>
                    {node.resolution && (
                        <Pill icon={<Maximize2 size={11} />}>{node.resolution}</Pill>
                    )}
                    {node.aspectRatio && (
                        <Pill icon={<Ratio size={11} />}>{aspectLabel(node.aspectRatio)}</Pill>
                    )}
                    <Pill>
                        {Math.round(node.width)}×{Math.round(node.height)}
                    </Pill>
                </div>
                {node.prompt && (
                    <div className="px-4 py-2 text-xs text-[var(--color-ink-soft)] border-t border-[var(--color-border)] line-clamp-2">
                        {node.prompt}
                    </div>
                )}
                <div className="flex items-center px-4 py-2 border-t border-[var(--color-border)]">
                    <span className="text-[11px] text-[var(--color-ink-mute)]">
                        拖动右侧 + 号继续调整
                    </span>
                    <div className="flex-1" />
                    <button
                        onClick={onDelete}
                        title="删除"
                        className="w-8 h-8 inline-flex items-center justify-center rounded-md text-[var(--color-ink-mute)] hover:text-red-400 hover:bg-[var(--color-surface-raised)] transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </Wrapper>
        );
    }

    // Variants A & B: placeholder / generating — edit form
    const currentAspect: AspectRatio = node.aspectRatio ?? 'original';
    const currentResolution: Resolution = node.resolution ?? '2K';
    const currentModel: ModelId = node.model ?? 'default';
    const fnId = node.functionId;
    const promptText = node.prompt ?? '';

    function handleAspectChange(r: AspectRatio) {
        if (!parent) {
            onPatch({ aspectRatio: r });
            return;
        }
        const size = computePlaceholderSize(parent, r);
        onPatch({ aspectRatio: r, width: size.width, height: size.height });
    }

    const inputDisabled = isGeneratingNode;

    return (
        <Wrapper>
            {isFirstRoundFlow && (
                <div className="px-4 pt-3 pb-2 border-b border-[var(--color-border)]">
                    <div className={`${SECTION_LABEL} mb-2`}>功能模块 · 可选</div>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {FUNCTION_MODULES.map(fn => (
                            <button
                                key={fn.id}
                                disabled={inputDisabled}
                                onClick={() =>
                                    onPatch({
                                        functionId: fnId === fn.id ? undefined : fn.id,
                                    })
                                }
                                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                    fnId === fn.id
                                        ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)] text-[var(--color-accent)]'
                                        : 'bg-[var(--color-surface-raised)] border-[var(--color-border)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
                                }`}
                            >
                                {fn.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="px-4 py-2 border-b border-[var(--color-border)] flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-2">
                    <span className={`${SECTION_LABEL} inline-flex items-center gap-1`}>
                        <Cpu size={11} />
                        模型
                    </span>
                    <div className="flex items-center bg-[var(--color-surface-raised)] rounded-md p-0.5">
                        {MODELS.map(m => (
                            <button
                                key={m.id}
                                disabled={inputDisabled}
                                onClick={() => onPatch({ model: m.id })}
                                className={`px-2 h-6 text-[11px] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                    currentModel === m.id
                                        ? 'bg-[var(--color-surface)] text-[var(--color-accent)]'
                                        : 'text-[var(--color-ink-mute)] hover:text-[var(--color-ink-soft)]'
                                }`}
                            >
                                {m.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`${SECTION_LABEL} inline-flex items-center gap-1`}>
                        <Ratio size={11} />
                        比例
                    </span>
                    <div className="flex items-center bg-[var(--color-surface-raised)] rounded-md p-0.5">
                        {ASPECT_RATIOS.map(r => (
                            <button
                                key={r}
                                disabled={inputDisabled}
                                onClick={() => handleAspectChange(r)}
                                className={`px-2 h-6 text-[11px] tabular-nums rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                    currentAspect === r
                                        ? 'bg-[var(--color-surface)] text-[var(--color-accent)]'
                                        : 'text-[var(--color-ink-mute)] hover:text-[var(--color-ink-soft)]'
                                }`}
                            >
                                {aspectLabel(r)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`${SECTION_LABEL} inline-flex items-center gap-1`}>
                        <Maximize2 size={11} />
                        分辨率
                    </span>
                    <div className="flex items-center bg-[var(--color-surface-raised)] rounded-md p-0.5">
                        {RESOLUTIONS.map(r => (
                            <button
                                key={r}
                                disabled={inputDisabled}
                                onClick={() => onPatch({ resolution: r })}
                                className={`px-2.5 h-6 text-[11px] tabular-nums rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                    currentResolution === r
                                        ? 'bg-[var(--color-surface)] text-[var(--color-accent)]'
                                        : 'text-[var(--color-ink-mute)] hover:text-[var(--color-ink-soft)]'
                                }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 p-3">
                <input
                    type="text"
                    value={promptText}
                    onChange={(e) => onPatch({ prompt: e.target.value })}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            onGenerate();
                        }
                    }}
                    placeholder={
                        isFirstRoundFlow
                            ? fnId
                                ? '可选：补充描述细节…'
                                : '描述要生成的内容…'
                            : '输入调整指令…'
                    }
                    disabled={inputDisabled}
                    className="flex-1 bg-transparent text-sm text-[var(--color-ink)] placeholder-[var(--color-ink-mute)] outline-none px-2"
                />
                <button
                    onClick={onDelete}
                    title="删除节点"
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--color-ink-mute)] hover:text-red-400 hover:bg-[var(--color-surface-raised)] transition-colors"
                >
                    <Trash2 size={15} />
                </button>
                <button
                    onClick={onGenerate}
                    disabled={isGenerating || isGeneratingNode}
                    className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-[var(--color-accent)] text-[#1a1714] text-xs font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                    {isGenerating || isGeneratingNode ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <Sparkles size={14} />
                    )}
                    {isGenerating || isGeneratingNode ? '生成中' : isFirstRoundFlow ? '生成' : '调整'}
                </button>
            </div>
        </Wrapper>
    );
}
