export type CanvasNodeStatus = 'placeholder' | 'ready' | 'generating' | 'failed';

export type Resolution = '1K' | '2K' | '4K';

export type AspectRatio = 'original' | '1:1' | '4:3' | '3:4' | '16:9' | '9:16';

export type ModelId = 'default' | 'doubao' | 'gpt' | 'banana' | 'grok';

export interface CanvasNode {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    url: string;
    parentId: string | null;
    prompt?: string;
    functionId?: string;
    resolution?: Resolution;
    aspectRatio?: AspectRatio;
    model?: ModelId;
    status: CanvasNodeStatus;
    createdAt: number;
}

export interface CanvasViewport {
    x: number;
    y: number;
    scale: number;
}

export interface CanvasSession {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    nodes: CanvasNode[];
    viewport: CanvasViewport;
}
