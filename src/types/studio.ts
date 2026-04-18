export interface StylePreset {
    id: string;
    name: string;
    promptFragment: string;
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
    selectedStyleId: string | null;
    generations: GeneratedImage[];
    adjustmentInput: string;
    isGenerating: boolean;
}
