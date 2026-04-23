export interface FunctionModule {
    id: string;
    name: string;             // 中文显示名
    description: string;      // 简短说明（卡片副标题）
    defaultPrompt: string;    // 英文默认 prompt，首轮注入
    thumbnail?: string;
}

export interface SourceImage {
    dataUrl: string;
    name: string;
}

export interface GeneratedImage {
    id: string;
    url: string;
    prompt: string;
    adjustmentText?: string;
    createdAt: number;
}

export interface StudioState {
    sourceImage: SourceImage | null;
    selectedFunctionId: string | null;
    generations: GeneratedImage[];
    adjustmentInput: string;
    isGenerating: boolean;
}
