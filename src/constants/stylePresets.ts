import type { StylePreset } from '@/types/studio';

export const STYLE_PRESETS: StylePreset[] = [
    {
        id: 'placeholder-1',
        name: '风格占位 1',
        promptFragment: '',
    },
    {
        id: 'placeholder-2',
        name: '风格占位 2',
        promptFragment: '',
    },
    {
        id: 'placeholder-3',
        name: '风格占位 3',
        promptFragment: '',
    },
];

export function getStyleById(id: string | null | undefined): StylePreset | undefined {
    if (!id) return undefined;
    return STYLE_PRESETS.find(s => s.id === id);
}
