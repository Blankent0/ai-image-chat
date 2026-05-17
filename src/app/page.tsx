'use client';

import dynamic from 'next/dynamic';

const CanvasStudio = dynamic(
    () => import('@/components/canvas/CanvasStudio'),
    { ssr: false },
);

export default function Home() {
    return (
        <div className="studio-grain w-screen h-screen overflow-hidden">
            <CanvasStudio />
        </div>
    );
}
