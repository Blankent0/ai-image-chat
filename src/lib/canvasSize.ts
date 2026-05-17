import type { AspectRatio, ModelId, Resolution } from '@/types/canvas';

export const RESOLUTIONS: Resolution[] = ['1K', '2K', '4K'];
export const ASPECT_RATIOS: AspectRatio[] = ['original', '1:1', '4:3', '3:4', '16:9', '9:16'];

export const MODELS: { id: ModelId; name: string }[] = [
    { id: 'default', name: '默认' },
    { id: 'doubao', name: '豆包' },
    { id: 'gpt', name: 'GPT' },
    { id: 'banana', name: '香蕉' },
    { id: 'grok', name: 'grok' },
];

export function modelLabel(id: ModelId | undefined): string {
    return MODELS.find(m => m.id === id)?.name ?? '默认';
}

export function aspectLabel(a: AspectRatio): string {
    return a === 'original' ? '原图' : a;
}

interface SizeBox {
    width: number;
    height: number;
}

export function computePlaceholderSize(parent: SizeBox, ratio: AspectRatio): SizeBox {
    if (ratio === 'original') return { width: parent.width, height: parent.height };
    const max = Math.max(parent.width, parent.height);
    const [w, h] = ratio.split(':').map(Number);
    return w >= h
        ? { width: max, height: (max * h) / w }
        : { width: (max * w) / h, height: max };
}

const TARGET_AREA: Record<Resolution, number> = {
    '1K': 1024 * 1024,
    '2K': 2048 * 2048,
    '4K': 4096 * 4096,
};
const MIN_PIXELS = 3_686_400; // Seedream lower bound
const MAX_SIDE = 4096;

export function computeApiSize(
    resolution: Resolution,
    ratio: AspectRatio,
    parent?: SizeBox,
): string {
    let rw: number;
    let rh: number;
    if (ratio === 'original' && parent) {
        rw = parent.width;
        rh = parent.height;
    } else if (ratio === 'original') {
        rw = 1;
        rh = 1;
    } else {
        const parts = ratio.split(':').map(Number);
        rw = parts[0];
        rh = parts[1];
    }
    const aspect = rw / rh;
    const targetArea = Math.max(MIN_PIXELS, TARGET_AREA[resolution]);
    let h = Math.sqrt(targetArea / aspect);
    let w = h * aspect;
    if (w > MAX_SIDE || h > MAX_SIDE) {
        const s = Math.min(MAX_SIDE / w, MAX_SIDE / h);
        w *= s;
        h *= s;
    }
    const round16 = (n: number) => Math.max(256, Math.round(n / 16) * 16);
    let outW = round16(w);
    let outH = round16(h);
    while (outW * outH < MIN_PIXELS && outW < MAX_SIDE && outH < MAX_SIDE) {
        if (outW <= outH) outW += 16;
        else outH += 16;
    }
    return `${outW}x${outH}`;
}
