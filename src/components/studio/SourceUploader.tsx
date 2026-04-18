'use client';

import { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import type { SourceImage } from '@/types/studio';

interface SourceUploaderProps {
    sourceImage: SourceImage | null;
    onSelect: (img: SourceImage) => void;
    onClear: () => void;
    disabled?: boolean;
}

export default function SourceUploader({ sourceImage, onSelect, onClear, disabled }: SourceUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const readFile = (file: File) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = () => {
            onSelect({ dataUrl: reader.result as string, name: file.name });
        };
        reader.readAsDataURL(file);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) readFile(file);
        if (inputRef.current) inputRef.current.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (disabled) return;
        const file = e.dataTransfer.files?.[0];
        if (file) readFile(file);
    };

    if (sourceImage) {
        return (
            <div className="relative group">
                <div className="w-full aspect-square rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                    <img src={sourceImage.dataUrl} alt={sourceImage.name} className="w-full h-full object-contain" />
                </div>
                {!disabled && (
                    <button
                        onClick={onClear}
                        className="absolute top-2 right-2 w-7 h-7 bg-[var(--color-surface)]/90 backdrop-blur hover:bg-[var(--color-danger)] text-[var(--color-ink-soft)] hover:text-white border border-[var(--color-border)] rounded-full flex items-center justify-center transition-colors"
                        title="移除图片"
                    >
                        <X size={14} />
                    </button>
                )}
                <p className="mt-2 text-[11px] text-[var(--color-ink-mute)] truncate font-mono">{sourceImage.name}</p>
            </div>
        );
    }

    return (
        <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => !disabled && inputRef.current?.click()}
            className={`w-full aspect-square rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 transition-all ${
                disabled
                    ? 'border-[var(--color-border)] bg-[var(--color-surface-raised)] cursor-not-allowed opacity-50'
                    : 'border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] cursor-pointer'
            }`}
        >
            <Upload size={22} className="text-[var(--color-ink-mute)]" />
            <p className="text-xs text-[var(--color-ink-soft)] text-center px-3 leading-relaxed">
                拖拽或点击上传<br />
                <span className="text-[10px] text-[var(--color-ink-mute)]">3D 模型渲染图</span>
            </p>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleChange}
                disabled={disabled}
            />
        </div>
    );
}
