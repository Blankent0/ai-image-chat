'use client';

import { Group, Image as KonvaImage, Rect, Text } from 'react-konva';
import useImage from 'use-image';
import type Konva from 'konva';
import type { CanvasNode } from '@/types/canvas';

interface Props {
    node: CanvasNode;
    isSelected: boolean;
    onSelect: () => void;
    onChange: (patch: Partial<CanvasNode>) => void;
}

export default function ImageNode({ node, isSelected, onSelect, onChange }: Props) {
    const [img] = useImage(node.status === 'ready' && node.url ? node.url : '');
    const isPlaceholder = node.status === 'placeholder' || node.status === 'generating';

    return (
        <Group
            x={node.x}
            y={node.y}
            draggable
            onMouseDown={onSelect}
            onTap={onSelect}
            onDragMove={(e: Konva.KonvaEventObject<DragEvent>) => {
                onChange({ x: e.target.x(), y: e.target.y() });
            }}
            onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
                onChange({ x: e.target.x(), y: e.target.y() });
            }}
        >
            {isPlaceholder ? (
                <>
                    <Rect
                        width={node.width}
                        height={node.height}
                        stroke={isSelected ? '#d6a86a' : '#6a5f54'}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        dash={[10, 6]}
                        fill="rgba(40, 36, 32, 0.5)"
                        cornerRadius={6}
                    />
                    <Text
                        x={0}
                        y={node.height / 2 - 9}
                        width={node.width}
                        align="center"
                        text={node.status === 'generating' ? '生成中…' : '占位 · 下方输入'}
                        fontSize={14}
                        fontFamily="serif"
                        fill="#9a8f80"
                    />
                </>
            ) : (
                <KonvaImage
                    image={img}
                    width={node.width}
                    height={node.height}
                    stroke={isSelected ? '#d6a86a' : '#2a2620'}
                    strokeWidth={isSelected ? 3 : 1}
                    shadowColor="black"
                    shadowBlur={isSelected ? 24 : 8}
                    shadowOpacity={0.45}
                    shadowOffset={{ x: 0, y: 8 }}
                />
            )}
        </Group>
    );
}
