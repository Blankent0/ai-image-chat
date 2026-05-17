'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Circle, Group, Layer, Line, Rect, Stage } from 'react-konva';
import type Konva from 'konva';
import { Upload } from 'lucide-react';
import { getFunctionById } from '@/constants/functionModules';
import type { CanvasNode, CanvasSession } from '@/types/canvas';
import { useCanvasSessions } from '@/hooks/useCanvasSessions';
import { computeApiSize, computePlaceholderSize } from '@/lib/canvasSize';
import FloatingChat from './FloatingChat';
import ImageNode from './ImageNode';
import SessionSidebar from './SessionSidebar';

const SCALE_MIN = 0.2;
const SCALE_MAX = 4;
const SCALE_BY = 1.05;
const ACCENT = '#d6a86a';

function createNodeId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createSessionId(): string {
    return `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function loadImageDimensions(src: string): Promise<{ w: number; h: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = reject;
        img.src = src;
    });
}

function fitInto(w: number, h: number, max: number): { width: number; height: number } {
    const ratio = w / h;
    if (w <= max && h <= max) return { width: w, height: h };
    return ratio >= 1
        ? { width: max, height: max / ratio }
        : { width: max * ratio, height: max };
}

export default function CanvasStudio() {
    const stageRef = useRef<Konva.Stage>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const loadedSessionRef = useRef<string | null>(null);
    const createdAtRef = useRef<number>(0);
    const initialBootRef = useRef(false);
    const replaceTargetRef = useRef<string | null>(null);

    const { sessions, activeId, hydrated, upsert, remove, setActive } = useCanvasSessions();

    const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [stageScale, setStageScale] = useState(1);

    const [nodes, setNodes] = useState<CanvasNode[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const [draggingFromId, setDraggingFromId] = useState<string | null>(null);
    const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);

    const [isGenerating, setIsGenerating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Refs mirroring state for doc-level listeners
    const draggingFromRef = useRef<string | null>(null);
    const ghostPosRef = useRef<{ x: number; y: number } | null>(null);
    const stagePosRef = useRef(stagePos);
    const stageScaleRef = useRef(stageScale);
    const nodesRef = useRef(nodes);
    useEffect(() => { stagePosRef.current = stagePos; }, [stagePos]);
    useEffect(() => { stageScaleRef.current = stageScale; }, [stageScale]);
    useEffect(() => { nodesRef.current = nodes; }, [nodes]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const selectedNode = nodes.find(n => n.id === selectedId) ?? null;
    const parentOfSelected = selectedNode
        ? nodes.find(n => n.id === selectedNode.parentId) ?? null
        : null;
    const canReplaceSource =
        !!selectedNode &&
        selectedNode.parentId === null &&
        selectedNode.status === 'ready' &&
        !nodes.some(n => n.parentId === selectedNode.id);
    const showPlusHandle =
        !!selectedNode && selectedNode.status === 'ready' && !draggingFromId;

    // Resize observer
    useEffect(() => {
        if (!containerRef.current) return;
        const el = containerRef.current;
        const update = () => setStageSize({ width: el.clientWidth, height: el.clientHeight });
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Doc-level "+ handle" drag listeners
    useEffect(() => {
        function onMove(e: MouseEvent) {
            if (!draggingFromRef.current) return;
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;
            const sx = (px - stagePosRef.current.x) / stageScaleRef.current;
            const sy = (py - stagePosRef.current.y) / stageScaleRef.current;
            ghostPosRef.current = { x: sx, y: sy };
            setGhostPos({ x: sx, y: sy });
        }
        function onUp() {
            if (!draggingFromRef.current) return;
            const parentId = draggingFromRef.current;
            const ghost = ghostPosRef.current;
            draggingFromRef.current = null;
            ghostPosRef.current = null;
            setDraggingFromId(null);
            setGhostPos(null);
            document.body.style.cursor = '';
            if (!ghost) return;
            const parent = nodesRef.current.find(n => n.id === parentId);
            if (!parent) return;
            const size = computePlaceholderSize(parent, 'original');
            const placeholder: CanvasNode = {
                id: createNodeId(),
                x: ghost.x - size.width / 2,
                y: ghost.y - size.height / 2,
                width: size.width,
                height: size.height,
                url: '',
                parentId: parent.id,
                resolution: '2K',
                aspectRatio: 'original',
                status: 'placeholder',
                createdAt: Date.now(),
            };
            setNodes(prev => [...prev, placeholder]);
            setSelectedId(placeholder.id);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        return () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
    }, []);

    const createNewSession = useCallback(() => {
        const id = createSessionId();
        const now = Date.now();
        upsert({
            id,
            name: '未命名',
            createdAt: now,
            updatedAt: now,
            nodes: [],
            viewport: { x: 0, y: 0, scale: 1 },
        });
        setActive(id);
        loadedSessionRef.current = id;
        createdAtRef.current = now;
        setNodes([]);
        setStagePos({ x: 0, y: 0 });
        setStageScale(1);
        setSelectedId(null);
        setErrorMsg(null);
    }, [upsert, setActive]);

    // Initial bootstrap: ensure there's an active session
    useEffect(() => {
        if (!hydrated || initialBootRef.current) return;
        initialBootRef.current = true;
        if (!activeId) {
            if (sessions.length > 0) {
                setActive(sessions[0].id);
            } else {
                createNewSession();
            }
        }
    }, [hydrated, activeId, sessions, setActive, createNewSession]);

    // Load session content when active changes
    useEffect(() => {
        if (!hydrated || !activeId) return;
        if (loadedSessionRef.current === activeId) return;
        const s = sessions.find(x => x.id === activeId);
        if (!s) return;
        loadedSessionRef.current = activeId;
        createdAtRef.current = s.createdAt;
        setNodes(s.nodes.filter(n => n.status === 'ready'));
        setStagePos({ x: s.viewport.x, y: s.viewport.y });
        setStageScale(s.viewport.scale);
        setSelectedId(null);
        setErrorMsg(null);
    }, [activeId, hydrated, sessions]);

    // Auto-save current state (debounced) — persist only ready nodes
    useEffect(() => {
        if (!hydrated || !activeId || loadedSessionRef.current !== activeId) return;
        const t = setTimeout(() => {
            const existing = sessions.find(s => s.id === activeId);
            const session: CanvasSession = {
                id: activeId,
                name: existing?.name || '未命名',
                createdAt: createdAtRef.current || Date.now(),
                updatedAt: Date.now(),
                nodes: nodes.filter(n => n.status === 'ready'),
                viewport: { x: stagePos.x, y: stagePos.y, scale: stageScale },
            };
            upsert(session);
        }, 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodes, stagePos, stageScale, activeId, hydrated]);

    function handleSelectSession(id: string) {
        setActive(id);
    }

    function handleDeleteSession(id: string) {
        const wasActive = id === activeId;
        remove(id);
        if (wasActive) {
            loadedSessionRef.current = null;
            const next = sessions.find(s => s.id !== id);
            if (next) {
                setActive(next.id);
            } else {
                createNewSession();
            }
        }
    }

    function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };
        const direction = e.evt.deltaY > 0 ? -1 : 1;
        let newScale = direction > 0 ? oldScale * SCALE_BY : oldScale / SCALE_BY;
        newScale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, newScale));
        setStageScale(newScale);
        setStagePos({
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        });
    }

    function clearSelectionOnEmpty(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
        if (e.target === e.target.getStage()) setSelectedId(null);
    }

    function handleFile(file: File) {
        const reader = new FileReader();
        reader.onload = async () => {
            const dataUrl = reader.result as string;
            const { w, h } = await loadImageDimensions(dataUrl);
            const { width, height } = fitInto(w, h, 480);

            const replaceId = replaceTargetRef.current;
            replaceTargetRef.current = null;

            if (replaceId) {
                let replaced = false;
                setNodes(prev => {
                    if (!prev.some(n => n.id === replaceId)) return prev;
                    replaced = true;
                    return prev.map(n =>
                        n.id === replaceId
                            ? { ...n, url: dataUrl, width, height, createdAt: Date.now() }
                            : n,
                    );
                });
                if (replaced) return;
            }

            const cx = (stageSize.width / 2 - stagePos.x) / stageScale;
            const cy = (stageSize.height / 2 - stagePos.y) / stageScale;
            const node: CanvasNode = {
                id: createNodeId(),
                x: cx - width / 2,
                y: cy - height / 2,
                width,
                height,
                url: dataUrl,
                parentId: null,
                status: 'ready',
                createdAt: Date.now(),
            };
            setNodes(prev => [...prev, node]);
            setSelectedId(node.id);
        };
        reader.readAsDataURL(file);
    }

    function handleReplaceSource(nodeId: string) {
        replaceTargetRef.current = nodeId;
        fileInputRef.current?.click();
    }

    function handlePlusMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
        if (!selectedNode) return;
        e.cancelBubble = true;
        e.evt.stopPropagation();
        e.evt.preventDefault();
        draggingFromRef.current = selectedNode.id;
        ghostPosRef.current = null;
        setDraggingFromId(selectedNode.id);
        document.body.style.cursor = 'crosshair';
    }

    function patchSelectedNode(patch: Partial<CanvasNode>) {
        if (!selectedNode) return;
        const targetId = selectedNode.id;
        setNodes(prev =>
            prev.map(n => (n.id === targetId ? { ...n, ...patch } : n)),
        );
    }

    async function handleGenerate() {
        if (!selectedNode || isGenerating) return;
        if (selectedNode.status !== 'placeholder') return;
        const parent = nodes.find(n => n.id === selectedNode.parentId);
        if (!parent) return;

        const isFirstRoundFlow = parent.parentId === null;
        const promptText = (selectedNode.prompt ?? '').trim();
        const fnId = selectedNode.functionId;
        const resolution = selectedNode.resolution ?? '2K';
        const aspectRatio = selectedNode.aspectRatio ?? 'original';

        if (isFirstRoundFlow) {
            if (!fnId && !promptText) {
                setErrorMsg('请选择功能模块或输入描述');
                return;
            }
        } else if (!promptText) {
            setErrorMsg('请输入调整指令');
            return;
        }
        setErrorMsg(null);

        const apiSize = computeApiSize(resolution, aspectRatio, parent);

        const placeholderId = selectedNode.id;
        setIsGenerating(true);
        setNodes(prev =>
            prev.map(n =>
                n.id === placeholderId ? { ...n, status: 'generating' as const } : n,
            ),
        );

        try {
            const body: Record<string, unknown> = { size: apiSize, resolution };
            if (isFirstRoundFlow) {
                body.sourceImage = parent.url;
                if (fnId) {
                    const fn = getFunctionById(fnId);
                    if (fn) body.functionPrompt = fn.defaultPrompt;
                }
                if (promptText) body.userPrompt = promptText;
            } else {
                body.referenceImageUrl = parent.url;
                body.adjustmentPrompt = promptText;
            }

            const res = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `Request failed (${res.status})`);
            }
            const data = await res.json();
            const url = data.imageUrl as string;
            const dims = await loadImageDimensions(url);
            const fitted = fitInto(dims.w, dims.h, 480);

            setNodes(prev =>
                prev.map(n =>
                    n.id === placeholderId
                        ? {
                              ...n,
                              url,
                              width: fitted.width,
                              height: fitted.height,
                              status: 'ready' as const,
                          }
                        : n,
                ),
            );
        } catch (err) {
            const msg = err instanceof Error ? err.message : '生成失败';
            setErrorMsg(msg);
            // Revert to placeholder, preserve user inputs for retry
            setNodes(prev =>
                prev.map(n =>
                    n.id === placeholderId ? { ...n, status: 'placeholder' as const } : n,
                ),
            );
        } finally {
            setIsGenerating(false);
        }
    }

    function handleDeleteNode() {
        if (!selectedId) return;
        setNodes(prev => prev.filter(n => n.id !== selectedId));
        setSelectedId(null);
    }

    const handleScale = 1 / stageScale;

    return (
        <div className="w-full h-full flex">
            <SessionSidebar
                sessions={sessions}
                activeId={activeId}
                onSelect={handleSelectSession}
                onNew={createNewSession}
                onDelete={handleDeleteSession}
            />

            <div ref={containerRef} className="relative flex-1 bg-[var(--color-canvas,#1a1714)]">
                <Stage
                    ref={stageRef}
                    width={stageSize.width}
                    height={stageSize.height}
                    x={stagePos.x}
                    y={stagePos.y}
                    scaleX={stageScale}
                    scaleY={stageScale}
                    draggable={!draggingFromId}
                    onWheel={handleWheel}
                    onMouseDown={clearSelectionOnEmpty}
                    onTouchStart={clearSelectionOnEmpty}
                    onDragEnd={(e) => {
                        if (e.target === e.target.getStage()) {
                            setStagePos({ x: e.target.x(), y: e.target.y() });
                        }
                    }}
                >
                    <Layer>
                        {/* Parent → child connection lines (drawn under nodes) */}
                        {nodes.map(node => {
                            if (!node.parentId) return null;
                            const parent = nodes.find(n => n.id === node.parentId);
                            if (!parent) return null;
                            const x1 = parent.x + parent.width;
                            const y1 = parent.y + parent.height / 2;
                            const x2 = node.x;
                            const y2 = node.y + node.height / 2;
                            const dx = Math.max(40, Math.abs(x2 - x1) * 0.45);
                            return (
                                <Line
                                    key={`link-${node.id}`}
                                    points={[x1, y1, x1 + dx, y1, x2 - dx, y2, x2, y2]}
                                    bezier
                                    stroke={ACCENT}
                                    opacity={0.45}
                                    strokeWidth={1.5 * handleScale}
                                    dash={[8 * handleScale, 5 * handleScale]}
                                    listening={false}
                                />
                            );
                        })}

                        {nodes.map(node => (
                            <ImageNode
                                key={node.id}
                                node={node}
                                isSelected={selectedId === node.id}
                                onSelect={() => setSelectedId(node.id)}
                                onChange={(patch) =>
                                    setNodes(prev =>
                                        prev.map(n => (n.id === node.id ? { ...n, ...patch } : n)),
                                    )
                                }
                            />
                        ))}

                        {/* "+" handle on right edge of selected ready node */}
                        {showPlusHandle && selectedNode && (
                            <Group
                                x={selectedNode.x + selectedNode.width + 22 * handleScale}
                                y={selectedNode.y + selectedNode.height / 2}
                                scaleX={handleScale}
                                scaleY={handleScale}
                                onMouseDown={handlePlusMouseDown}
                                onMouseEnter={() => {
                                    document.body.style.cursor = 'crosshair';
                                }}
                                onMouseLeave={() => {
                                    if (!draggingFromRef.current) document.body.style.cursor = '';
                                }}
                            >
                                <Circle
                                    radius={14}
                                    fill={ACCENT}
                                    shadowColor="black"
                                    shadowBlur={10}
                                    shadowOpacity={0.5}
                                />
                                <Line points={[-6, 0, 6, 0]} stroke="#1a1714" strokeWidth={2} />
                                <Line points={[0, -6, 0, 6]} stroke="#1a1714" strokeWidth={2} />
                            </Group>
                        )}

                        {/* Ghost preview while dragging "+" */}
                        {draggingFromId && ghostPos && (() => {
                            const parent = nodes.find(n => n.id === draggingFromId);
                            if (!parent) return null;
                            const size = computePlaceholderSize(parent, 'original');
                            const x1 = parent.x + parent.width;
                            const y1 = parent.y + parent.height / 2;
                            const dx = Math.max(40, Math.abs(ghostPos.x - x1) * 0.45);
                            return (
                                <Group listening={false}>
                                    <Line
                                        points={[
                                            x1, y1,
                                            x1 + dx, y1,
                                            ghostPos.x - dx, ghostPos.y,
                                            ghostPos.x, ghostPos.y,
                                        ]}
                                        bezier
                                        stroke={ACCENT}
                                        strokeWidth={2 * handleScale}
                                        dash={[6 * handleScale, 4 * handleScale]}
                                    />
                                    <Rect
                                        x={ghostPos.x - size.width / 2}
                                        y={ghostPos.y - size.height / 2}
                                        width={size.width}
                                        height={size.height}
                                        stroke={ACCENT}
                                        strokeWidth={2 * handleScale}
                                        dash={[6 * handleScale, 4 * handleScale]}
                                        fill="rgba(214, 168, 106, 0.05)"
                                        cornerRadius={6}
                                    />
                                </Group>
                            );
                        })()}
                    </Layer>
                </Stage>

                {/* Top-right zoom indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-[var(--color-surface)]/90 backdrop-blur border border-[var(--color-border)] text-[11px] tabular-nums text-[var(--color-ink-soft)]">
                        {Math.round(stageScale * 100)}%
                    </span>
                </div>

                {/* Empty state */}
                {nodes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="pointer-events-auto group flex flex-col items-center gap-4 px-12 py-10 rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 backdrop-blur hover:border-[var(--color-accent)] hover:bg-[var(--color-surface)]/80 transition-all"
                        >
                            <div className="w-16 h-16 rounded-full bg-[var(--color-surface-raised)] flex items-center justify-center group-hover:bg-[var(--color-accent)]/15">
                                <Upload size={24} className="text-[var(--color-ink-soft)] group-hover:text-[var(--color-accent)]" />
                            </div>
                            <div className="text-center">
                                <p className="font-serif text-xl text-[var(--color-ink)] mb-1">上传一张图开始</p>
                                <p className="text-xs text-[var(--color-ink-mute)] leading-relaxed">
                                    3D 模型 / 草图 / 户型图都可以
                                </p>
                            </div>
                        </button>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                        e.target.value = '';
                    }}
                />

                {selectedNode && (
                    <FloatingChat
                        node={selectedNode}
                        parent={parentOfSelected}
                        canReplaceSource={canReplaceSource}
                        isGenerating={isGenerating}
                        onPatch={patchSelectedNode}
                        onGenerate={handleGenerate}
                        onDelete={handleDeleteNode}
                        onReplaceSource={() => handleReplaceSource(selectedNode.id)}
                    />
                )}

                {errorMsg && (
                    <div className="absolute top-20 right-4 px-4 py-2.5 rounded-lg bg-red-500/15 border border-red-500/40 text-xs text-red-300 max-w-sm">
                        {errorMsg}
                        <button
                            onClick={() => setErrorMsg(null)}
                            className="ml-3 text-red-300/70 hover:text-red-300"
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
